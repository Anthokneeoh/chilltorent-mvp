'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { formatNaira, formatDate } from '@/lib/utils/formatters'
import { Home, Eye, MessageCircle, FileText, Clock, CheckCircle, Search, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Property = Database['public']['Tables']['properties']['Row']
type ViewingRequest = Database['public']['Tables']['viewing_requests']['Row'] & {
    property?: { title: string; annual_rent: number; lga: string; state: string }
    landlord?: { full_name: string; email: string }
}

type Agreement = Database['public']['Tables']['agreements']['Row'] & {
    property?: { title: string }
    landlord?: { full_name: string }
}

export default function TenantDashboard() {
    const router = useRouter()
    const { user, profile, isLoading: authLoading } = useAuth()

    const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
    const [agreements, setAgreements] = useState<Agreement[]>([])
    const [recentProperties, setRecentProperties] = useState<Property[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login')
            return
        }

        const hydrate = async () => {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Tenant dashboard metrics query timed out.')), 10000)
                )
                await Promise.race([fetchData(user.id), timeoutPromise])
            } catch (err) {
                console.error('Tenant hydration error:', err)
                setIsLoading(false)
            }
        }

        hydrate()
    }, [user, authLoading, router])

    const fetchData = async (tenantId: string) => {
        try {
            const { data: requestsData, error: reqError } = await (supabase
                .from('viewing_requests') as any)
                .select(`
                    id, status, created_at, tenant_id, landlord_id, property_id,
                    property:property_id (title, annual_rent, lga, state),
                    landlord:landlord_id (full_name, email)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (reqError) throw reqError
            if (requestsData) {
                setViewingRequests(requestsData as ViewingRequest[])
            }

            const { data: agreementsData, error: agrError } = await (supabase
                .from('agreements') as any)
                .select(`
                    id, status, generated_at, pdf_url, tenant_id, landlord_id, property_id,
                    property:property_id (title),
                    landlord:landlord_id (full_name)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (agrError) throw agrError
            if (agreementsData) {
                setAgreements(agreementsData as Agreement[])
            }

            const { data: recentProps, error: recentError } = await (supabase
                .from('properties') as any)
                .select('id, title, lga, state, annual_rent, bedrooms, bathrooms, is_furnished, status, created_at')
                .eq('status', 'ACTIVE')
                .limit(6)
                .order('created_at', { ascending: false })

            if (recentError) throw recentError
            if (recentProps) {
                setRecentProperties(recentProps as Property[])
            }
        } catch (err) {
            console.error('Fatal tenant metrics allocation breakdown:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const getRequestStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold"><Clock className="h-3 w-3" /> Awaiting Feedback</span>
            case 'ACCEPTED':
                return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full text-xs font-bold"><CheckCircle className="h-3 w-3" /> Confirmed</span>
            case 'DECLINED':
                return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Declined</span>
            case 'COMPLETED':
                return <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Inspection Wrapped</span>
            default:
                return <span className="text-xs font-bold text-stone-slate bg-pale-ash/40 px-2.5 py-0.5 rounded-full">{status}</span>
        }
    }

    const getAgreementStatusBadge = (status: string) => {
        switch (status) {
            case 'GENERATED':
                return <span className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Ready for Execution</span>
            case 'DOWNLOADED_TENANT':
                return <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Downloaded</span>
            default:
                return <span className="bg-pale-ash/40 text-charcoal-tone px-2.5 py-0.5 rounded-full text-xs font-bold">Draft File</span>
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cloud-whisper">
                <Loader2 className="h-8 w-8 text-sky-connect animate-spin" />
            </div>
        )
    }

    if (isLoading) {
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

                        {/* Welcome Back Banner Header */}
                        <div className="bg-pure-white p-6 rounded-2xl border border-pale-ash/40 shadow-subtle flex items-center gap-4">
                            <div className="p-3 bg-cloud-whisper border border-pale-ash/40 rounded-xl text-sky-connect">
                                <Home className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">Welcome Back, {profile?.full_name || 'Tenant'}</h1>
                                <p className="text-xs font-medium text-inkwell-gray mt-1">Track upcoming viewings, digital agreements, and tailored property metrics across Lagos.</p>
                            </div>
                        </div>

                        {/* Aggregated Quick-Metric Summaries */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-inkwell-gray">Viewing Requests</p>
                                    <p className="text-3xl font-black text-charcoal-tone mt-1">{viewingRequests.length}</p>
                                </div>
                                <div className="p-3 bg-sky-connect/5 rounded-xl"><Eye className="h-6 w-6 text-sky-connect" /></div>
                            </div>

                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-green-600">Active Legal Leases</p>
                                    <p className="text-3xl font-black text-green-600 mt-1">{agreements.filter(a => a.status !== 'DRAFT').length}</p>
                                </div>
                                <div className="p-3 bg-green-500/5 rounded-xl"><FileText className="h-6 w-6 text-green-500" /></div>
                            </div>

                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Awaiting Approvals</p>
                                    <p className="text-3xl font-black text-amber-600 mt-1">{viewingRequests.filter(r => r.status === 'PENDING').length}</p>
                                </div>
                                <div className="p-3 bg-amber-500/5 rounded-xl"><Clock className="h-6 w-6 text-amber-500" /></div>
                            </div>
                        </div>

                        {/* Viewing Progress Trackers */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-charcoal-tone">Your Inspection Enquiries</h2>
                            {viewingRequests.length === 0 ? (
                                <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-8 text-center space-y-4">
                                    <Eye className="h-10 w-10 mx-auto text-stone-slate/50" />
                                    <p className="text-sm font-semibold text-stone-slate">No rental unit inspection loops initiated yet.</p>
                                    <Link href="/" className="inline-block">
                                        <Button variant="secondary" className="rounded-xl font-bold text-xs">Explore Active Catalog</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {viewingRequests.map((request) => (
                                        <div key={request.id} className="bg-pure-white border border-pale-ash/40 rounded-xl p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-pale-ash">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-charcoal-tone text-sm sm:text-base">{request.property?.title || 'Real Estate Unit'}</p>
                                                <p className="text-xs font-semibold text-sky-connect">
                                                    {request.property?.lga}, {request.property?.state} <span className="text-pale-ash mx-1.5">•</span> {formatNaira(request.property?.annual_rent || 0)}/yr
                                                </p>
                                                <p className="text-[11px] font-medium text-stone-slate pt-1">
                                                    Assigned Landlord: {request.landlord?.full_name || 'Asset Manager'} <span className="mx-1">•</span> Lodged: {formatDate(request.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                                {getRequestStatusBadge(request.status)}
                                                {request.status === 'ACCEPTED' && (
                                                    <Link href={`/tenant/chat?request=${request.id}`} className="shrink-0">
                                                        <button className="px-4 py-1.5 bg-sky-connect text-pure-white rounded-xl text-xs font-bold hover:bg-sky-connect/90 transition-colors flex items-center gap-1.5 shadow-sm">
                                                            <MessageCircle className="h-3.5 w-3.5" />
                                                            Open Chat
                                                        </button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Lease Agreements Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-charcoal-tone">Lease Documentation Packets</h2>
                            {agreements.length === 0 ? (
                                <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-8 text-center text-sm font-semibold text-stone-slate">
                                    <FileText className="h-10 w-10 mx-auto text-stone-slate/40 mb-2" />
                                    No legal tenancy agreements generated yet. These update dynamically following landlord verification confirmations.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-pale-ash/40 shadow-subtle bg-pure-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-pale-ash bg-cloud-whisper/40 text-xs font-bold uppercase tracking-wider text-inkwell-gray">
                                                <th className="px-6 py-3.5">Asset Reference</th>
                                                <th className="px-6 py-3.5">Landlord Executioner</th>
                                                <th className="px-6 py-3.5">Legal Status</th>
                                                <th className="px-6 py-3.5">Execution Timestamp</th>
                                                <th className="px-6 py-3.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-pale-ash/40 text-sm font-medium">
                                            {agreements.map((agreement) => (
                                                <tr key={agreement.id} className="hover:bg-cloud-whisper/20 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-charcoal-tone">{agreement.property?.title || 'Tenancy Framework'}</td>
                                                    <td className="px-6 py-4 text-inkwell-gray font-semibold text-xs">{agreement.landlord?.full_name || 'Asset Owner'}</td>
                                                    <td className="px-6 py-4">{getAgreementStatusBadge(agreement.status)}</td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-stone-slate">{agreement.generated_at ? formatDate(agreement.generated_at) : 'Awaiting Generation'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {agreement.pdf_url && agreement.status !== 'DRAFT' && (
                                                            <a
                                                                href={agreement.pdf_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-bold text-sky-connect hover:underline pr-4"
                                                            >
                                                                Download Legal PDF
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Tailored Catalog Discover Feeds */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-charcoal-tone">Recommended Properties For You</h2>
                                <Link href="/" className="text-xs font-bold text-sky-connect hover:underline flex items-center gap-1">
                                    View full index catalog <Search className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            {recentProperties.length === 0 ? (
                                <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-8 text-center text-sm font-semibold text-stone-slate">
                                    No direct context matches found. Browse active feeds to calibrate recommendations.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recentProperties.map((property) => (
                                        <Link key={property.id} href={`/properties/${property.id}`}>
                                            <div className="bg-pure-white border border-pale-ash/40 rounded-xl p-4 shadow-subtle hover:shadow-md hover:border-pale-ash transition-all cursor-pointer space-y-2">
                                                <h3 className="font-bold text-charcoal-tone text-sm truncate">{property.title}</h3>
                                                <p className="text-xs font-medium text-stone-slate">{property.lga}, {property.state}</p>
                                                <p className="text-lg font-black text-sky-connect tracking-tight">
                                                    {formatNaira(property.annual_rent)}<span className="text-xs font-medium text-inkwell-gray"> / yr</span>
                                                </p>
                                                <div className="flex items-center gap-2 pt-1 text-xs font-bold text-stone-slate/80">
                                                    <span className="bg-cloud-whisper/80 border border-pale-ash/30 px-2 py-0.5 rounded-md">{property.bedrooms} Bed</span>
                                                    <span className="bg-cloud-whisper/80 border border-pale-ash/30 px-2 py-0.5 rounded-md">{property.bathrooms} Bath</span>
                                                    {property.is_furnished && (
                                                        <span className="bg-sky-connect/5 text-sky-connect border border-sky-connect/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-black">Furnished</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </>
    )
}
