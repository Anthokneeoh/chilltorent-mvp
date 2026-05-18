'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils/formatters'
import { CheckCircle, XCircle, Eye, Clock, FileText, User, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Property = Database['public']['Tables']['properties']['Row']

interface LandlordWithDocs extends Profile {
    properties: Pick<Property, 'id' | 'title' | 'ownership_doc_url'>[]
}

export default function AdminKYCQueuePage() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()

    const [landlords, setLandlords] = useState<LandlordWithDocs[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login')
            return
        }

        const verifyAdminRoleAndHydrate = async () => {
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
                await fetchPendingKYC()
            } catch (err) {
                console.error('Security verification execution exception:', err)
                router.push('/')
            }
        }

        verifyAdminRoleAndHydrate()
    }, [user, authLoading, router])

    const fetchPendingKYC = async () => {
        setIsLoading(true)
        try {
            // 1. Fetch unverified landlords
            const { data: landlordsData, error: landlordError } = await (supabase
                .from('profiles') as any)
                .select('*')
                .eq('role', 'landlord')
                .eq('kyc_verified', false)
                .order('created_at', { ascending: true })

            if (landlordError) throw landlordError

            if (!landlordsData || landlordsData.length === 0) {
                setLandlords([])
                return
            }

            const landlordIds = landlordsData.map((l: Profile) => l.id)

            // 2. Fetch target properties containing documentation hashes
            const { data: propertiesData, error: propertiesError } = await (supabase
                .from('properties') as any)
                .select('id, title, ownership_doc_url, landlord_id')
                .in('landlord_id', landlordIds)
                .not('ownership_doc_url', 'is', null)

            if (propertiesError) throw propertiesError

            // Group properties by landlord_id for instant O(1) in-memory lookups
            const propertiesMap: Record<string, any[]> = {}

            propertiesData?.forEach((prop: { id: string; title: string; ownership_doc_url: string | null; landlord_id: string }) => {
                if (!propertiesMap[prop.landlord_id]) {
                    propertiesMap[prop.landlord_id] = []
                }
                propertiesMap[prop.landlord_id].push({
                    id: prop.id,
                    title: prop.title,
                    ownership_doc_url: prop.ownership_doc_url,
                })
            })

            // 3. Merge profiles and property verification data structures locally
            const compiledKYCQueue: LandlordWithDocs[] = landlordsData.map((landlord: Profile) => ({
                ...landlord,
                properties: propertiesMap[landlord.id] || [],
            }))

            setLandlords(compiledKYCQueue)
        } catch (err) {
            console.error('Fatal document metrics compilation breakdown:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = async (landlordId: string) => {
        setProcessingId(landlordId)
        try {
            const { error } = await (supabase
                .from('profiles') as any)
                .update({ kyc_verified: true })
                .eq('id', landlordId)

            if (error) throw error
            await fetchPendingKYC()
        } catch (err) {
            console.error('KYC confirmation state mutation crash:', err)
            alert('Failed to authorize verification parameters. Please retry.')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (landlordId: string) => {
        setProcessingId(landlordId)
        alert('Rejection pipeline context: Direct messaging channels are active. For production iterations, adjust profiles state structures.')
        setProcessingId(null)
    }

    const openDocument = (url: string) => {
        if (url) window.open(url, '_blank')
    }

    if (authLoading || isLoading || !isAdmin) {
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

                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Identity Review Queue (KYC)</h1>
                            <p className="text-sm font-medium text-inkwell-gray mt-1">Cross-check user identity fields and validation document streams for onboarding lessors</p>
                        </div>

                        {landlords.length === 0 ? (
                            <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-subtle space-y-3">
                                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                                <h2 className="text-lg font-bold text-charcoal-tone">Validation Pool Cleared</h2>
                                <p className="text-xs font-medium text-stone-slate">There are no pending identity documents or landlord accounts awaiting processing reviews.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {landlords.map((landlord) => {
                                    const isMutating = processingId === landlord.id
                                    return (
                                        <div key={landlord.id} className="bg-pure-white border border-pale-ash/40 rounded-2xl shadow-subtle overflow-hidden transition-all hover:border-pale-ash">
                                            <div className="p-6 space-y-6">

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-3.5">
                                                        <div className="p-3 bg-cloud-whisper rounded-xl border border-pale-ash/40 mt-1">
                                                            <User className="h-5 w-5 text-inkwell-gray" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                                <h2 className="text-lg font-black text-charcoal-tone tracking-tight">{landlord.full_name}</h2>
                                                                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full">Awaiting Review</span>
                                                            </div>
                                                            <p className="text-xs font-semibold text-sky-connect">{landlord.email}</p>
                                                            {landlord.phone && <p className="text-xs font-medium text-stone-slate">{landlord.phone}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                                        <Button
                                                            onClick={() => handleApprove(landlord.id)}
                                                            disabled={isMutating}
                                                            className="bg-green-600 hover:bg-green-700 text-pure-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40"
                                                        >
                                                            {isMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                            Approve Account
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleReject(landlord.id)}
                                                            disabled={isMutating}
                                                            variant="danger"
                                                            className="rounded-xl text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Decline Entry
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="pt-5 border-t border-pale-ash/40 space-y-4">
                                                    <h3 className="font-bold text-xs uppercase tracking-wider text-inkwell-gray flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-sky-connect" />
                                                        Asset Ownership Certificate Packets
                                                    </h3>

                                                    {landlord.properties.length === 0 ? (
                                                        <p className="text-xs font-semibold text-stone-slate bg-cloud-whisper/40 border border-dashed border-pale-ash/40 p-4 rounded-xl">
                                                            No property verification deeds linked to this lessor profile yet.
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {landlord.properties.map((prop) => (
                                                                <div key={prop.id} className="flex items-center justify-between bg-cloud-whisper/60 border border-pale-ash/30 rounded-xl p-4 transition-all hover:border-pale-ash">
                                                                    <div className="space-y-0.5 min-w-0 pr-4">
                                                                        <p className="text-xs font-bold text-charcoal-tone truncate">{prop.title}</p>
                                                                        <p className="text-[10px] font-semibold text-stone-slate truncate">
                                                                            File Object: {prop.ownership_doc_url?.split('/').pop() || 'Legal_Deed_Certificate.pdf'}
                                                                        </p>
                                                                    </div>
                                                                    {prop.ownership_doc_url && (
                                                                        <button
                                                                            onClick={() => openDocument(prop.ownership_doc_url!)}
                                                                            className="text-xs font-black text-sky-connect hover:underline shrink-0 flex items-center gap-1 bg-pure-white border border-pale-ash/40 rounded-lg px-3 py-1.5 shadow-xs transition-colors hover:bg-cloud-whisper"
                                                                        >
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                            Inspect Document
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>

                                            <div className="bg-cloud-whisper/40 border-t border-pale-ash/40 px-6 py-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-stone-slate">
                                                <Clock className="h-3 w-3" />
                                                <span>Account creation registry timestamp recorded on: {formatDate(landlord.created_at)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}