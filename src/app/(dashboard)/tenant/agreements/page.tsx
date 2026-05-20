'use client'

import { FileText, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

export default function TenantAgreementsPage() {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                <Sidebar />

                {/* Fixed Spacer Layout Margin Zone */}
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 mt-16">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Interactive Page Navigation Breadcrumb Header */}
                        <div className="flex items-center justify-between border-b border-pale-ash/40 pb-4">
                            <div>
                                <h1 className="text-xl font-black tracking-tight">Lease Covenants Registry</h1>
                                <p className="text-xs font-medium text-inkwell-gray mt-1">Review, sign, and download your digitized legal tenancy frameworks.</p>
                            </div>
                            <Link href="/tenant" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pure-white border border-pale-ash/60 rounded-xl text-xs font-bold shadow-xs hover:bg-cloud-whisper/40 transition-colors">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>Back to Dashboard</span>
                            </Link>
                        </div>

                        {/* Elegantly Formatted Empty State Registry Display Card */}
                        <div className="bg-pure-white border border-pale-ash/30 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-subtle mt-8">
                            <div className="p-4 bg-cloud-whisper border border-pale-ash/40 rounded-2xl inline-block text-sky-connect mx-auto">
                                <FileText className="h-8 w-8 opacity-60" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-charcoal-tone">No Active Tenancy Contracts</h3>
                                <p className="text-xs font-medium text-stone-slate max-w-sm mx-auto leading-relaxed">
                                    Your verified tenancy lease legal agreements will compile here dynamically following landlord validation and approval confirmations.
                                </p>
                            </div>
                        </div>

                    </div>
                </main>

            </div>
        </>
    )
}