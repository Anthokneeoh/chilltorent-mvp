'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, Zap, Droplet, Shield, Route, Home as HomeIcon } from 'lucide-react'
import { cn, formatNaira } from '@/lib/utils/formatters'
import type { Database } from '@/lib/supabase/types'

type BaseProperty = Database['public']['Tables']['properties']['Row']

export interface PropertyWithThumbnail extends BaseProperty {
    thumbnail_url?: string | null
}

interface ListingCardProps {
    property: PropertyWithThumbnail
    className?: string
}

const electricityMap: Record<string, string> = {
    A: '24/7 Power (Band A)',
    B: 'Premium Power (Band B)',
    C: 'Fair Power (Band C)',
    D: 'Low Power (Band D)',
    E: 'Unstable Power',
}

const waterMap: Record<string, string> = {
    borehole: 'Borehole Water',
    mains: 'Mains Supply',
    well: 'Well Water',
}

const securityMap: Record<string, string> = {
    estate_security: 'Estate Security',
    street_gate: 'Secured Gate',
    none: 'No Gate Patrol',
}

const roadMap: Record<string, string> = {
    tarred: 'Tarred Road Network',
    interlocked: 'Interlocked Paving',
    untarred: 'Untarred Access',
}

export function ListingCard({ property, className }: ListingCardProps) {
    const primaryImageUrl = property.thumbnail_url || '/images/property-placeholder.jpg'

    const getElectricityColor = (band: string | null) => {
        if (band === 'A' || band === 'B') return 'text-green-600 bg-green-50 border-green-200/60'
        if (band === 'C') return 'text-yellow-600 bg-yellow-50 border-yellow-200/60'
        return 'text-red-500 bg-red-50 border-red-200/60'
    }

    return (
        <Link href={`/properties/${property.id}`} className="block">
            <div
                className={cn(
                    'group relative bg-pure-white rounded-2xl overflow-hidden shadow-subtle transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-pale-ash/40',
                    className
                )}
            >
                {/* Image Display Deck */}
                <div className="relative h-52 w-full overflow-hidden bg-cloud-whisper">
                    <Image
                        src={primaryImageUrl}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                    />

                    {/* Availability Status Badge */}
                    <div className="absolute top-3 right-3 bg-sky-connect/95 backdrop-blur-sm text-pure-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide capitalize">
                        {property.status === 'ACTIVE' ? 'Available' : property.status?.toLowerCase()}
                    </div>

                    {/* Furnishing Flag Indicator */}
                    {property.is_furnished && (
                        <div className="absolute top-3 left-3 bg-charcoal-tone/95 backdrop-blur-sm text-pure-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <HomeIcon className="h-3 w-3" />
                            Furnished
                        </div>
                    )}
                </div>

                {/* Content Details Block */}
                <div className="p-4">
                    {/* Title and Rental Price Line */}
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-charcoal-tone line-clamp-1 group-hover:text-sky-connect transition-colors">
                            {property.title}
                        </h3>
                        <p className="text-base font-extrabold text-sky-connect whitespace-nowrap">
                            {formatNaira(property.annual_rent)}<span className="text-xs font-medium text-inkwell-gray">/yr</span>
                        </p>
                    </div>

                    {/* Location Parameters */}
                    <div className="flex items-center text-xs font-medium text-inkwell-gray mb-3">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-stone-slate shrink-0" />
                        <span className="truncate">{property.lga}, {property.state}</span>
                    </div>

                    {/* Architectural Capacity Markers */}
                    <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-charcoal-tone bg-cloud-whisper/50 px-3 py-2 rounded-xl border border-pale-ash/20">
                        <div className="flex items-center gap-1.5">
                            <Bed className="h-4 w-4 text-inkwell-gray" />
                            <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                        </div>
                        <div className="h-3 w-[1px] bg-pale-ash" />
                        <div className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-inkwell-gray" />
                            <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                        </div>
                    </div>

                    {/* Nigeria Market Context Badge Aggregations */}
                    <div className="flex flex-wrap gap-1.5 mb-4 min-h-[54px] items-start content-start">
                        {property.electricity_band && (
                            <div className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border', getElectricityColor(property.electricity_band))}>
                                <Zap className="h-3 w-3 fill-current" />
                                <span>{electricityMap[property.electricity_band] || `Band ${property.electricity_band}`}</span>
                            </div>
                        )}
                        {property.water_source && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-cloud-whisper text-charcoal-tone px-2 py-0.5 rounded-md border border-pale-ash/40">
                                <Droplet className="h-3 w-3 text-sky-connect fill-current" />
                                <span>{waterMap[property.water_source] || property.water_source}</span>
                            </div>
                        )}
                        {property.security_rating && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-cloud-whisper text-charcoal-tone px-2 py-0.5 rounded-md border border-pale-ash/40">
                                <Shield className="h-3 w-3 text-indigo-600" />
                                <span>{securityMap[property.security_rating] || property.security_rating}</span>
                            </div>
                        )}
                        {property.road_condition && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-cloud-whisper text-charcoal-tone px-2 py-0.5 rounded-md border border-pale-ash/40">
                                <Route className="h-3 w-3 text-amber-600" />
                                <span>{roadMap[property.road_condition] || property.road_condition}</span>
                            </div>
                        )}
                    </div>

                    {/* Move-in Out-of-Pocket Package Summary */}
                    <div className="pt-3 border-t border-pale-ash/60">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-inkwell-gray">Total Total Package:</span>
                            <span className="font-bold text-charcoal-tone text-sm">{formatNaira(property.total_package)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}