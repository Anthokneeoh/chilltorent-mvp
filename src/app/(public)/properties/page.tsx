'use client'

import { PropertyFeed } from '@/components/marketplace/PropertyFeed'
import { HomeSearchBar } from '@/components/marketplace/HomeSearchBar'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Loader2 } from 'lucide-react'

export default function PropertiesCatalogPage() {
    const { user, isLoading } = useAuth()

    // Prevent hydration flashes while checking if a dashboard framework should mount
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cloud-whisper">
                <Loader2 className="h-8 w-8 text-sky-connect animate-spin" />
            </div>
        )
    }

    // --- RENDER CONDITION A: LOGGED-IN AUTHENTICATED USER ---
    if (user) {
        return (
            <>
                <Navbar />
                <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                    <Sidebar />

                    {/* Fixed Spacer Layout Margin Zone */}
                    <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 mt-16">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">Available Market Inventories</h1>
                                <p className="text-sm font-medium text-inkwell-gray mt-1">Explore verified structural spaces across Lagos</p>
                            </div>
                            <HomeSearchBar />
                            <PropertyFeed />
                        </div>
                    </main>
                </div>
            </>
        )
    }

    // --- RENDER CONDITION B: ANONYMOUS MARKETING PUBLIC VISITOR ---
    return (
        <div className="bg-cloud-whisper min-h-screen text-charcoal-tone pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
                <h1 className="text-3xl font-black tracking-tight">Available Market Inventories</h1>
                <p className="text-sm font-medium text-inkwell-gray mt-1">Explore verified structural spaces across Lagos</p>
            </div>
            <HomeSearchBar />
            <PropertyFeed />
        </div>
    )
}