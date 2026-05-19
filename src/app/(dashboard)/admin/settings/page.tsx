'use client'

export const dynamic = 'force-dynamic'

import { Settings } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
export default function AdminSettingsPage() {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="bg-pure-white p-6 rounded-2xl border border-pale-ash/40 shadow-subtle flex items-center gap-4">
                            <div className="p-3 bg-cloud-whisper border border-pale-ash/40 rounded-xl text-sky-connect"><Settings className="h-6 w-6" /></div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">System Configuration Settings</h1>
                                <p className="text-xs font-medium text-inkwell-gray mt-1">Global parameters controls — Feature coming in next milestone version.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}
