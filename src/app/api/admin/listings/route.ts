import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, hasRole } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function GET() {
    try {
        const isAdmin = await hasRole('admin')
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can query listings queue' },
                { status: 403 }
            )
        }

        const supabaseAdmin = await createAdminSupabaseClient()

        // 1. Fetch properties awaiting approval
        const { data: listingsData, error: listingsError } = await (supabaseAdmin
            .from('properties') as any)
            .select(`
                id, title, status, created_at, address, lga, state, annual_rent, total_package, bedrooms, bathrooms, property_type, is_furnished, electricity_band, water_source, security_rating, road_condition, landlord_id,
                landlord:landlord_id (full_name, email, kyc_verified)
            `)
            .in('status', ['PENDING_PAYMENT', 'PENDING_APPROVAL'])
            .order('created_at', { ascending: true })

        if (listingsError) throw listingsError

        const listings = listingsData || []
        if (listings.length === 0) {
            return NextResponse.json({ listings: [] })
        }

        const propertyIds = listings.map((p: any) => p.id)

        // 2. Fetch media list
        const { data: mediaData, error: mediaError } = await (supabaseAdmin
            .from('property_media') as any)
            .select('property_id, url, media_type, is_thumbnail')
            .in('property_id', propertyIds)
            .order('sort_order', { ascending: true })

        if (mediaError) throw mediaError

        const mediaMap: Record<string, any[]> = {}
        mediaData?.forEach((item: any) => {
            if (!mediaMap[item.property_id]) {
                mediaMap[item.property_id] = []
            }
            if (mediaMap[item.property_id].length === 0) {
                mediaMap[item.property_id].push(item)
            }
        })

        // 3. Compile listings with media
        const compiledQueue = listings.map((property: any) => ({
            ...property,
            media: mediaMap[property.id] || [],
        }))

        // Log results to assist debugging (Fix 6)
        console.log(`[LISTINGS QUEUE] Fetched ${compiledQueue.length} listings awaiting approval.`)

        return NextResponse.json({ listings: compiledQueue })
    } catch (err: any) {
        console.error('Fatal Listings Queue GET Error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server boundary crash during listings fetch' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const isAdmin = await hasRole('admin')
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can modify listings status' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { propertyId, action, reason } = body

        if (!propertyId || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Missing or invalid fields: propertyId and action ("approve" | "reject") are required.' },
                { status: 400 }
            )
        }

        const supabaseAdmin = await createAdminSupabaseClient()

        // Fetch property landlord details
        const { data: property, error: fetchError } = await (supabaseAdmin
            .from('properties') as any)
            .select('title, landlord:profiles!landlord_id(email, full_name)')
            .eq('id', propertyId)
            .single()

        if (fetchError || !property) {
            return NextResponse.json(
                { error: 'Property not found in registry.' },
                { status: 404 }
            )
        }

        const newStatus = action === 'approve' ? 'ACTIVE' : 'REJECTED'

        // Commit status change
        const { error: updateError } = await (supabaseAdmin
            .from('properties') as any)
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', propertyId)

        if (updateError) throw updateError

        console.log(`[PROPERTY ${action.toUpperCase()}] Property: ${propertyId}`)

        // Send email notification to landlord
        if (property.landlord?.email) {
            try {
                if (!process.env.RESEND_API_KEY) {
                    console.warn('[WARNING] RESEND_API_KEY is missing. Skipping email notification.')
                } else {
                    const recipientName = property.landlord.full_name || 'Landlord'
                    const subject = action === 'approve'
                        ? `Your ChillToRent listing "${property.title}" is now Approved!`
                        : `Action Required: Your ChillToRent listing "${property.title}" has been Declined`

                    const html = action === 'approve'
                        ? `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <h2 style="color: #10b981; margin-bottom: 4px;">ChillToRent</h2>
                                <h3 style="color: #0f172a; margin-top: 0;">Listing Approved</h3>
                                <p style="color: #334155; font-size: 16px;">Hello <strong>${recipientName}</strong>,</p>
                                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                                    We are pleased to inform you that your property listing for <strong>"${property.title}"</strong> has been approved and is now active on our marketplace.
                                </p>
                                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                                    Prospective tenants can now view your listing, schedule tours, and contact you directly.
                                </p>
                                <p style="color: #475569; font-size: 15px; line-height: 1.6; font-weight: bold;">
                                    Next Steps:
                                </p>
                                <ul style="color: #475569; font-size: 15px; line-height: 1.6;">
                                    <li>Monitor your messages for viewing requests.</li>
                                    <li>Keep your listing details up to date in the landlord hub.</li>
                                </ul>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/landlord/properties" style="background: #0061ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-top: 16px;">Manage Your Properties</a>
                            </div>
                        `
                        : `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <h2 style="color: #ef4444; margin-bottom: 4px;">ChillToRent</h2>
                                <h3 style="color: #0f172a; margin-top: 0;">Listing Update Required</h3>
                                <p style="color: #334155; font-size: 16px;">Hello <strong>${recipientName}</strong>,</p>
                                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                                    Thank you for submitting your property listing for <strong>"${property.title}"</strong>. Unfortunately, we could not approve your listing in its current state.
                                </p>
                                ${reason ? `
                                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
                                    <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0 0 6px 0;">Feedback from Review Team:</p>
                                    <p style="color: #7f1d1d; font-size: 14px; margin: 0; font-family: monospace; white-space: pre-wrap;">${reason}</p>
                                </div>
                                ` : ''}
                                <p style="color: #475569; font-size: 15px; line-height: 1.6; font-weight: bold;">
                                    Next Steps:
                                </p>
                                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                                    Please log in to your landlord portal, update the listing with the requested changes or correct documentation, and resubmit it for review.
                                </p>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/landlord/properties" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-top: 16px;">Review Listing Details</a>
                            </div>
                        `

                    await sendEmail({
                        to: property.landlord.email,
                        subject,
                        html,
                    })
                }
            } catch (emailErr) {
                console.error('[ERROR] Failed to dispatch property status email:', emailErr)
            }
        }

        return NextResponse.json({ success: true, email: property.landlord?.email, title: property.title })
    } catch (err: any) {
        console.error('Fatal Listings Queue POST Error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server boundary crash during listings update' },
            { status: 500 }
        )
    }
}
