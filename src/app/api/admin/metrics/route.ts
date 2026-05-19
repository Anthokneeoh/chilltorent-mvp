import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, hasRole } from '@/lib/supabase/server'

export async function GET() {
    try {
        const isAdmin = await hasRole('admin')
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can query platform metrics' },
                { status: 403 }
            )
        }

        const supabaseAdmin = await createAdminSupabaseClient()

        // Fetch metrics using the privileged admin client
        const [
            { count: totalUsers },
            { count: totalLandlords },
            { count: totalTenants },
            { count: totalProperties },
            { count: activeListings },
            { count: pendingListings },
            { count: pendingKYC },
            { count: viewingRequests },
            { count: agreementsGenerated },
        ] = await Promise.all([
            (supabaseAdmin.from('profiles') as any).select('*', { count: 'exact', head: true }),
            (supabaseAdmin.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('role', 'landlord'),
            (supabaseAdmin.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
            (supabaseAdmin.from('properties') as any).select('*', { count: 'exact', head: true }),
            (supabaseAdmin.from('properties') as any).select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
            (supabaseAdmin.from('properties') as any).select('*', { count: 'exact', head: true }).in('status', ['PENDING_PAYMENT', 'PENDING_APPROVAL']),
            (supabaseAdmin.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('kyc_verified', false).eq('role', 'landlord'),
            (supabaseAdmin.from('viewing_requests') as any).select('*', { count: 'exact', head: true }),
            (supabaseAdmin.from('agreements') as any).select('*', { count: 'exact', head: true }),
        ])

        const metrics = {
            totalUsers: totalUsers || 0,
            totalLandlords: totalLandlords || 0,
            totalTenants: totalTenants || 0,
            totalProperties: totalProperties || 0,
            activeListings: activeListings || 0,
            pendingListings: pendingListings || 0,
            pendingKYC: pendingKYC || 0,
            viewingRequests: viewingRequests || 0,
            agreementsGenerated: agreementsGenerated || 0,
        }

        // Fetch recent activity
        const { data: recentProperties } = await (supabaseAdmin
            .from('properties') as any)
            .select('id, title, status, created_at, landlord:profiles!landlord_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(5)

        const { data: recentViewings } = await (supabaseAdmin
            .from('viewing_requests') as any)
            .select('id, status, created_at, property:property_id(title), tenant:tenant_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(5)

        const compiledActivities = [
            ...(recentProperties || []).map((p: any) => ({
                type: 'property',
                title: p.title,
                status: p.status,
                created_at: p.created_at,
                user: p.landlord?.full_name || 'Landlord Profile Instance',
            })),
            ...(recentViewings || []).map((v: any) => ({
                type: 'viewing',
                property: v.property?.title,
                status: v.status,
                created_at: v.created_at,
                user: v.tenant?.full_name || 'Prospect Tenant Profile',
            })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)

        return NextResponse.json({ metrics, activities: compiledActivities })
    } catch (err: any) {
        console.error('Fatal Admin Metrics GET Error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server boundary crash during metrics fetch' },
            { status: 500 }
        )
    }
}
