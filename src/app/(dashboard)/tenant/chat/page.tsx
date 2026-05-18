'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { MessageCircle, Home, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import type { Database } from '@/lib/supabase/types'

type ViewingRequest = Database['public']['Tables']['viewing_requests']['Row'] & {
    property?: { id: string; title: string; lga: string; state: string } | null
    landlord?: { id: string; full_name: string; email: string } | null
}

function TenantChatContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedRequestId = searchParams.get('request')
    const { user, isLoading: authLoading } = useAuth()

    const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
    const [activeRequest, setActiveRequest] = useState<ViewingRequest | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [dbError, setDbError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/login')
            return
        }
        fetchViewingRequests(user.id)
    }, [user, authLoading, router])

    useEffect(() => {
        if (selectedRequestId && viewingRequests.length > 0) {
            const found = viewingRequests.find(r => r.id === selectedRequestId)
            if (found) setActiveRequest(found)
        }
    }, [selectedRequestId, viewingRequests])

    const fetchViewingRequests = async (tenantId: string) => {
        try {
            setDbError(null)
            const { data, error } = await (supabase
                .from('viewing_requests') as any)
                .select(`
                    *,
                    property:property_id (id, title, lga, state),
                    landlord:landlord_id (id, full_name, email)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (error) throw error

            const typedData = (data || []) as ViewingRequest[]
            setViewingRequests(typedData)

            if (!selectedRequestId && typedData.length > 0) {
                setActiveRequest(typedData[0])
            }
        } catch (err: any) {
            console.error('Failed to fetch viewing requests:', err)
            setDbError(err.message || 'Authorization ledger validation error.')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold"><Clock className="h-3 w-3" /> Pending</span>
            case 'ACCEPTED':
                return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full text-xs font-bold"><CheckCircle className="h-3 w-3" /> Confirmed</span>
            case 'DECLINED':
                return <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Declined</span>
            case 'COMPLETED':
                return <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Completed</span>
            default:
                return <span className="bg-pale-ash/40 text-charcoal-tone px-2.5 py-0.5 rounded-full text-xs font-bold">{status}</span>
        }
    }

    if (isLoading || authLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[60vh]">
                <Loader2 className="h-6 w-6 text-sky-connect animate-spin" />
            </div>
        )
    }

    if (dbError) {
        return (
            <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-100 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <h3 className="font-bold text-sm">Inquiry Ledger Access Rejection</h3>
                </div>
                <p className="text-xs text-red-600 font-mono bg-pure-white/60 p-3 rounded-xl border border-red-100/40">
                    {dbError}
                </p>
            </div>
        )
    }

    if (viewingRequests.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
                <MessageCircle className="h-14 w-14 mx-auto text-sky-connect opacity-40 animate-pulse" />
                <h1 className="text-xl font-black text-charcoal-tone">No Conversations Initialized Yet</h1>
                <p className="text-xs font-medium text-stone-slate max-w-sm mx-auto">Active message rooms assemble automatically once real estate viewings are requested.</p>
                <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center gap-2 bg-sky-connect hover:bg-sky-connect/90 text-pure-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                    <Home className="h-4 w-4" />
                    Browse Properties
                </button>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-112px)] flex flex-col bg-pure-white text-charcoal-tone rounded-2xl border border-pale-ash/40 shadow-subtle overflow-hidden">
            <div className="border-b border-pale-ash/40 bg-pure-white px-6 py-4">
                <h1 className="text-xl font-black tracking-tight text-charcoal-tone">Messages Portal</h1>
                <p className="text-xs font-medium text-inkwell-gray mt-0.5">Direct communication feed with property listing verification authorities</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-80 border-r border-pale-ash/40 bg-cloud-whisper/40 overflow-y-auto hidden md:block">
                    <div className="p-4 space-y-3">
                        <h2 className="text-xs font-bold text-inkwell-gray uppercase tracking-wider px-1">Active Communication Channels</h2>
                        <div className="space-y-1.5">
                            {viewingRequests.map((req) => (
                                <button
                                    key={req.id}
                                    onClick={() => setActiveRequest(req)}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${activeRequest?.id === req.id
                                        ? 'bg-pure-white border-pale-ash/60 shadow-subtle'
                                        : 'border-transparent hover:bg-pure-white/40'
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <p className="font-bold text-charcoal-tone text-sm truncate">
                                                {req.landlord?.full_name || 'Asset Owner'}
                                            </p>
                                            <p className="text-xs font-medium text-inkwell-gray truncate">
                                                {req.property?.title}
                                            </p>
                                            <p className="text-[10px] font-semibold text-stone-slate pt-0.5">
                                                {req.property?.lga}, {req.property?.state}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {getStatusBadge(req.status)}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-semibold text-stone-slate/60 mt-2 text-right">
                                        Opened {formatDate(req.created_at)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-pure-white p-4">
                    {activeRequest && user ? (
                        <ChatWindow
                            viewingRequestId={activeRequest.id}
                            currentUserId={user.id}
                            otherPartyName={activeRequest.landlord?.full_name || 'Landlord'}
                            propertyTitle={activeRequest.property?.title}
                            onClose={() => setActiveRequest(null)}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8 bg-cloud-whisper/20 rounded-2xl border border-dashed border-pale-ash/40 m-2">
                            <div className="space-y-2">
                                <MessageCircle className="h-10 w-10 mx-auto text-stone-slate/40" />
                                <p className="text-xs font-bold text-stone-slate">No workspace selected</p>
                                <p className="text-[11px] font-medium text-stone-slate/60 max-w-xs">Select an active context frame thread from the panel array to begin syncing your message boards.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function TenantChatPage() {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
                    <Suspense fallback={
                        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-5 w-5 text-sky-connect animate-spin" />
                            <p className="text-[10px] font-bold text-stone-slate uppercase tracking-widest">Opening Correspondence Bridge...</p>
                        </div>
                    }>
                        <TenantChatContent />
                    </Suspense>
                </main>
            </div>
        </>
    )
}