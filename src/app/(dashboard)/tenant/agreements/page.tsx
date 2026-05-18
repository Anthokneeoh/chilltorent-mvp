'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { formatDate, formatNaira } from '@/lib/utils/formatters'
import { FileText, Download, CheckCircle, Clock, Eye, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Agreement = Database['public']['Tables']['agreements']['Row'] & {
    property?: { title: string; annual_rent: number; lga: string; state: string; address: string }
    landlord?: { full_name: string; email: string; phone: string | null }
}

function TenantAgreementsInner() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const [agreements, setAgreements] = useState<Agreement[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login')
            return
        }
        fetchAgreements(user.id)
    }, [user, authLoading, router])

    const fetchAgreements = async (tenantId: string) => {
        try {
            const { data, error } = await (supabase
                .from('agreements') as any)
                .select(`
          *,
          property:property_id (title, annual_rent, lga, state, address),
          landlord:landlord_id (full_name, email, phone)
        `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setAgreements(data || [])
        } catch (err) {
            console.error('Failed to fetch legal agreement data vectors:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'GENERATED':
                return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full text-xs font-bold"><CheckCircle className="h-3 w-3" /> Ready for Execution</span>
            case 'DOWNLOADED_TENANT':
                return <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-full text-xs font-bold"><Download className="h-3 w-3" /> Tenant Signed</span>
            case 'DOWNLOADED_LANDLORD':
                return <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full text-xs font-bold"><CheckCircle className="h-3 w-3" /> Fully Signed</span>
            default:
                return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-xs font-bold"><Clock className="h-3 w-3" /> Agreement Draft</span>
        }
    }

    const handleDownload = async (agreement: Agreement) => {
        if (!agreement.pdf_url) {
            alert('Tenancy documentation payload file not generated yet.')
            return
        }

        window.open(agreement.pdf_url, '_blank')

        if (agreement.status !== 'DOWNLOADED_TENANT' && agreement.status !== 'DOWNLOADED_LANDLORD' && user) {
            await (supabase
                .from('agreements') as any)
                .update({ status: 'DOWNLOADED_TENANT' })
                .eq('id', agreement.id)

            await fetchAgreements(user.id)
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
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* Title Header Block */}
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Tenancy Documents</h1>
                            <p className="text-sm font-medium text-inkwell-gray mt-1">Review, authorize, and download your verified lease framework materials</p>
                        </div>

                        {agreements.length === 0 ? (
                            <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-12 text-center space-y-4 shadow-subtle">
                                <FileText className="h-12 w-12 mx-auto text-stone-slate/60" />
                                <h2 className="text-base font-bold text-charcoal-tone">No Documentation Packets Initialized</h2>
                                <p className="text-xs font-medium text-stone-slate max-w-sm mx-auto">Digital occupancy lease forms load instantly here following structural generation authorization from your landlord.</p>
                                <Button onClick={() => router.push('/')} variant="secondary" className="rounded-xl font-bold text-xs px-5">
                                    Explore Active Catalog
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {agreements.map((agreement) => (
                                    <div key={agreement.id} className="bg-pure-white border border-pale-ash/40 rounded-2xl shadow-subtle overflow-hidden transition-all hover:border-pale-ash">
                                        <div className="p-6 space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h2 className="text-lg font-black tracking-tight text-charcoal-tone">
                                                            {agreement.property?.title || 'Tenancy Agreement Form'}
                                                        </h2>
                                                        {getStatusBadge(agreement.status)}
                                                    </div>
                                                    <p className="text-xs font-medium text-stone-slate">
                                                        {agreement.property?.address}, {agreement.property?.lga}, {agreement.property?.state}
                                                    </p>
                                                </div>

                                                <div className="flex sm:flex-col gap-2 shrink-0">
                                                    {agreement.pdf_url && agreement.status !== 'DRAFT' ? (
                                                        <Button
                                                            onClick={() => handleDownload(agreement)}
                                                            className="flex items-center gap-2 rounded-xl text-xs font-bold py-2 px-4 shadow-sm"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Download Legal PDF
                                                        </Button>
                                                    ) : (
                                                        <Button disabled className="flex items-center gap-2 opacity-40 cursor-not-allowed rounded-xl text-xs font-bold py-2 px-4">
                                                            <Clock className="h-4 w-4" />
                                                            Awaiting Creation
                                                        </Button>
                                                    )}
                                                    {agreement.viewing_request_id && (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => router.push(`/tenant/chat?request=${agreement.viewing_request_id}`)}
                                                            className="text-xs font-bold rounded-xl"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1.5" />
                                                            View Room Chat
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Document Meta Information Parameters */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-cloud-whisper/40 border border-pale-ash/30 rounded-xl text-xs font-bold">
                                                <div>
                                                    <p className="text-stone-slate uppercase tracking-wider text-[10px]">Annual Rent Allocation</p>
                                                    <p className="text-sky-connect font-black text-sm mt-0.5">{formatNaira(agreement.property?.annual_rent || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-stone-slate uppercase tracking-wider text-[10px]">Lessor Authority</p>
                                                    <p className="text-charcoal-tone font-extrabold mt-0.5 truncate">{agreement.landlord?.full_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-stone-slate uppercase tracking-wider text-[10px]">System Timestamp</p>
                                                    <p className="text-charcoal-tone font-medium mt-0.5">{agreement.generated_at ? formatDate(agreement.generated_at) : 'Pending Action'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-stone-slate uppercase tracking-wider text-[10px]">Registry State</p>
                                                    <p className="text-charcoal-tone capitalize mt-0.5">{agreement.status.replace('_', ' ').toLowerCase()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Contact Metadata Panels */}
                                        {agreement.landlord && agreement.status !== 'DRAFT' && (
                                            <div className="bg-cloud-whisper/60 px-6 py-3.5 border-t border-pale-ash/40 space-y-1 text-[11px] font-medium text-stone-slate">
                                                <p>
                                                    <span className="font-bold text-charcoal-tone">Landlord Direct Channels:</span> {agreement.landlord.email} {agreement.landlord.phone && `• ${agreement.landlord.phone}`}
                                                </p>
                                                <p className="text-[10px] text-stone-slate/80 leading-relaxed">
                                                    This documentation framework is pre-compiled securely via verified profile fields. Complete final authorization signatures executing this layout via preferred or physical channels.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}

export default function TenantAgreementsPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen bg-cloud-whisper items-center justify-center">
                <Loader2 className="h-8 w-8 text-sky-connect animate-spin" />
            </div>
        }>
            <TenantAgreementsInner />
        </Suspense>
    )
}