'use client'

import { MessageCircle, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

export default function TenantChatPage() {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                <Sidebar />

                {/* Fixed Spacer Layout Margin Zone */}
                <main className="flex-1 md:ml-64 flex flex-col h-[calc(100vh-4rem)] mt-16">
                    <div className="flex flex-1 overflow-hidden bg-pure-white rounded-t-2xl border-t border-l border-pale-ash/40 shadow-subtle">

                        {/* Left Sidebar Conversations Panel Preview List */}
                        <div className="w-full sm:w-80 border-r border-pale-ash/40 flex flex-col bg-cloud-whisper/10">
                            <div className="p-4 border-b border-pale-ash/40 flex items-center justify-between">
                                <h1 className="text-sm font-black tracking-tight flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4 text-sky-connect" /> Messages Hub
                                </h1>
                                <Link href="/tenant" className="text-xs font-bold text-sky-connect hover:underline flex items-center gap-1">
                                    <ArrowLeft className="h-3 w-3" /> Dashboard
                                </Link>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <p className="text-[11px] font-semibold text-stone-slate text-center py-8">
                                    No dialogue histories established.
                                </p>
                            </div>
                        </div>

                        {/* Right Active Channel Content Area Empty Placeholder */}
                        <div className="hidden sm:flex flex-1 flex-col items-center justify-center bg-pure-white p-8 text-center space-y-4">
                            <div className="p-4 bg-cloud-whisper border border-pale-ash/40 rounded-2xl text-sky-connect">
                                <MessageCircle className="h-8 w-8 opacity-60" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-charcoal-tone">No Active Discussion Selected</h3>
                                <p className="text-xs font-medium text-stone-slate max-w-xs mx-auto mt-1">
                                    Communication channels open automatically once inspection tour bookings are processed.
                                </p>
                            </div>
                        </div>

                    </div>
                </main>

            </div>
        </>
    )
}