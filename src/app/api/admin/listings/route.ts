import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, hasRole } from '@/lib/supabase/server'

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
            .select('title, landlord:profiles!landlord_id(email)')
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

        return NextResponse.json({ success: true, email: property.landlord?.email, title: property.title })
    } catch (err: any) {
        console.error('Fatal Listings Queue POST Error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server boundary crash during listings update' },
            { status: 500 }
        )
    }
}
