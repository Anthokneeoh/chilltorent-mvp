'use client'

import { useState } from 'react'
import { Search, Filter, X, Home, Zap, Droplet, Shield, Route } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { ListingCard } from '@/components/properties/ListingCard'
import { Button } from '@/components/ui/Button'
import { useProperties, PropertyFilters } from '@/hooks/useProperties'
import { cn } from '@/lib/utils/formatters'

export default function HomePage() {
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<PropertyFilters>({})
    const [searchLga, setSearchLga] = useState('')

    const { properties, isLoading, error, loadMore, hasMore, totalCount } = useProperties(
        filters,
        'tenant'
    )

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, lga: searchLga.trim() || undefined }))
    }

    const clearFilters = () => {
        setFilters({})
        setSearchLga('')
    }

    const filterOptions = {
        electricityBands: [
            { value: 'A', label: 'Band A (24/7 Power)', icon: Zap },
            { value: 'B', label: 'Band B (18-20hrs)', icon: Zap },
            { value: 'C', label: 'Band C (12-16hrs)', icon: Zap },
            { value: 'D', label: 'Band D (6-10hrs)', icon: Zap },
            { value: 'E', label: 'Band E (Unstable)', icon: Zap },
        ],
        waterSources: [
            { value: 'borehole', label: 'Borehole System', icon: Droplet },
            { value: 'mains', label: 'Mains Supply', icon: Droplet },
            { value: 'well', label: 'Well Water', icon: Droplet },
        ],
        securityRatings: [
            { value: 'estate_security', label: 'Estate Security Patrol', icon: Shield },
            { value: 'street_gate', label: 'Secured Street Gate', icon: Shield },
            { value: 'none', label: 'No Gate Control', icon: Shield },
        ],
        roadConditions: [
            { value: 'tarred', label: 'Tarred Road Network', icon: Route },
            { value: 'interlocked', label: 'Interlocked Paving', icon: Route },
            { value: 'untarred', label: 'Untarred Access', icon: Route },
        ],
        bedrooms: [1, 2, 3, 4, 5],
    }

    const readableFilterLabels: Record<string, string> = {
        electricityBand: 'Power',
        waterSource: 'Water',
        securityRating: 'Security',
        roadCondition: 'Road Access',
        bedrooms: 'Bedrooms',
        isFurnished: 'Furnished',
        lga: 'Location',
    }

    const toggleFilter = (key: keyof PropertyFilters, value: any) => {
        setFilters(prev => {
            const current = prev[key]
            if (current === value) {
                const { [key]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [key]: value }
        })
    }

    const activeFilterEntries = Object.entries(filters).filter(([_, val]) => val !== undefined)
    const hasActiveFilters = activeFilterEntries.length > 0

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-cloud-whisper">
                {/* Marketing Hero Context Banner Section */}
                <section className="bg-gradient-to-b from-sky-connect/5 via-transparent to-transparent py-16 text-center">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl md:text-5xl font-black text-charcoal-tone tracking-tight mb-4">
                            Find Your <span className="text-sky-connect">Perfect Home</span>
                        </h1>
                        <p className="text-base text-inkwell-gray max-w-2xl mx-auto mb-8 font-medium">
                            Verified listings, direct landlord communication channels, and zero inspection fees.
                            Secure verified premium properties across Lagos, Abuja, and Port Harcourt.
                        </p>

                        {/* Core Universal Search Action Array Container */}
                        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 px-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search by location area (e.g., Lekki, Surulere, Gbagada)"
                                    value={searchLga}
                                    onChange={(e) => setSearchLga(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full px-5 py-3.5 rounded-3xl border border-pale-ash bg-pure-white text-charcoal-tone text-sm placeholder:text-stone-slate focus:outline-none focus:ring-2 focus:ring-sky-connect/40 shadow-subtle transition-all"
                                />
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={handleSearch} className="px-6 rounded-3xl shrink-0">
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowFilters(true)}
                                    className="px-4 rounded-3xl shrink-0"
                                    aria-label="Toggle Extended Search Criteria Filters"
                                >
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Dynamic Active System Filter Pill Decks */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap justify-center items-center gap-2 mt-6 animate-in fade-in duration-200">
                                {activeFilterEntries.map(([key, value]) => {
                                    let badgeText = String(value)
                                    if (value === true) badgeText = 'Yes'
                                    if (key === 'electricityBand') badgeText = `Band ${value}`

                                    return (
                                        <span
                                            key={key}
                                            className="inline-flex items-center gap-1.5 bg-pure-white border border-pale-ash px-3 py-1 rounded-full text-xs font-semibold text-charcoal-tone shadow-sm"
                                        >
                                            <span>{readableFilterLabels[key] || key}:</span>
                                            <span className="text-sky-connect capitalize">{badgeText}</span>
                                            <button
                                                onClick={() => toggleFilter(key as keyof PropertyFilters, value)}
                                                className="ml-1 text-stone-slate hover:text-red-500 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )
                                })}
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-sky-connect hover:text-sky-connect/80 hover:underline transition-colors ml-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Backdrop-Dismissible Filter Control Modal Overlay */}
                {showFilters && (
                    <div
                        className="fixed inset-0 z-50 bg-charcoal-tone/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
                        onClick={() => setShowFilters(false)} // Overlay click dismissal execution rule
                    >
                        <div
                            className="bg-pure-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl flex flex-col animate-in slide-in-from-bottom-8 duration-300"
                            onClick={(e) => e.stopPropagation()} // Stop event bubbling to protect inner click selections
                        >
                            <div className="sticky top-0 bg-pure-white px-5 py-4 border-b border-pale-ash/60 flex justify-between items-center z-10">
                                <h2 className="text-base font-bold text-charcoal-tone">Filter Search Criteria</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-1.5 hover:bg-cloud-whisper text-inkwell-gray hover:text-charcoal-tone rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                                {/* Electricity Band Group Container */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-2.5">Power Supply Rating</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {filterOptions.electricityBands.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => toggleFilter('electricityBand', opt.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
                                                    filters.electricityBand === opt.value
                                                        ? 'bg-sky-connect border-sky-connect text-pure-white shadow-sm'
                                                        : 'bg-cloud-whisper border-pale-ash/40 text-charcoal-tone hover:bg-pale-ash/60'
                                                )}
                                            >
                                                <opt.icon className={cn('h-3 w-3', filters.electricityBand === opt.value ? 'text-pure-white fill-current' : 'text-sky-connect')} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Water Resource Parameters */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-2.5">Water Infrastructure</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {filterOptions.waterSources.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => toggleFilter('waterSource', opt.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
                                                    filters.waterSource === opt.value
                                                        ? 'bg-sky-connect border-sky-connect text-pure-white shadow-sm'
                                                        : 'bg-cloud-whisper border-pale-ash/40 text-charcoal-tone hover:bg-pale-ash/60'
                                                )}
                                            >
                                                <opt.icon className={cn('h-3 w-3', filters.waterSource === opt.value ? 'text-pure-white' : 'text-sky-connect')} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Security Parameter Configurations */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-2.5">Security Gate Enforcement</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {filterOptions.securityRatings.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => toggleFilter('securityRating', opt.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
                                                    filters.securityRating === opt.value
                                                        ? 'bg-sky-connect border-sky-connect text-pure-white shadow-sm'
                                                        : 'bg-cloud-whisper border-pale-ash/40 text-charcoal-tone hover:bg-pale-ash/60'
                                                )}
                                            >
                                                <opt.icon className={cn('h-3 w-3', filters.securityRating === opt.value ? 'text-pure-white' : 'text-indigo-600')} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Road Access Indexes */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-2.5">Road Condition Network</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {filterOptions.roadConditions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => toggleFilter('roadCondition', opt.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
                                                    filters.roadCondition === opt.value
                                                        ? 'bg-sky-connect border-sky-connect text-pure-white shadow-sm'
                                                        : 'bg-cloud-whisper border-pale-ash/40 text-charcoal-tone hover:bg-pale-ash/60'
                                                )}
                                            >
                                                <opt.icon className={cn('h-3 w-3', filters.roadCondition === opt.value ? 'text-pure-white' : 'text-amber-600')} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bedroom Spatial Counts */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-2.5">Room Capacity Dimensions</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {filterOptions.bedrooms.map(num => (
                                            <button
                                                key={num}
                                                onClick={() => toggleFilter('bedrooms', num)}
                                                className={cn(
                                                    'px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                                                    filters.bedrooms === num
                                                        ? 'bg-sky-connect border-sky-connect text-pure-white shadow-sm'
                                                        : 'bg-cloud-whisper border-pale-ash/40 text-charcoal-tone hover:bg-pale-ash/60'
                                                )}
                                            >
                                                {num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Structural Furnishing Toggles */}
                                <div className="pt-2">
                                    <label className="inline-flex items-center gap-3 cursor-pointer group select-none">
                                        <input
                                            type="checkbox"
                                            checked={filters.isFurnished === true}
                                            onChange={(e) => toggleFilter('isFurnished', e.target.checked ? true : undefined)}
                                            className="h-4 w-4 rounded border-pale-ash text-sky-connect focus:ring-sky-connect transition-all cursor-pointer"
                                        />
                                        <span className="text-sm font-semibold text-charcoal-tone group-hover:text-sky-connect transition-colors">Require Fully Furnished Assets Only</span>
                                    </label>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-pure-white p-4 border-t border-pale-ash/60 z-10">
                                <Button fullWidth onClick={() => setShowFilters(false)} className="rounded-xl py-3 text-sm font-bold">
                                    Apply Structural Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dynamic Real Estate Matrix Property Results Grid Layout */}
                <section className="py-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-extrabold text-charcoal-tone tracking-tight">
                                {isLoading && properties.length === 0
                                    ? 'Scanning Platform Inventory...'
                                    : `${totalCount} ${totalCount === 1 ? 'Available Property' : 'Available Properties'} Found`}
                            </h2>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm font-medium animate-in fade-in max-w-xl mx-auto">
                                {error}
                            </div>
                        )}

                        {/* Matrix Loading Skeleton Grid Layout to Prevent Structural Content Jitter */}
                        {isLoading && properties.length === 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-pure-white rounded-2xl overflow-hidden border border-pale-ash/30 p-4 space-y-4 animate-pulse">
                                        <div className="bg-pale-ash h-44 w-full rounded-xl" />
                                        <div className="space-y-2">
                                            <div className="h-4 bg-pale-ash rounded w-3/4" />
                                            <div className="h-3 bg-pale-ash rounded w-1/2" />
                                        </div>
                                        <div className="h-8 bg-pale-ash rounded-xl w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : properties.length === 0 && !error ? (
                            <div className="text-center py-20 bg-pure-white border border-pale-ash/30 rounded-2xl shadow-subtle p-8 max-w-2xl mx-auto">
                                <Home className="h-12 w-12 mx-auto text-stone-slate mb-4 stroke-[1.5]" />
                                <h3 className="text-lg font-bold text-charcoal-tone mb-1">No Real Estate Matches Found</h3>
                                <p className="text-sm text-inkwell-gray max-w-md mx-auto">
                                    We could not find active property matches fitting your precise filter combinations in this area yet.
                                </p>
                                {hasActiveFilters && (
                                    <Button variant="ghost" onClick={clearFilters} className="mt-5 text-xs font-bold border border-pale-ash text-sky-connect">
                                        Reset Active Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                                    {properties.map((property) => (
                                        <ListingCard key={property.id} property={property} />
                                    ))}
                                </div>

                                {hasMore && (
                                    <div className="text-center mt-12">
                                        <Button
                                            variant="secondary"
                                            onClick={loadMore}
                                            disabled={isLoading}
                                            className="px-10 rounded-3xl text-sm font-bold border border-pale-ash shadow-sm bg-pure-white text-charcoal-tone hover:bg-cloud-whisper min-w-[160px]"
                                        >
                                            {isLoading ? 'Loading...' : 'Load More Listings'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
        </>
    )
}