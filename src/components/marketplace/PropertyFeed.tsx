'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Loader2, Info } from 'lucide-react'
import { formatNaira } from '@/lib/utils/formatters'
import { supabase } from '@/lib/supabase/client'

const FEATURED_MOCK_PROPERTIES = [
    {
        id: 'prop-001-mock',
        title: 'Luxury 3 Bedroom Apartment',
        lga: 'Ikoyi',
        state: 'Lagos',
        annual_rent: 8500000,
        bedrooms: 3,
        bathrooms: 3,
        property_type: 'flat',
        thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60',
    },
    {
        id: 'prop-002-mock',
        title: 'Serviced Studio Space',
        lga: 'Lekki Phase 1',
        state: 'Lagos',
        annual_rent: 4500000,
        bedrooms: 0,
        bathrooms: 1,
        property_type: 'studio',
        thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60',
    },
    {
        id: 'prop-003-mock',
        title: 'Modern 4 Bedroom Duplex',
        lga: 'Ikeja GRA',
        state: 'Lagos',
        annual_rent: 12000000,
        bedrooms: 4,
        bathrooms: 4,
        property_type: 'duplex',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=60',
    },
]

function PropertyFeedInner() {
    const searchParams = useSearchParams()

    const [properties, setProperties] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUsingMockData, setIsUsingMockData] = useState(false)

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true)
            setIsUsingMockData(false)

            try {
                let query = supabase
                    .from('properties')
                    .select('*, property_media(url, is_thumbnail)')
                    .eq('status', 'ACTIVE')

                const q = searchParams.get('q')
                const type = searchParams.get('type')
                const beds = searchParams.get('beds')

                if (q) {
                    query = query.or(`title.ilike.%${q}%,lga.ilike.%${q}%,state.ilike.%${q}%,address.ilike.%${q}%`)
                }
                if (type && type !== 'ALL') {
                    query = query.eq('property_type', type)
                }
                if (beds && beds !== 'ANY') {
                    if (beds === '4') {
                        query = query.gte('bedrooms', 4)
                    } else {
                        query = query.eq('bedrooms', parseInt(beds))
                    }
                }

                const { data, error } = await query.order('created_at', { ascending: false }).limit(9)

                if (error) throw error
                if (!data || data.length === 0) {
                    setProperties(FEATURED_MOCK_PROPERTIES)
                    setIsUsingMockData(true)
                } else {
                    const formattedData = data.map((prop: any) => {
                        const coverImage = prop.property_media?.find((m: any) => m.is_thumbnail)?.url
                            || prop.property_media?.[0]?.url
                            || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60'

                        return {
                            ...prop,
                            thumbnail: coverImage
                        }
                    })
                    setProperties(formattedData)
                }
            } catch (error) {
                console.error("Supabase Fetch Error:", error)
                setProperties(FEATURED_MOCK_PROPERTIES)
                setIsUsingMockData(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProperties()
    }, [searchParams])

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-8 w-8 text-sky-connect animate-spin" />
                <p className="text-xs font-bold text-stone-slate uppercase tracking-wider">Syncing Database Indices...</p>
            </div>
        )
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-pale-ash/40 pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-charcoal-tone">
                        {isUsingMockData ? 'Featured Marketplace Properties' : 'Active Catalog Results'}
                    </h2>
                    {isUsingMockData && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-bold bg-amber-50 inline-flex px-2 py-0.5 rounded border border-amber-200">
                            <Info className="h-3.5 w-3.5" /> Displaying preview mock data. (No active matching properties in database).
                        </p>
                    )}
                </div>
                {/* FIX: Clicking this simply routes to / which forces a full clean re-fetch */}
                <Link href="/" className="text-sm font-medium text-sky-connect hover:underline flex items-center gap-1">
                    Clear filters & see all ({properties.length}) <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                    <div key={property.id} className="card overflow-hidden p-0 hover:shadow-md transition-all">
                        <div className="relative h-48 bg-cloud-whisper overflow-hidden">
                            <Image
                                src={property.thumbnail}
                                alt={property.title}
                                fill
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                unoptimized
                            />
                            <span className="absolute top-3 left-3 bg-pure-white/90 backdrop-blur-xs text-charcoal-tone font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-md shadow-xs border border-pale-ash/20">
                                {property.property_type.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <h3 className="font-bold text-lg text-charcoal-tone tracking-tight truncate">{property.title}</h3>
                                <div className="flex items-center text-sm text-stone-slate mt-1">
                                    <MapPin className="h-3.5 w-3.5 mr-1 text-sky-connect shrink-0" />
                                    {property.lga}, {property.state}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-slate">
                                <span className="bg-cloud-whisper/80 border border-pale-ash/20 px-2.5 py-0.5 rounded-lg">{property.bedrooms} Bed Units</span>
                                <span className="bg-cloud-whisper/80 border border-pale-ash/20 px-2.5 py-0.5 rounded-lg">{property.bathrooms} Bath</span>
                                {!isUsingMockData && (
                                    <span className="bg-sky-connect/5 text-sky-connect border border-sky-connect/10 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ml-auto">Verified DB</span>
                                )}
                            </div>
                            <div className="pt-4 border-t border-pale-ash/30 flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-sky-connect tracking-tight">{formatNaira(property.annual_rent)}</p>
                                    <p className="text-[10px] font-medium text-stone-slate uppercase tracking-wider">Per Annum Rent</p>
                                </div>
                                <Link href={isUsingMockData ? '#' : `/properties/${property.id}`}>
                                    <button
                                        className="btn-ghost text-sm py-2 px-4 rounded-3xl"
                                        onClick={(e) => isUsingMockData && e.preventDefault()}
                                    >
                                        View details
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}

export function PropertyFeed() {
    return (
        <Suspense fallback={
            <div className="w-full flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-8 w-8 text-sky-connect animate-spin" />
            </div>
        }>
            <PropertyFeedInner />
        </Suspense>
    )
}