'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    MapPin,
    Bed,
    Bath,
    Zap,
    Droplet,
    Shield,
    Route,
    Home as HomeIcon,
    Calendar,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    Mail,
    Phone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { cn, formatNaira } from '@/lib/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/lib/supabase/types'

type BaseProperty = Database['public']['Tables']['properties']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MediaRow = Database['public']['Tables']['property_media']['Row']

interface PropertyWithDetails extends BaseProperty {
    landlord: ProfileRow | null
    property_media: MediaRow[]
}

const electricityMap: Record<string, string> = {
    A: 'Band A (24/7 Power)',
    B: 'Band B (18-20hrs)',
    C: 'Band C (12-16hrs)',
    D: 'Band D (6-10hrs)',
    E: 'Band E (Unstable)',
}

const waterMap: Record<string, string> = {
    borehole: 'Borehole Water',
    mains: 'Mains Supply',
    well: 'Well Water',
}

const securityMap: Record<string, string> = {
    estate_security: 'Estate Patrol',
    street_gate: 'Secured Gate',
    none: 'No Security Gate',
}

const roadMap: Record<string, string> = {
    tarred: 'Tarred Road Network',
    interlocked: 'Interlocked Paving',
    untarred: 'Untarred Access',
}

const propertyTypeMap: Record<string, string> = {
    flat: 'Flat / Apartment',
    bungalow: 'Bungalow',
    duplex: 'Duplex Mansion',
    room: 'Single Room Unit',
    self_contain: 'Self-Contained',
    studio: 'Studio Apartment',
}

