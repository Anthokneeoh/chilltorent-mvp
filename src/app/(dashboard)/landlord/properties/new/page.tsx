'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { prepareMediaFile } from '@/services/compression'
import { cn, formatNaira } from '@/lib/utils/formatters'
import { X, Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

const propertySchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().optional(),
    property_type: z.enum(['flat', 'bungalow', 'duplex', 'room', 'self_contain', 'studio']),
    bedrooms: z.number().min(0).max(10),
    bathrooms: z.number().min(0).max(10),
    annual_rent: z.number().min(10000, 'Annual rent must be at least ₦10,000'),
    caution_fee: z.number().min(0),
    agency_fee: z.number().min(0),
    agreement_fee: z.number().min(0),
    legal_fee: z.number().min(0),
    address: z.string().min(5, 'Please enter a valid address'),
    lga: z.string().min(2, 'Please enter Local Government Area'),
    state: z.string(),
    electricity_band: z.enum(['A', 'B', 'C', 'D', 'E']),
    water_source: z.enum(['borehole', 'mains', 'well']),
    security_rating: z.enum(['estate_security', 'street_gate', 'none']),
    road_condition: z.enum(['tarred', 'interlocked', 'untarred']),
    is_furnished: z.boolean(),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface MediaItem {
    id: string
    file: File
    url: string
    type: 'image' | 'video'
    is_thumbnail: boolean
    sort_order: number
}

export default function NewPropertyPage() {
    const router = useRouter()
    const { user } = useAuth()

    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [ownershipDoc, setOwnershipDoc] = useState<File | null>(null)
    const [ownershipDocUrl, setOwnershipDocUrl] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            title: '',
            description: '',
            property_type: 'flat',
            bedrooms: 1,
            bathrooms: 1,
            annual_rent: 100000,
            caution_fee: 0,
            agency_fee: 0,
            agreement_fee: 0,
            legal_fee: 0,
            address: '',
            lga: '',
            electricity_band: 'B',
            water_source: 'mains',
            security_rating: 'street_gate',
            road_condition: 'tarred',
            is_furnished: false,
            state: 'Lagos',
        },
    })

    const annualRent = watch('annual_rent') || 0
    const cautionFee = watch('caution_fee') || 0
    const agencyFee = watch('agency_fee') || 0
    const agreementFee = watch('agreement_fee') || 0
    const legalFee = watch('legal_fee') || 0
    const totalPackage = annualRent + cautionFee + agencyFee + agreementFee + legalFee

    const handleMediaSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        if (mediaItems.length + files.length > 10) {
            setUploadError('Maximum of 10 media showcase listings permitted per asset profile.')
            return
        }

        setUploadError(null)
        setIsUploading(true)
        const newItems: MediaItem[] = []

        for (const file of files) {
            try {
                const prepared = await prepareMediaFile(file)
                const objectUrl = URL.createObjectURL(prepared.file)

                newItems.push({
                    id: Math.random().toString(36).substring(2, 11),
                    file: prepared.file,
                    url: objectUrl,
                    type: prepared.media_type,
                    is_thumbnail: mediaItems.length === 0 && newItems.length === 0,
                    sort_order: mediaItems.length + newItems.length,
                })
            } catch (err: any) {
                setUploadError(err.message || 'File preprocessing boundaries violated.')
            }
        }

        setMediaItems(prev => [...prev, ...newItems])
        setIsUploading(false)
    }, [mediaItems.length])

    const removeMedia = (id: string) => {
        setMediaItems(prev => {
            const targetItem = prev.find(item => item.id === id)
            if (targetItem?.url) URL.revokeObjectURL(targetItem.url)

            const remainingItems = prev.filter(item => item.id !== id)
            if (targetItem?.is_thumbnail && remainingItems.length > 0) {
                remainingItems[0].is_thumbnail = true
            }
            return remainingItems.map((item, index) => ({ ...item, sort_order: index }))
        })
    }

    const setAsThumbnail = (id: string) => {
        setMediaItems(prev => prev.map(item => ({ ...item, is_thumbnail: item.id === id })))
    }

    const handleOwnershipDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Verification paperwork attachments must scale underneath a 5MB payload boundary.')
            return
        }

        setOwnershipDoc(file)
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'ownership_docs')

            const res = await fetch('/api/cloudinary/upload', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok || !data.secure_url) throw new Error(data.error || 'Upload rejection.')
            setOwnershipDocUrl(data.secure_url)
        } catch (err: any) {
            setUploadError(err.message || 'Failed to safely store proof of ownership documents.')
            setOwnershipDoc(null)
        } finally {
            setIsUploading(false)
        }
    }

    const uploadAllMedia = async () => {
        const uploadPromises = mediaItems.map(async (item) => {
            const formData = new FormData()
            formData.append('file', item.file)
            formData.append('folder', 'property_media')
            formData.append('type', item.type)

            const res = await fetch('/api/cloudinary/upload', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok || !data.secure_url) throw new Error(`Media transfer failed: ${item.file.name}`)

            return {
                url: data.secure_url,
                type: item.type,
                is_thumbnail: item.is_thumbnail,
                sort_order: item.sort_order,
            }
        })

        return Promise.all(uploadPromises)
    }

    const onSubmit = async (formData: PropertyFormData) => {
        if (!user) {
            alert('Authentication session required. Re-routing to entry access systems.')
            router.push('/login')
            return
        }
        if (mediaItems.length === 0) {
            setUploadError('Minimum of 1 image context required to register real estate availability.')
            return
        }
        if (!ownershipDocUrl) {
            setUploadError('Proof of structural authority and ownership matching documentation is required.')
            return
        }

        setSubmitting(true)
        setUploadError(null)

        try {
            const mediaUploads = await uploadAllMedia()

            const { data: property, error: propertyError } = await (supabase.from('properties') as any)
                .insert({
                    landlord_id: user.id,
                    title: formData.title,
                    description: formData.description || null,
                    property_type: formData.property_type,
                    bedrooms: formData.bedrooms,
                    bathrooms: formData.bathrooms,
                    annual_rent: formData.annual_rent,
                    caution_fee: formData.caution_fee,
                    agency_fee: formData.agency_fee,
                    agreement_fee: formData.agreement_fee,
                    legal_fee: formData.legal_fee,
                    address: formData.address,
                    lga: formData.lga,
                    state: formData.state,
                    electricity_band: formData.electricity_band,
                    water_source: formData.water_source,
                    security_rating: formData.security_rating,
                    road_condition: formData.road_condition,
                    is_furnished: formData.is_furnished,
                    ownership_doc_url: ownershipDocUrl,
                    status: 'PENDING_PAYMENT',
                })
                .select()
                .single()

            if (propertyError) throw propertyError

            if (mediaUploads.length > 0) {
                const { error: mediaError } = await (supabase.from('property_media') as any)
                    .insert(
                        mediaUploads.map(m => ({
                            property_id: property.id,
                            url: m.url,
                            media_type: m.type as 'image' | 'video',
                            is_thumbnail: m.is_thumbnail,
                            sort_order: m.sort_order,
                        }))
                    )
                if (mediaError) throw mediaError
            }

            alert('Real estate profile generated! Listings move active following layout verification review checks.')
            router.push('/landlord')
        } catch (err: any) {
            console.error('Listing transaction failure:', err)
            setUploadError(err.message || 'System architecture rejected tracking deployment configuration updates.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">List a New Property</h1>
                            <p className="text-sm font-medium text-inkwell-gray mt-1">Register real estate parameters onto active discovery feeds</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Information */}
                            <section className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-4">
                                <h2 className="text-base font-bold uppercase tracking-wider text-inkwell-gray">Basic Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Property Title *</label>
                                        <input
                                            {...register('title')}
                                            placeholder="e.g., Luxury 3 Bedroom Apartment with Fitted Kitchen"
                                            className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-connect/40"
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.title.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Detailed Narrative Description</label>
                                        <textarea
                                            {...register('description')}
                                            rows={4}
                                            placeholder="Highlight spatial features, premium updates, compound configurations, and surrounding access indexes..."
                                            className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-connect/40 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Property Configuration Type *</label>
                                            <select {...register('property_type')} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold bg-pure-white focus:outline-none focus:ring-2 focus:ring-sky-connect/40">
                                                <option value="flat">Flat / Apartment</option>
                                                <option value="bungalow">Bungalow</option>
                                                <option value="duplex">Duplex</option>
                                                <option value="room">Single Room Unit</option>
                                                <option value="self_contain">Self-Contained</option>
                                                <option value="studio">Studio Apartment</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Bedroom Count</label>
                                            <input type="number" {...register('bedrooms', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Bathroom Count</label>
                                            <input type="number" {...register('bathrooms', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="inline-flex items-center gap-2.5 cursor-pointer group select-none">
                                            <input type="checkbox" {...register('is_furnished')} className="h-4 w-4 rounded border-pale-ash/60 text-sky-connect focus:ring-sky-connect cursor-pointer" />
                                            <span className="text-xs font-bold text-charcoal-tone group-hover:text-sky-connect transition-colors">This space is fully furnished and structurally complete</span>
                                        </label>
                                    </div>
                                </div>
                            </section>

                            {/* Pricing Structures */}
                            <section className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-4">
                                <h2 className="text-base font-bold uppercase tracking-wider text-inkwell-gray">Pricing & Move-In Breakdown</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Base Annual Rent (₦) *</label>
                                        <input type="number" {...register('annual_rent', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Refundable Caution Deposit (₦)</label>
                                        <input type="number" {...register('caution_fee', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Agency Logistics Commission (₦)</label>
                                        <input type="number" {...register('agency_fee', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Legal Documentation Prep Fee (₦)</label>
                                        <input type="number" {...register('agreement_fee', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                    </div>

                                    <div className="sm:col-span-2 bg-cloud-whisper/60 border border-pale-ash/30 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-inkwell-gray uppercase tracking-wider">Calculated Total Package Fee</p>
                                            <p className="text-[10px] text-stone-slate font-medium mt-0.5">* Fully transparent aggregated move-in cost context presented to tenants</p>
                                        </div>
                                        <p className="text-xl font-black text-sky-connect tracking-tight">{formatNaira(totalPackage)}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Location */}
                            <section className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-4">
                                <h2 className="text-base font-bold uppercase tracking-wider text-inkwell-gray">Geographic Allocation</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Street Address *</label>
                                        <input {...register('address')} placeholder="e.g., 14, Admiralty Way, Phase 1" className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                        {errors.address && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.address.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Local Government Area (LGA) *</label>
                                        <input {...register('lga')} placeholder="e.g., Eti-Osa, Surulere" className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40" />
                                        {errors.lga && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.lga.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">State Territory Bound</label>
                                        <input {...register('state')} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-connect/40 bg-cloud-whisper/40" readOnly />
                                    </div>
                                </div>
                            </section>

                            {/* Infrastructure */}
                            <section className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-4">
                                <h2 className="text-base font-bold uppercase tracking-wider text-inkwell-gray">Verified Infrastructure Matrices</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Electricity Supply Band</label>
                                        <select {...register('electricity_band')} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold bg-pure-white focus:outline-none focus:ring-2 focus:ring-sky-connect/40">
                                            <option value="A">Band A (24/7 Premium Power Allocation)</option>
                                            <option value="B">Band B (Good Supply: 18-20hrs Average)</option>
                                            <option value="C">Band C (Fair Supply: 12-16hrs Average)</option>
                                            <option value="D">Band D (Poor Supply: 6-10hrs Average)</option>
                                            <option value="E">Band E (Unstable Grid / Generator Required)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Water Infrastructure</label>
                                        <select {...register('water_source')} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold bg-pure-white focus:outline-none focus:ring-2 focus:ring-sky-connect/40">
                                            <option value="borehole">Borehole Treatment Filtration System</option>
                                            <option value="mains">Mains Centralized Public Supply</option>
                                            <option value="well">Open Well Water Reserve</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Security Gate Configuration</label>
                                        <select {...register('security_rating')} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold bg-pure-white focus:outline-none focus:ring-2 focus:ring-sky-connect/40">
                                            <option value="estate_security">Full Private Estate Perimeter Patrol</option>
                                            <option value="street_gate">Secured Dedicated Street Gate Barriers</option>
                                            <option value="none">Open Access Neighborhood Structure</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-tone mb-1.5">Road Network Condition</label>
                                        <select {...register('road_condition')} className="w-full px-4 py-2.5 border border-pale-ash/60 rounded-xl text-sm font-semibold bg-pure-white focus:outline-none focus:ring-2 focus:ring-sky-connect/40">
                                            <option value="tarred">Smooth Tarred Asphalt Network</option>
                                            <option value="interlocked">Interlocked Paving Blocks</option>
                                            <option value="untarred">Untarred Earth Road Access</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Media Upload */}
                            <section className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-4">
                                <h2 className="text-base font-bold uppercase tracking-wider text-inkwell-gray">Photos & Video Presentation</h2>

                                <div className="border-2 border-dashed border-pale-ash/60 rounded-xl p-6 text-center hover:bg-cloud-whisper/20 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleMediaSelect}
                                        className="hidden"
                                        id="mediaUpload"
                                        disabled={isUploading}
                                    />
                                    <label htmlFor="mediaUpload" className="cursor-pointer inline-flex flex-col items-center select-none">
                                        <Upload className="h-8 w-8 text-sky-connect mb-2" />
                                        <span className="text-sm font-bold text-sky-connect">Browse asset visual records</span>
                                        <span className="text-[11px] text-stone-slate mt-1 font-medium">Supports JPG, PNG or max 30s MP4 files. Maximum of 10 context frames items total.</span>
                                    </label>
                                </div>

                                {isUploading && (
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-connect py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Compressing & optimizing asset presentation blocks...</span>
                                    </div>
                                )}

                                {mediaItems.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                        {mediaItems.map((item) => (
                                            <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-cloud-whisper border border-pale-ash/30 shadow-sm">
                                                {item.type === 'image' ? (
                                                    <img src={item.url} alt="Listing context preview" className="h-full w-full object-cover" />
                                                ) : (
                                                    <video src={item.url} className="h-full w-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-charcoal-tone/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAsThumbnail(item.id)}
                                                        className={cn('p-1.5 rounded-full text-charcoal-tone transition-colors', item.is_thumbnail ? 'bg-sky-connect text-pure-white' : 'bg-pure-white hover:bg-pale-ash')}
                                                        title="Assign Cover Thumbnail Frame"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedia(item.id)}
                                                        className="p-1.5 rounded-full bg-red-500 text-pure-white hover:bg-red-600 transition-colors"
                                                        title="Drop Asset Resource"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {item.is_thumbnail && (
                                                    <span className="absolute top-2 left-2 bg-sky-connect text-pure-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Cover Frame</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Ownership Verification */}
                            <section className="bg-pure-white rounded-2xl p-6 border border-pale-ash/40 shadow-subtle space-y-4">
                                <h2 className="text-base font-bold uppercase tracking-wider text-inkwell-gray">Proof of Ownership Verification</h2>
                                <p className="text-xs font-medium text-stone-slate leading-relaxed">
                                    To safeguard tenant interactions, uploading verified regulatory frameworks (e.g., Certificate of Occupancy, Registered Deed, or Certified Utility Mandates) matching listing bounds is mandatory.
                                </p>

                                <div className="border border-pale-ash/60 rounded-xl p-4 bg-cloud-whisper/20">
                                    <input type="file" accept="image/*,application/pdf" onChange={handleOwnershipDocSelect} className="hidden" id="ownershipDoc" disabled={isUploading} />
                                    <label htmlFor="ownershipDoc" className="cursor-pointer inline-flex items-center gap-2.5 text-xs font-bold text-sky-connect select-none hover:underline">
                                        <Upload className="h-4 w-4 shrink-0" />
                                        <span>{ownershipDoc ? ownershipDoc.name : 'Upload Legal Certificate Credentials (PDF/JPG)'}</span>
                                    </label>
                                </div>

                                {ownershipDocUrl && (
                                    <p className="text-green-600 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                                        <CheckCircle className="h-4 w-4 fill-current text-green-500/10" />
                                        Verification legal matrix packet linked successfully.
                                    </p>
                                )}
                            </section>

                            {/* Feedback Error Panel */}
                            {uploadError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs font-semibold text-red-700 leading-relaxed">{uploadError}</span>
                                </div>
                            )}

                            {/* Action Controls */}
                            <div className="flex justify-end items-center gap-3 pt-2 pb-8">
                                <Button type="button" variant="ghost" onClick={() => router.back()} className="text-sm font-bold">
                                    Cancel Listing Creation
                                </Button>
                                <Button type="submit" disabled={submitting || isUploading || !ownershipDocUrl} className="rounded-xl px-6 font-bold text-sm">
                                    {submitting ? 'Deploying Listing Matrices...' : 'List Real Estate Asset Profile'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </>
    )
}