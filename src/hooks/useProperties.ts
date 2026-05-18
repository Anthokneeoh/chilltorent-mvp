import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type BaseProperty = Database['public']['Tables']['properties']['Row']

export interface PropertyWithThumbnail extends BaseProperty {
    thumbnail_url?: string | null
}

export interface PropertyFilters {
    minRent?: number
    maxRent?: number
    lga?: string
    bedrooms?: number
    electricityBand?: string
    waterSource?: string
    securityRating?: string
    roadCondition?: string
    isFurnished?: boolean
    propertyType?: string
}

interface UsePropertiesReturn {
    properties: PropertyWithThumbnail[]
    isLoading: boolean
    error: string | null
    totalCount: number
    loadMore: () => void
    refetch: () => void
    hasMore: boolean
}


export function useProperties(
    filters: PropertyFilters = {},
    role: 'tenant' | 'landlord' | 'admin' = 'tenant',
    landlordId?: string,
    limit: number = 12
): UsePropertiesReturn {
    const [properties, setProperties] = useState<PropertyWithThumbnail[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [hasMore, setHasMore] = useState(true)


    const serializedFilters = JSON.stringify(filters)

    const fetchProperties = useCallback(async (pageNum: number, reset: boolean = false) => {
        setIsLoading(true)
        setError(null)

        try {

            let query = supabase
                .from('properties')
                .select(`
          *,
          property_media(
            url,
            is_thumbnail
          )
        `, { count: 'exact' })


            if (role === 'tenant') {
                query = query.eq('status', 'ACTIVE')
            } else if (role === 'landlord' && landlordId) {
                query = query.eq('landlord_id', landlordId)
                    .in('status', ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'RENTED', 'OFFLINE'])
            } else if (role === 'admin') {
                query = query.in('status', ['PENDING_PAYMENT', 'PENDING_APPROVAL'])
            }


            if (filters.minRent !== undefined) query = query.gte('annual_rent', filters.minRent)
            if (filters.maxRent !== undefined) query = query.lte('annual_rent', filters.maxRent)
            if (filters.lga) query = query.ilike('lga', `%${filters.lga}%`)
            if (filters.bedrooms !== undefined) query = query.eq('bedrooms', filters.bedrooms)
            if (filters.electricityBand) query = query.eq('electricity_band', filters.electricityBand)
            if (filters.waterSource) query = query.eq('water_source', filters.waterSource)
            if (filters.securityRating) query = query.eq('security_rating', filters.securityRating)
            if (filters.roadCondition) query = query.eq('road_condition', filters.roadCondition)
            if (filters.isFurnished !== undefined) query = query.eq('is_furnished', filters.isFurnished)
            if (filters.propertyType) query = query.eq('property_type', filters.propertyType)


            const from = pageNum * limit
            const to = from + limit - 1
            query = query.range(from, to).order('created_at', { ascending: false })

            const { data, error: queryError, count } = await query
            if (queryError) throw new Error(queryError.message)


            const transformedProperties: PropertyWithThumbnail[] = (data || []).map((item: any) => {
                const mediaList = item.property_media || []
                const primaryMedia = mediaList.find((m: any) => m.is_thumbnail === true) || mediaList[0]

                return {
                    ...item,
                    thumbnail_url: primaryMedia?.url || null,
                }
            })

            setTotalCount(count || 0)
            setHasMore((from + limit) < (count || 0))

            if (reset) {
                setProperties(transformedProperties)
            } else {
                setProperties(prev => [...prev, ...transformedProperties])
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch properties')
        } finally {
            setIsLoading(false)
        }

    }, [serializedFilters, role, landlordId, limit])

    const loadMore = () => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchProperties(nextPage, false)
        }
    }

    const refetch = () => {
        setPage(0)
        fetchProperties(0, true)
    }

    useEffect(() => {
        setPage(0)
        fetchProperties(0, true)
    }, [serializedFilters, role, landlordId, fetchProperties])

    return {
        properties,
        isLoading,
        error,
        totalCount,
        loadMore,
        refetch,
        hasMore,
    }
}