export default function PropertyDetailPage() {
    const params = useParams()
    const router = useRouter()
    const propertyId = params.id as string

    const { user, profile: authProfile } = useAuth()
    const [property, setProperty] = useState<PropertyWithDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [requesting, setRequesting] = useState(false)
    const [requestSuccess, setRequestSuccess] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    useEffect(() => {
        const fetchPropertyDataDeck = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const { data, error: queryError } = await supabase
                    .from('properties')
                    .select(`
            *,
            landlord:landlord_id(*),
            property_media(*)
          `)
                    .eq('id', propertyId)
                    .single()

                if (queryError) throw new Error(queryError.message)
                if (!data) throw new Error('Requested listing could not be resolved.')

                const extendedProperty = data as unknown as PropertyWithDetails
                setProperty(extendedProperty)

                const primaryMedia = extendedProperty.property_media?.find(m => m.is_thumbnail) ||
                    extendedProperty.property_media?.find(m => m.media_type === 'image')

                if (primaryMedia) setSelectedImage(primaryMedia.url)
            } catch (err: any) {
                console.error('Failure fetching property graph details:', err)
                setError(err.message || 'Failed to mount property contextual record.')
            } finally {
                setIsLoading(false)
            }
        }

        if (propertyId) fetchPropertyDataDeck()
    }, [propertyId])

    const handleRequestViewing = async () => {
        if (!user) {
            router.push(`/login?redirectTo=${encodeURIComponent(`/properties/${propertyId}`)}`)
            return
        }

        if (!property || !property.landlord_id) {
            alert('Error: Property details are still initializing. Please try again.')
            return
        }

        if (authProfile?.role !== 'tenant') {
            alert('Action Restricted: Only verified tenant accounts can request viewing arrangements.')
            return
        }

        setRequesting(true)
        try {
            const insertPayload: Database['public']['Tables']['viewing_requests']['Insert'] = {
                property_id: propertyId,
                tenant_id: user.id,
                landlord_id: property.landlord_id,
                status: 'PENDING',
            }

            const { error: insertError } = await (supabase.from('viewing_requests') as any)
                .insert(insertPayload)

            if (insertError) throw insertError

            fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: property?.landlord?.email,
                    type: 'viewing_request',
                    data: {
                        propertyTitle: property?.title,
                        tenantName: authProfile.full_name || 'A user',
                    },
                }),
            }).catch(err => console.error('Transactional notification background fail:', err))

            setRequestSuccess(true)
            setTimeout(() => {
                router.push('/tenant/chat')
            }, 2000)
        } catch (err: any) {
            alert(err.message || 'Failed to lodge inspection intent request.')
        } finally {
            setRequesting(false)
        }
    }

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-cloud-whisper flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl space-y-6 animate-pulse">
                        <div className="h-96 bg-pale-ash rounded-2xl" />
                        <div className="h-8 bg-pale-ash rounded w-1/2" />
                        <div className="h-4 bg-pale-ash rounded w-1/3" />
                    </div>
                </div>
            </>
        )
    }

    if (error || !property) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-cloud-whisper flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-charcoal-tone mb-1">Listing Unresolved</h1>
                        <p className="text-sm text-inkwell-gray mb-6">{error || 'This asset context is no longer active.'}</p>
                        <Link href="/properties">
                            <Button variant="primary">Return to Property Index</Button>
                        </Link>
                    </div>
                </div>
            </>
        )
    }

    const imagesList = property.property_media?.filter(m => m.media_type === 'image') || []
    const videosList = property.property_media?.filter(m => m.media_type === 'video') || []
    const defaultDisplayUrl = selectedImage || '/images/property-placeholder.jpg'

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-cloud-whisper pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <Link href="/properties" className="inline-flex items-center text-sm font-semibold text-sky-connect hover:underline mb-5 transition-all">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to search listings
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Gallery Deck Panel */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-pure-white rounded-2xl overflow-hidden border border-pale-ash/40 shadow-subtle">
                                <div className="relative h-[420px] w-full bg-cloud-whisper">
                                    <Image
                                        src={defaultDisplayUrl}
                                        alt={property.title}
                                        fill
                                        className="object-cover transition-all duration-300"
                                        priority
                                    />
                                </div>

                                {imagesList.length > 1 && (
                                    <div className="flex gap-2.5 p-4 overflow-x-auto border-t border-pale-ash/40 bg-cloud-whisper/20">
                                        {imagesList.map((media) => (
                                            <button
                                                key={media.id}
                                                onClick={() => setSelectedImage(media.url)}
                                                className={cn(
                                                    'relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 shadow-sm',
                                                    selectedImage === media.url ? 'border-sky-connect scale-95 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                                                )}
                                            >
                                                <Image src={media.url} alt="Listing asset view" fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {videosList.length > 0 && (
                                    <div className="p-5 border-t border-pale-ash/50 bg-pure-white">
                                        <h3 className="text-sm font-bold text-charcoal-tone mb-3 uppercase tracking-wider">Video Tour Presentation</h3>
                                        {videosList.map((video) => (
                                            <video
                                                key={video.id}
                                                src={video.url}
                                                controls
                                                className="w-full rounded-xl max-h-80 bg-black object-contain shadow-subtle"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Comprehensive Description Information */}
                            <div className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div>
                                        <h1 className="text-2xl font-black text-charcoal-tone tracking-tight">{property.title}</h1>
                                        <div className="flex items-center text-xs font-semibold text-inkwell-gray mt-2">
                                            <MapPin className="h-4 w-4 mr-1 text-stone-slate shrink-0" />
                                            <span>{property.address}, {property.lga}, {property.state}</span>
                                        </div>
                                    </div>
                                    <div className="sm:text-right bg-sky-connect/5 border border-sky-connect/10 px-4 py-2 rounded-xl shrink-0">
                                        <p className="text-xl font-black text-sky-connect">{formatNaira(property.annual_rent)}</p>
                                        <p className="text-xs font-semibold text-inkwell-gray">Annual Base Rent</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-5 py-4 border-y border-pale-ash/60 text-xs font-bold text-charcoal-tone">
                                    <div className="flex items-center gap-1.5">
                                        <Bed className="h-4 w-4 text-inkwell-gray" />
                                        <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                                    </div>
                                    <div className="h-3 w-[1px] bg-pale-ash" />
                                    <div className="flex items-center gap-1.5">
                                        <Bath className="h-4 w-4 text-inkwell-gray" />
                                        <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                                    </div>
                                    <div className="h-3 w-[1px] bg-pale-ash" />
                                    <div className="flex items-center gap-1.5">
                                        <HomeIcon className="h-4 w-4 text-inkwell-gray" />
                                        <span>{propertyTypeMap[property.property_type] || property.property_type}</span>
                                    </div>
                                    {property.is_furnished && (
                                        <>
                                            <div className="h-3 w-[1px] bg-pale-ash" />
                                            <div className="flex items-center gap-1.5 text-deep-plum">
                                                <CheckCircle className="h-4 w-4 fill-current text-deep-plum/20" />
                                                <span>Fully Furnished</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {property.description && (
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-2">Listing Narrative</h3>
                                        <p className="text-sm font-medium text-charcoal-tone leading-relaxed whitespace-pre-wrap">{property.description}</p>
                                    </div>
                                )}

                                {/* Infrastructure Metric Cards */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-3">Verified Utility Matrix</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {property.electricity_band && (
                                            <div className="bg-cloud-whisper/60 border border-pale-ash/30 rounded-xl p-3 text-center">
                                                <Zap className="h-4 w-4 mx-auto mb-1.5 text-sky-connect fill-current" />
                                                <p className="text-[11px] font-bold text-charcoal-tone">{electricityMap[property.electricity_band]}</p>
                                            </div>
                                        )}
                                        {property.water_source && (
                                            <div className="bg-cloud-whisper/60 border border-pale-ash/30 rounded-xl p-3 text-center">
                                                <Droplet className="h-4 w-4 mx-auto mb-1.5 text-sky-connect fill-current" />
                                                <p className="text-[11px] font-bold text-charcoal-tone">{waterMap[property.water_source]}</p>
                                            </div>
                                        )}
                                        {property.security_rating && (
                                            <div className="bg-cloud-whisper/60 border border-pale-ash/30 rounded-xl p-3 text-center">
                                                <Shield className="h-4 w-4 mx-auto mb-1.5 text-indigo-600" />
                                                <p className="text-[11px] font-bold text-charcoal-tone">{securityMap[property.security_rating]}</p>
                                            </div>
                                        )}
                                        {property.road_condition && (
                                            <div className="bg-cloud-whisper/60 border border-pale-ash/30 rounded-xl p-3 text-center">
                                                <Route className="h-4 w-4 mx-auto mb-1.5 text-amber-600" />
                                                <p className="text-[11px] font-bold text-charcoal-tone">{roadMap[property.road_condition]}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Move-in Costs Structure Breakdown */}
                        <div className="space-y-6">
                            <div className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle lg:sticky lg:top-24">
                                <h3 className="text-base font-extrabold text-charcoal-tone tracking-tight mb-4">Total Breakdown Cost Package</h3>
                                <div className="space-y-3.5 text-xs font-semibold text-inkwell-gray">
                                    <div className="flex justify-between items-center">
                                        <span>Base Annual Rent</span>
                                        <span className="text-charcoal-tone font-bold">{formatNaira(property.annual_rent)}</span>
                                    </div>
                                    {Number(property.caution_fee) > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span>Refundable Caution Deposit</span>
                                            <span className="text-charcoal-tone font-bold">{formatNaira(property.caution_fee)}</span>
                                        </div>
                                    )}
                                    {Number(property.agency_fee) > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span>Agency Logistics Fee</span>
                                            <span className="text-charcoal-tone font-bold">{formatNaira(property.agency_fee)}</span>
                                        </div>
                                    )}
                                    {Number(property.agreement_fee) > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span>Legal Agreement Documentation</span>
                                            <span className="text-charcoal-tone font-bold">{formatNaira(property.agreement_fee)}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-pale-ash/60 pt-4 mt-4">
                                        <div className="flex justify-between items-center text-sm font-black">
                                            <span className="text-charcoal-tone">Total Package Price</span>
                                            <span className="text-sky-connect text-base">{formatNaira(property.total_package)}</span>
                                        </div>
                                        <p className="text-[10px] text-stone-slate tracking-wide mt-2 font-medium">
                                            * Strictly inclusive of transparently mapped legalities. No added off-platform variables.
                                        </p>
                                    </div>

                                    {!requestSuccess ? (
                                        <Button
                                            fullWidth
                                            size="md"
                                            onClick={handleRequestViewing}
                                            disabled={requesting || (user !== null && authProfile?.role !== 'tenant')}
                                            className="mt-6 rounded-xl font-bold py-3 text-sm"
                                        >
                                            {requesting ? 'Processing Intent...' : 'Book In-Person Inspection (Free)'}
                                        </Button>
                                    ) : (
                                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center animate-in fade-in">
                                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                            <p className="text-green-700 font-bold text-xs">Inspection Intent Logged</p>
                                            <p className="text-[11px] text-green-600 mt-0.5">Redirecting to chat pipeline thread context...</p>
                                        </div>
                                    )}

                                    {!user && (
                                        <p className="text-[11px] text-center text-stone-slate mt-3 font-semibold">
                                            Please <Link href="/login" className="text-sky-connect hover:underline">Sign In</Link> to initiate viewing requests.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Verified Landlord Profile Contact Core */}
                            {property.landlord && (
                                <div className="bg-pure-white rounded-2xl p-5 border border-pale-ash/40 shadow-subtle">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-inkwell-gray mb-3.5">Property Listing Ownership</h4>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-charcoal-tone">{property.landlord.full_name}</p>
                                            {property.landlord.kyc_verified && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                    KYC Verified
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 pt-1.5 border-t border-pale-ash/40 text-xs font-medium text-inkwell-gray">
                                            {property.landlord.email && (
                                                <div className="flex items-center gap-2 truncate">
                                                    <Mail className="h-3.5 w-3.5 text-stone-slate" />
                                                    <span>{property.landlord.email}</span>
                                                </div>
                                            )}
                                            {property.landlord.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-stone-slate" />
                                                    <span>{property.landlord.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

