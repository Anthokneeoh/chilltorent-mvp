'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { formatNaira, formatDate } from '@/lib/utils/formatters'
import { Home, CheckCircle, Clock, AlertCircle, Users, Building, Eye, FileText, TrendingUp, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

interface MetricCardProps {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    trend?: string
    color?: 'sky' | 'green' | 'yellow' | 'purple' | 'red'
}

function MetricCard({ title, value, icon: Icon, trend, color = 'sky' }: MetricCardProps) {
    const colors: Record<string, string> = {
        sky: 'bg-sky-connect/5 text-sky-connect border-sky-connect/10',
        green: 'bg-green-50 text-green-700 border-green-100',
        yellow: 'bg-amber-50 text-amber-700 border-amber-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        red: 'bg-red-50 text-red-700 border-red-100',
    }

    return (
        <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-6 shadow-subtle flex items-center justify-between transition-all hover:border-pale-ash">
            <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-inkwell-gray">{title}</p>
                <p className="text-3xl font-black tracking-tight text-charcoal-tone">{value}</p>
                {trend && <p className="text-[11px] font-bold text-green-600 pt-1">{trend}</p>}
            </div>
            <div className={`p-3 rounded-xl border ${colors[color]} shrink-0`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    )
}

interface MetricCounts {
    totalUsers: number
    totalLandlords: number
    totalTenants: number
    totalProperties: number
    activeListings: number
    pendingListings: number
    pendingKYC: number
    viewingRequests: number
    agreementsGenerated: number
}

export default function AdminDashboard() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [metrics, setMetrics] = useState<MetricCounts>({
        totalUsers: 0,
        totalLandlords: 0,
        totalTenants: 0,
        totalProperties: 0,
        activeListings: 0,
        pendingListings: 0,
        pendingKYC: 0,
        viewingRequests: 0,
        agreementsGenerated: 0,
    })
    const [recentActivities, setRecentActivities] = useState<any[]>([])

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login')
            return
        }

        const verifyAdminAuthorization = async () => {
            try {
                const { data: profile } = await (supabase
                    .from('profiles') as any)
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role !== 'admin') {
                    router.push('/')
                    return
                }

                setIsAdmin(true)
                await Promise.all([fetchMetrics(), fetchRecentActivity()])
            } catch (err) {
                console.error('Security authorization boundary failure:', err)
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }

        verifyAdminAuthorization()
    }, [user, authLoading, router])

    const fetchMetrics = async () => {
        try {
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
                (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }),
                (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('role', 'landlord'),
                (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
                (supabase.from('properties') as any).select('*', { count: 'exact', head: true }),
                (supabase.from('properties') as any).select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
                (supabase.from('properties') as any).select('*', { count: 'exact', head: true }).in('status', ['PENDING_PAYMENT', 'PENDING_APPROVAL']),
                (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('kyc_verified', false).eq('role', 'landlord'),
                (supabase.from('viewing_requests') as any).select('*', { count: 'exact', head: true }),
                (supabase.from('agreements') as any).select('*', { count: 'exact', head: true }),
            ])

            setMetrics({
                totalUsers: totalUsers || 0,
                totalLandlords: totalLandlords || 0,
                totalTenants: totalTenants || 0,
                totalProperties: totalProperties || 0,
                activeListings: activeListings || 0,
                pendingListings: pendingListings || 0,
                pendingKYC: pendingKYC || 0,
                viewingRequests: viewingRequests || 0,
                agreementsGenerated: agreementsGenerated || 0,
            })
        } catch (err) {
            console.error('Metric hydration runtime matrix error:', err)
        }
    }

    const fetchRecentActivity = async () => {
        try {
            const { data: recentProperties } = await (supabase
                .from('properties') as any)
                .select('id, title, status, created_at, landlord:profiles!landlord_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(5)

            const { data: recentViewings } = await (supabase
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

            setRecentActivities(compiledActivities)
        } catch (err) {
            console.error('Failed to aggregate recent platform tracking parameters:', err)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            ACTIVE: 'bg-green-50 text-green-700 border-green-100',
            PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-100',
            PENDING_APPROVAL: 'bg-sky-50 text-sky-700 border-sky-100',
            PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
            ACCEPTED: 'bg-green-50 text-green-700 border-green-100',
            DECLINED: 'bg-red-50 text-red-700 border-red-100',
        }
        return statusMap[status] || 'bg-pale-ash/40 text-charcoal-tone border-pale-ash/60'
    }

    if (isLoading || authLoading || !isAdmin) {
        return (
            <>
                <Navbar />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 md:ml-64 flex items-center justify-center min-h-screen bg-cloud-whisper">
                        <Loader2 className="h-8 w-8 text-sky-connect animate-spin" />
                    </main>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Header Content Section */}
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Admin Console</h1>
                            <p className="text-sm font-medium text-inkwell-gray mt-1">Real-time portfolio metrics, user operational registries, and systemic overview parameters</p>
                        </div>

                        {/* Comprehensive Dynamic Analytical Metrics Grids */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <MetricCard title="Aggregated Accounts" value={metrics.totalUsers} icon={Users} color="sky" />
                            <MetricCard title="Registered Landlords" value={metrics.totalLandlords} icon={Building} color="purple" />
                            <MetricCard title="Verified Tenants" value={metrics.totalTenants} icon={Users} color="green" />
                            <MetricCard title="Portfolio Assets" value={metrics.totalProperties} icon={Home} color="sky" />
                            <MetricCard title="Live Marketplace Listings" value={metrics.activeListings} icon={CheckCircle} color="green" />
                            <MetricCard title="Awaiting Verification Review" value={metrics.pendingListings} icon={Clock} color="yellow" />
                            <MetricCard title="KYC Verification Backlog" value={metrics.pendingKYC} icon={AlertCircle} color="red" />
                            <MetricCard title="Total Viewing Loops" value={metrics.viewingRequests} icon={Eye} color="purple" />
                            <MetricCard title="Legal Tenancy Deeds" value={metrics.agreementsGenerated} icon={FileText} color="sky" />
                        </div>

                        {/* Quick Action Router Anchors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-6 shadow-subtle space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-base font-bold text-charcoal-tone">Real Estate Approvals Queue</h2>
                                    <p className="text-xs font-medium text-stone-slate">{metrics.pendingListings} property asset profile designs awaiting structural verification check loops.</p>
                                </div>
                                <Button onClick={() => router.push('/admin/listings-queue')} variant="secondary" className="rounded-xl text-xs font-bold px-4">
                                    Open Listings Queue
                                </Button>
                            </div>

                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-6 shadow-subtle space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-base font-bold text-charcoal-tone">Lessor Identity Verification (KYC)</h2>
                                    <p className="text-xs font-medium text-stone-slate">{metrics.pendingKYC} structural ownership certificate files linked awaiting validation approval marks.</p>
                                </div>
                                <Button onClick={() => router.push('/admin/kyc-queue')} variant="secondary" className="rounded-xl text-xs font-bold px-4">
                                    Open Verification Queue
                                </Button>
                            </div>
                        </div>

                        {/* Event Activity Logging Panel */}
                        <div className="bg-pure-white border border-pale-ash/40 rounded-2xl shadow-subtle p-6 space-y-4">
                            <h2 className="text-base font-bold text-charcoal-tone">Recent Platform Activity Records</h2>
                            {recentActivities.length === 0 ? (
                                <p className="text-xs font-semibold text-stone-slate text-center py-6">No historical transactional adjustments captured within this tracking lifecycle.</p>
                            ) : (
                                <div className="divide-y divide-pale-ash/30 text-xs font-medium">
                                    {recentActivities.map((activity, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 animate-in fade-in duration-150">
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-charcoal-tone leading-relaxed truncate">
                                                    {activity.type === 'property' ? (
                                                        <>🏠 New Asset Listing <span className="font-bold text-charcoal-tone">"${activity.title}"</span> submitted by <span className="text-sky-connect font-bold">{activity.user}</span></>
                                                    ) : (
                                                        <>👁️ Inspection request initialized for <span className="font-bold text-charcoal-tone">"${activity.property}"</span> by <span className="text-sky-connect font-bold">{activity.user}</span></>
                                                    )}
                                                </p>
                                                <p className="text-[10px] font-semibold text-stone-slate/60">{formatDate(activity.created_at)}</p>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider shrink-0 ${getStatusBadge(activity.status)}`}>
                                                {activity.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Telemetry Integration Metrics Footer */}
                        <div className="p-4 bg-cloud-whisper/60 border border-pale-ash/30 rounded-2xl text-center text-xs font-bold text-inkwell-gray flex items-center justify-center gap-2">
                            <TrendingUp className="h-4 w-4 text-sky-connect shrink-0" />
                            <span>Granular user funnel tracking and conversion attributes are piped natively into your active PostHog collection cluster configuration frameworks.</span>
                        </div>

                    </div>
                </main>
            </div>
        </>
    )
}