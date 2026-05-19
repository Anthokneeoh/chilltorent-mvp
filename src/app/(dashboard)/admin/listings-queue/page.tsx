'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { formatDate, formatNaira } from '@/lib/utils/formatters'
import { CheckCircle, XCircle, Eye, Clock, Home, MapPin, Zap, Droplet, Shield, Milestone, Loader2, AlertCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type PropertyRow = Database['public']['Tables']['properties']['Row']

interface Property extends PropertyRow {
    landlord?: { full_name: string; email: string; kyc_verified: boolean } | null
    media?: { url: string; media_type: string; is_thumbnail: boolean }[]
}

function AdminListingsQueueInner() {
    const router = useRouter()
    const { user, profile, isLoading: authLoading } = useAuth()

    const [properties, setProperties] = useState<Property[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [queueError, setQueueError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login')
            return
        }

        if (profile?.role !== 'admin') {
            router.push('/')
            return
        }

        setIsAdmin(true)

        const hydrate = async () => {
            try {
                // Implement a 10-second timeout fallback race condition for heavy dashboard queries
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Verification listing queue query timed out.')), 10000)
                )
                await Promise.race([fetchPendingListings(), timeoutPromise])
            } catch (err: any) {
                console.error('Administrative access hydration failure:', err)
                setQueueError(err.message || 'Failed to establish synchronization hooks to asset entities ledger.')
                setIsLoading(false)
            }
        }

        hydrate()
    }, [user, profile, authLoading, router])

    const fetchPendingListings = async () => {
        setIsLoading(true)
        setQueueError(null)
        try {
            const res = await fetch('/api/admin/listings')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to fetch listings queue')
            setProperties(data.listings || [])
        } catch (err: any) {
            console.error('Failed to compile verification listing queues safely:', err)
            setQueueError(err.message || 'Failed to establish synchronization hooks to asset entities ledger.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = async (propertyId: string) => {
        setProcessingId(propertyId)
        try {
            const res = await fetch('/api/admin/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId, action: 'approve' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to approve listing')

            if (data.email) {
                fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: data.email,
                        type: 'viewing_request',
                        data: { propertyTitle: data.title, tenantName: 'Admin Authority' },
                    }),
                }).catch(console.error)
            }

            // Remove approved property from queue immediately (optimistic update)
            setProperties(prev => prev.filter(item => item.id !== propertyId))
            alert('Listing approved successfully')
        } catch (err: any) {
            console.error('Listing publication status update failure:', err)
            alert(err.message || 'Failed to authorize publication. Please retry.')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (propertyId: string) => {
        const reason = prompt('Provide the reason for declining this property listing:')
        if (reason === null) return // User cancelled prompt
        if (!reason.trim()) {
            alert('A rejection reason is required.')
            return
        }

        setProcessingId(propertyId)
        try {
            const res = await fetch('/api/admin/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId, action: 'reject', reason }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to decline listing')

            if (data.email) {
                fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: data.email,
                        type: 'viewing_request',
                        data: { propertyTitle: data.title, tenantName: 'Admin Review Team', rejectionReason: reason },
                    }),
                }).catch(console.error)
            }

            // Remove rejected property from queue immediately (optimistic update)
            setProperties(prev => prev.filter(item => item.id !== propertyId))
            alert('Listing declined successfully')
        } catch (err: any) {
            console.error('Listing exclusion verification exception:', err)
            alert(err.message || 'Could not decline listing.')
        } finally {
            setProcessingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Awaiting Escrow Deposit</span>
            case 'PENDING_APPROVAL':
                return <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Awaiting Administrative Audit</span>
            default:
                return <span className="bg-pale-ash/40 text-charcoal-tone border border-pale-ash/60 px-2.5 py-0.5 rounded-full text-xs font-bold">{status}</span>
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-6 w-6 text-sky-connect animate-spin" />
            </div>
        )
    }

    if (queueError) {
        return (
            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl max-w-xl mx-auto space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Catalog Verification Interruption</span>
                </div>
                <p className="text-xs text-red-600 font-mono bg-pure-white/50 p-3 rounded-xl border border-red-100/40">{queueError}</p>
            </div>
        )
    }

    if (!isAdmin) return null

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Identity Layout */}
            <div>
                <h1 className="text-3xl font-black tracking-tight">Catalog Approvals Queue</h1>
                <p className="text-sm font-medium text-inkwell-gray mt-1">Audit architectural design specifications and structural descriptions before public marketplace deployments</p>
            </div>

            {properties.length === 0 ? (
                <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-12 text-center max-w-md mx-auto shadow-subtle space-y-3">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 animate-bounce" />
                    <h2 className="text-lg font-bold text-charcoal-tone">Catalog Auditing Clean</h2>
                    <p className="text-xs font-medium text-stone-slate">All architectural listings are authorized, published, and synchronized live across current database indices.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {properties.map((property) => {
                        const isMutating = processingId === property.id
                        return (
                            <div key={property.id} className="bg-pure-white border border-pale-ash/40 rounded-2xl shadow-subtle overflow-hidden transition-all hover:border-pale-ash">
                                <div className="flex flex-col lg:flex-row">

                                    {/* Thumbnail Graphic Preview Section */}
                                    <div className="lg:w-72 h-52 lg:h-auto bg-cloud-whisper flex-shrink-0 relative border-b lg:border-b-0 lg:border-r border-pale-ash/40">
                                        {property.media && property.media.length > 0 && property.media[0].media_type === 'image' ? (
                                            <img
                                                src={property.media[0].url}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-slate">
                                                <Home className="h-10 w-10 opacity-30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Complete Descriptive Parameters Blocks */}
                                    <div className="flex-1 p-6 space-y-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="space-y-1 max-w-xl">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h2 className="text-lg font-black tracking-tight text-charcoal-tone">{property.title}</h2>
                                                    {getStatusBadge(property.status)}
                                                </div>
                                                <div className="flex items-center text-stone-slate text-xs font-semibold">
                                                    <MapPin className="h-3.5 w-3.5 mr-1 text-sky-connect" />
                                                    {property.address}, {property.lga}, {property.state}
                                                </div>
                                            </div>
                                            <div className="sm:text-right shrink-0">
                                                <p className="text-2xl font-black text-sky-connect tracking-tight">{formatNaira(property.annual_rent)}</p>
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-stone-slate">per annum</p>
                                            </div>
                                        </div>

                                        {/* Cross-Relational Onboarding Lessor Indicators */}
                                        <div className="text-xs font-bold text-charcoal-tone bg-cloud-whisper/40 border border-pale-ash/30 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <span className="text-stone-slate font-medium">Lessor Account Reference:</span>{' '}
                                                <span>{property.landlord?.full_name || 'System Registry'}</span>
                                            </div>
                                            {property.landlord?.kyc_verified ? (
                                                <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">✓ KYC Verified</span>
                                            ) : (
                                                <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">⚠ Identity Pending</span>
                                            )}
                                        </div>

                                        {/* Metric Count Specs */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-slate/80">
                                            <span className="bg-cloud-whisper border border-pale-ash/30 px-2.5 py-1 rounded-lg">{property.bedrooms} Bed Units</span>
                                            <span className="bg-cloud-whisper border border-pale-ash/30 px-2.5 py-1 rounded-lg">{property.bathrooms} Toilet Layouts</span>
                                            <span className="bg-cloud-whisper border border-pale-ash/30 px-2.5 py-1 rounded-lg capitalize">{property.property_type.replace('_', ' ')}</span>
                                            {property.is_furnished && (
                                                <span className="bg-sky-connect/5 text-sky-connect border border-sky-connect/10 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px] font-black">Furnished</span>
                                            )}
                                        </div>

                                        {/* Structural Amenities Metadata Badges */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {property.electricity_band && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-cloud-whisper/70 border border-pale-ash/20 px-3 py-1 rounded-xl">
                                                    <Zap className="h-3 w-3 text-amber-500" /> grid band: {property.electricity_band}
                                                </span>
                                            )}
                                            {property.water_source && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-cloud-whisper/70 border border-pale-ash/20 px-3 py-1 rounded-xl">
                                                    <Droplet className="h-3 w-3 text-sky-connect" /> supply: {property.water_source.replace('_', ' ')}
                                                </span>
                                            )}
                                            {property.security_rating && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-cloud-whisper/70 border border-pale-ash/20 px-3 py-1 rounded-xl">
                                                    <Shield className="h-3 w-3 text-green-600" /> perimeter protection: {property.security_rating}
                                                </span>
                                            )}
                                            {property.road_condition && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-cloud-whisper/70 border border-pale-ash/20 px-3 py-1 rounded-xl">
                                                    <Milestone className="h-3 w-3 text-inkwell-gray" /> street access: {property.road_condition.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Calculated aggregate cost indices row */}
                                        <div className="text-xs font-bold text-charcoal-tone border border-pale-ash/30 rounded-xl p-3 bg-cloud-whisper/40 flex justify-between items-center">
                                            <span className="text-stone-slate font-medium">Aggregated Move-In Package:</span>
                                            <div className="text-right">
                                                <span className="font-black text-sm text-charcoal-tone">{formatNaira(property.total_package)}</span>
                                                <span className="text-[10px] font-semibold text-stone-slate/60 ml-1.5">(Rent + Primary Services)</span>
                                            </div>
                                        </div>

                                        {/* Final Verification Operational CTA Buttons */}
                                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-pale-ash/30">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleApprove(property.id)}
                                                    disabled={isMutating}
                                                    className="bg-green-600 hover:bg-green-700 text-pure-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-1.5 transition-colors"
                                                >
                                                    {isMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                    Approve & Publish
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(property.id)}
                                                    disabled={isMutating}
                                                    variant="danger"
                                                    className="rounded-xl text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-1.5 transition-colors"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Reject listing
                                                </Button>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                onClick={() => window.open(`/properties/${property.id}`, '_blank')}
                                                className="rounded-xl text-xs font-bold flex items-center gap-1.5"
                                            >
                                                <Eye className="h-4 w-4 text-inkwell-gray" />
                                                Preview Feed
                                            </Button>
                                        </div>

                                        <div className="text-[10px] font-bold text-stone-slate/60 text-right uppercase tracking-wider">
                                            Logged into validation stack: {formatDate(property.created_at)}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function AdminListingsQueuePage() {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
                    {/* Suspense boundary isolates ONLY the dynamic content, preventing layout lockups or side nav freezing */}
                    <Suspense fallback={
                        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 text-sky-connect animate-spin" />
                            <p className="text-[10px] font-bold text-stone-slate uppercase tracking-widest">Compiling Catalog Matrix...</p>
                        </div>
                    }>
                        <AdminListingsQueueInner />
                    </Suspense>
                </main>
            </div>
        </>
    )
}