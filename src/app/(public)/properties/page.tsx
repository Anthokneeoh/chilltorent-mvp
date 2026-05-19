'use client'

import { PropertyFeed } from '@/components/marketplace/PropertyFeed'
import { HomeSearchBar } from '@/components/marketplace/HomeSearchBar'

export default function PropertiesCatalogPage() {
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
