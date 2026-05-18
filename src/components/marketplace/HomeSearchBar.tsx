'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

function SearchBarInner() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'ALL')
    const [bedrooms, setBedrooms] = useState(searchParams.get('beds') || 'ANY')

    const handleSearchExecute = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()

        if (searchQuery.trim()) params.set('q', searchQuery.trim())
        if (propertyType !== 'ALL') params.set('type', propertyType)
        if (bedrooms !== 'ANY') params.set('beds', bedrooms)

        router.push(`/?${params.toString()}`)
        setIsFilterOpen(false)
    }

    return (
        <div className="w-full max-w-2xl mx-auto relative">
            <form onSubmit={handleSearchExecute} className="w-full bg-pure-white border border-pale-ash/60 p-2 rounded-2xl shadow-subtle flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3">
                    <Search className="h-4 w-4 text-stone-slate shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by LGA or neighborhood (e.g., Ikoyi, Lekki)..."
                        className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-stone-slate/50 text-charcoal-tone py-1"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`btn-ghost text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shrink-0 transition-all ${isFilterOpen ? 'bg-cloud-whisper border-pale-ash' : ''}`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-inkwell-gray" />
                    <span>Filters</span>
                </button>

                <button type="submit" className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shrink-0">
                    Search
                </button>
            </form>

            {/* Advanced Filter Popover */}
            {isFilterOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-pure-white border border-pale-ash/50 rounded-2xl shadow-md p-6 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-pale-ash/30 pb-3 mb-4">
                        <h4 className="text-sm font-bold text-charcoal-tone uppercase tracking-wider">Advanced Marketplace Parameters</h4>
                        <button onClick={() => setIsFilterOpen(false)} className="text-stone-slate hover:text-charcoal-tone transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-inkwell-gray uppercase tracking-wide">Property Class</label>
                            <select
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                                className="w-full bg-cloud-whisper border border-pale-ash/40 rounded-xl p-2.5 text-xs font-medium text-charcoal-tone focus:outline-none focus:border-pale-ash"
                            >
                                <option value="ALL">All Structural Classes</option>
                                <option value="APARTMENT">Apartment Units</option>
                                <option value="STUDIO">Studio Layouts</option>
                                <option value="TERRACE">Terrace Duplexes</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-inkwell-gray uppercase tracking-wide">Unit Capacity</label>
                            <select
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                className="w-full bg-cloud-whisper border border-pale-ash/40 rounded-xl p-2.5 text-xs font-medium text-charcoal-tone focus:outline-none focus:border-pale-ash"
                            >
                                <option value="ANY">Any Room Count</option>
                                <option value="1">1 Bedroom Flat</option>
                                <option value="2">2 Bedroom Spaces</option>
                                <option value="3">3 Bedroom Units</option>
                                <option value="4">4+ Bedroom Layouts</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-pale-ash/30">
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('')
                                setPropertyType('ALL')
                                setBedrooms('ANY')
                                router.push('/')
                                setIsFilterOpen(false)
                            }}
                            className="text-xs font-medium text-stone-slate hover:text-charcoal-tone px-4 py-2 transition-colors"
                        >
                            Reset All
                        </button>
                        <button
                            type="button"
                            onClick={handleSearchExecute}
                            className="btn-primary text-xs font-bold px-5 py-2 rounded-xl shadow-xs"
                        >
                            Apply Filter Matrices
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export function HomeSearchBar() {
    return (
        <Suspense fallback={<div className="w-full max-w-2xl mx-auto h-[52px] bg-pure-white/50 animate-pulse border border-pale-ash/40 rounded-2xl" />}>
            <SearchBarInner />
        </Suspense>
    )
}