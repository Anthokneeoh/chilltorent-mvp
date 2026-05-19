import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, hasRole } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function POST(request: Request) {
    try {
        // 1. Enforce strict admin authorization boundary check
        const isAdmin = await hasRole('admin')
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can modify KYC verification status' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { landlordId, action, reason } = body

        if (!landlordId || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Missing or invalid fields: landlordId and action ("approve" | "reject") are required.' },
                { status: 400 }
            )
        }

        // 2. Instantiate the privileged admin client using service role credentials
        const supabaseAdmin = await createAdminSupabaseClient()

        // Fetch landlord profile to retrieve full name and email for notification
        const { data: landlord, error: fetchError } = await (supabaseAdmin
            .from('profiles') as any)
            .select('full_name, email')
            .eq('id', landlordId)
            .single()

        if (fetchError || !landlord) {
            return NextResponse.json(
                { error: 'Landlord profile not found in system registry.' },
                { status: 404 }
            )
        }

        const newVerificationState = action === 'approve'

        // 3. Commit mutation server-side
        const { error: updateError } = await (supabaseAdmin
            .from('profiles') as any)
            .update({ kyc_verified: newVerificationState })
            .eq('id', landlordId)

        if (updateError) throw updateError

        // Log transaction metrics securely
        if (action === 'reject') {
            console.log(`[KYC DEACTIVATION REGISTERED] Landlord: ${landlordId}. Reason: ${reason || 'No specific reason provided.'}`)
        } else {
            console.log(`[KYC APPROVAL REGISTERED] Landlord: ${landlordId}`)
        }

        // 4. Dispatch notification email using Resend
        try {
            const subject = newVerificationState 
                ? 'Your ChillToRent Landlord KYC has been Approved!'
                : 'Action Required: Your ChillToRent Landlord KYC Status Update'
            
            const html = newVerificationState
                ? `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #10b981; margin-bottom: 4px;">ChillToRent</h2>
                        <h3 style="color: #0f172a; margin-top: 0;">Verification Status Approved</h3>
                        <p style="color: #334155; font-size: 16px;">Hello <strong>${landlord.full_name}</strong>,</p>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            We are pleased to inform you that your landlord identity verification (KYC) has been successfully audited and approved.
                        </p>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            You can now list and publish properties to the active public marketplace.
                        </p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/landlord" style="background: #0061ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-top: 16px;">Go to Landlord Hub</a>
                    </div>
                `
                : `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #ef4444; margin-bottom: 4px;">ChillToRent</h2>
                        <h3 style="color: #0f172a; margin-top: 0;">Verification Update</h3>
                        <p style="color: #334155; font-size: 16px;">Hello <strong>${landlord.full_name}</strong>,</p>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            We have reviewed your verification details and unfortunately we could not verify your identity at this time.
                        </p>
                        ${reason ? `
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
                            <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0 0 6px 0;">Feedback from Review Team:</p>
                            <p style="color: #7f1d1d; font-size: 14px; margin: 0; font-family: monospace; white-space: pre-wrap;">${reason}</p>
                        </div>
                        ` : ''}
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            Please re-verify your documents in the dashboard, or contact support if you have any questions.
                        </p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/landlord" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-top: 16px;">Review Verification Details</a>
                    </div>
                `

            await sendEmail({
                to: landlord.email,
                subject,
                html,
            })
        } catch (emailErr) {
            console.error('Failed to dispatch KYC notification email:', emailErr)
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Fatal KYC Admin Endpoint Error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server boundary crash during KYC mutation' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const isAdmin = await hasRole('admin')
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can query KYC queue' },
                { status: 403 }
            )
        }

        const supabaseAdmin = await createAdminSupabaseClient()

        // Fetch landlords needing KYC verification
        const { data: landlordsData, error: landlordError } = await (supabaseAdmin
            .from('profiles') as any)
            .select('id, role, full_name, email, phone, kyc_verified, created_at')
            .eq('role', 'landlord')
            .eq('kyc_verified', false)
            .order('created_at', { ascending: true })

        if (landlordError) throw landlordError

        const landlords = landlordsData || []
        if (landlords.length === 0) {
            return NextResponse.json({ landlords: [] })
        }

        const landlordIds = landlords.map((l: any) => l.id)

        // Fetch properties with ownership docs for these landlords
        const { data: propertiesData, error: propertiesError } = await (supabaseAdmin
            .from('properties') as any)
            .select('id, title, ownership_doc_url, landlord_id')
            .in('landlord_id', landlordIds)
            .not('ownership_doc_url', 'is', null)

        if (propertiesError) throw propertiesError

        const properties = propertiesData || []

        // Group properties by landlord_id
        const propertiesMap: Record<string, any[]> = {}
        properties.forEach((prop: any) => {
            if (!propertiesMap[prop.landlord_id]) {
                propertiesMap[prop.landlord_id] = []
            }
            propertiesMap[prop.landlord_id].push({
                id: prop.id,
                title: prop.title,
                ownership_doc_url: prop.ownership_doc_url,
            })
        })

        // Combine profile and properties
        const landlordsWithDocs = landlords.map((l: any) => ({
            ...l,
            properties: propertiesMap[l.id] || [],
        }))

        return NextResponse.json({ landlords: landlordsWithDocs })
    } catch (err: any) {
        console.error('Fatal KYC Queue GET Error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server boundary crash during KYC fetch' },
            { status: 500 }
        )
    }
}
