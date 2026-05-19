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
import { PlusCircle, Home, Eye, MessageCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Property = Database['public']['Tables']['properties']['Row']
type ViewingRequest = Database['public']['Tables']['viewing_requests']['Row'] & {
    tenant?: { full_name: string; email: string }
    property?: { title: string }
}

export default function LandlordDashboard() {
    const router = useRouter()
    const { user, profile, isLoading: authLoading } = useAuth()

    const [properties, setProperties] = useState<Property[]>([])
    const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingIds, setProcessingIds] = useState<string[]>([])

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            router.push('/login')
            return
        }

        const hydrate = async () => {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Landlord dashboard metrics query timed out.')), 10000)
                )
                await Promise.race([fetchData(user.id), timeoutPromise])
            } catch (err) {
                console.error('Landlord hydration error:', err)
                setIsLoading(false)
            }
        }

        hydrate()
    }, [user, authLoading, router])

    const fetchData = async (landlordId: string) => {
        try {
            const { data: propertiesData, error: propsError } = await (supabase
                .from('properties') as any)
                .select('*')
                .eq('landlord_id', landlordId)
                .order('created_at', { ascending: false })

            if (!propsError && propertiesData) {
                setProperties(propertiesData as Property[])
            }

            const { data: requestsData, error: reqError } = await (supabase
                .from('viewing_requests') as any)
                .select(`
          *,
          tenant:tenant_id (full_name, email),
          property:property_id (title)
        `)
                .eq('landlord_id', landlordId)
                .order('created_at', { ascending: false })

            if (!reqError && requestsData) {
                setViewingRequests(requestsData as ViewingRequest[])
            }
        } catch (err) {
            console.error('Fatal metric load exception:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold"><CheckCircle className="h-3 w-3" /> Active Listing</span>
            case 'PENDING_PAYMENT':
                return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-bold"><Clock className="h-3 w-3" /> Awaiting Payment</span>
            case 'PENDING_APPROVAL':
                return <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full text-xs font-bold"><Clock className="h-3 w-3" /> Under Review</span>
            case 'RENTED':
                return <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-bold"><CheckCircle className="h-3 w-3" /> Rented Out</span>
            default:
                return <span className="text-stone-slate bg-pale-ash/40 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>
        }
    }

    const getRequestStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Pending Approval</span>
            case 'CONFIRMED':
                return <span className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Inspection Confirmed</span>
            case 'DECLINED':
                return <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Declined</span>
            case 'COMPLETED':
                return <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Inspection Completed</span>
            default:
                return <span className="bg-pale-ash/40 text-charcoal-tone px-2.5 py-0.5 rounded-full text-xs font-bold">{status}</span>
        }
    }

    const updateRequestStatus = async (requestId: string, newStatus: string) => {
        setProcessingIds(prev => [...prev, requestId])
        try {
            const payload: Database['public']['Tables']['viewing_requests']['Update'] = { status: newStatus as any }
            const { error } = await (supabase.from('viewing_requests') as any)
                .update(payload)
                .eq('id', requestId)

            if (error) throw error
            if (user) await fetchData(user.id)
        } catch (err) {
            console.error('Failed to change request state tracking matrix:', err)
            alert('Could not update status parameters.')
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== requestId))
        }
    }

    if (isLoading || authLoading) {
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

                        {/* Main Title Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">Landlord Dashboard</h1>
                                <p className="text-sm font-medium text-inkwell-gray mt-1">Welcome back, {profile?.full_name || 'Asset Manager'} — Oversee listed parameters and sync live tenant request arrays</p>
                            </div>
                            <Link href="/landlord/properties/new" className="shrink-0">
                                <Button className="flex items-center gap-2 rounded-xl py-2.5 font-bold text-sm shadow-sm">
                                    <PlusCircle className="h-4 w-4" />
                                    List New Asset
                                </Button>
                            </Link>
                        </div>

                        {/* Aggregated Analytical Metrics Panels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-inkwell-gray">Total Portfolio</p>
                                    <p className="text-3xl font-black text-charcoal-tone mt-1">{properties.length}</p>
                                </div>
                                <div className="p-3 bg-sky-connect/5 rounded-xl"><Home className="h-6 w-6 text-sky-connect" /></div>
                            </div>

                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-inkwell-gray">Live Feed Listings</p>
                                    <p className="text-3xl font-black text-green-600 mt-1">{properties.filter(p => p.status === 'ACTIVE').length}</p>
                                </div>
                                <div className="p-3 bg-green-500/5 rounded-xl"><CheckCircle className="h-6 w-6 text-green-500" /></div>
                            </div>

                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-inkwell-gray">Review Queues</p>
                                    <p className="text-3xl font-black text-amber-600 mt-1">{properties.filter(p => p.status === 'PENDING_APPROVAL' || p.status === 'PENDING_PAYMENT').length}</p>
                                </div>
                                <div className="p-3 bg-amber-500/5 rounded-xl"><Clock className="h-6 w-6 text-amber-500" /></div>
                            </div>

                            <div className="bg-pure-white border border-pale-ash/40 rounded-2xl p-5 shadow-subtle flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-inkwell-gray">Open Inquiries</p>
                                    <p className="text-3xl font-black text-purple-600 mt-1">{viewingRequests.filter(r => r.status === 'PENDING').length}</p>
                                </div>
                                <div className="p-3 bg-purple-500/5 rounded-xl"><Eye className="h-6 w-6 text-purple-500" /></div>
                            </div>
                        </div>

                        {/* Viewing Requests Pipeline Streams */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-charcoal-tone">Recent Viewing Enquiries</h2>
                            {viewingRequests.length === 0 ? (
                                <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-8 text-center text-sm font-semibold text-stone-slate">
                                    No tenant viewing inquiries recorded against your portfolio registry.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {viewingRequests.slice(0, 5).map((request) => {
                                        const isMutating = processingIds.includes(request.id)
                                        return (
                                            <div key={request.id} className="bg-pure-white border border-pale-ash/40 rounded-xl p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-pale-ash">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-charcoal-tone text-sm md:text-base">
                                                        {request.property?.title || 'Asset Unit'} <span className="text-stone-slate font-medium text-xs mx-1">→ Requested by</span> {request.tenant?.full_name || 'Prospect'}
                                                    </p>
                                                    <p className="text-xs font-medium text-inkwell-gray">{request.tenant?.email}</p>
                                                    <p className="text-[11px] font-semibold text-stone-slate">Dispatched Frame: {formatDate(request.created_at)}</p>
                                                </div>

                                                <div className="flex items-center gap-3 self-end md:self-auto">
                                                    {getRequestStatusBadge(request.status)}
                                                    {request.status === 'PENDING' && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateRequestStatus(request.id, 'CONFIRMED')}
                                                                disabled={isMutating}
                                                                className="px-4 py-1.5 bg-sky-connect text-pure-white rounded-xl text-xs font-bold hover:bg-sky-connect/90 transition-colors disabled:opacity-40 flex items-center gap-1"
                                                            >
                                                                {isMutating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                                                            </button>
                                                            <button
                                                                onClick={() => updateRequestStatus(request.id, 'DECLINED')}
                                                                disabled={isMutating}
                                                                className="px-4 py-1.5 bg-red-500 text-pure-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-40"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                    <Link href={`/landlord/chat?request=${request.id}`} className="p-2 text-stone-slate hover:text-sky-connect transition-colors shrink-0">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Core Assets Inventory Grid Data Summary */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-charcoal-tone">Asset Portfolio Inventory</h2>
                            {properties.length === 0 ? (
                                <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-12 text-center space-y-4">
                                    <Home className="h-10 w-10 mx-auto text-stone-slate/60" />
                                    <p className="text-sm font-semibold text-stone-slate">No architectural assets bound to this login credential instance.</p>
                                    <Link href="/landlord/properties/new" className="inline-block">
                                        <Button variant="secondary" className="rounded-xl font-bold text-xs">Deploy First Listing Model</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-pale-ash/40 shadow-subtle bg-pure-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-pale-ash bg-cloud-whisper/40 text-xs font-bold uppercase tracking-wider text-inkwell-gray">
                                                <th className="px-6 py-3.5">Property Metadata</th>
                                                <th className="px-6 py-3.5">Structural Class</th>
                                                <th className="px-6 py-3.5">Annual Rent Structure</th>
                                                <th className="px-6 py-3.5">Verification Feed State</th>
                                                <th className="px-6 py-3.5">Deployment Stamp</th>
                                                <th className="px-6 py-3.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-pale-ash/40 text-sm font-medium">
                                            {properties.map((property) => (
                                                <tr key={property.id} className="hover:bg-cloud-whisper/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-bold text-charcoal-tone text-sm">{property.title}</p>
                                                            <p className="text-xs font-medium text-stone-slate mt-0.5">{property.lga}, {property.state}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 capitalize text-inkwell-gray font-semibold text-xs">{property.property_type.replace('_', ' ')}</td>
                                                    <td className="px-6 py-4 font-bold text-sky-connect">{formatNaira(property.annual_rent)}</td>
                                                    <td className="px-6 py-4">{getStatusBadge(property.status)}</td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-stone-slate">{formatDate(property.created_at)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link href={`/properties/${property.id}`} className="text-xs font-bold text-sky-connect hover:underline pr-4">
                                                            Preview Feed
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </>
    )
}