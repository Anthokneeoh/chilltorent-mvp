export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'tenant' | 'landlord' | 'admin'
                    full_name: string
                    email: string
                    phone: string | null
                    email_verified: boolean
                    avatar_url: string | null
                    kyc_verified: boolean
                    created_at: string
                }
                Insert: {
                    id: string
                    role?: 'tenant' | 'landlord' | 'admin'
                    full_name: string
                    email: string
                    phone?: string | null
                    email_verified?: boolean
                    avatar_url?: string | null
                    kyc_verified?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    role?: 'tenant' | 'landlord' | 'admin'
                    full_name?: string
                    email?: string
                    phone?: string | null
                    email_verified?: boolean
                    avatar_url?: string | null
                    kyc_verified?: boolean
                    created_at?: string
                }
            }
            properties: {
                Row: {
                    id: string
                    landlord_id: string
                    title: string
                    description: string | null
                    property_type: 'flat' | 'bungalow' | 'duplex' | 'room' | 'self_contain' | 'studio'
                    bedrooms: number
                    bathrooms: number
                    annual_rent: number
                    caution_fee: number
                    agency_fee: number
                    agreement_fee: number
                    legal_fee: number
                    total_package: number
                    address: string
                    lga: string
                    state: string
                    lat: number | null
                    lng: number | null
                    electricity_band: 'A' | 'B' | 'C' | 'D' | 'E'
                    water_source: 'borehole' | 'mains' | 'well'
                    security_rating: 'estate_security' | 'street_gate' | 'none'
                    road_condition: 'tarred' | 'interlocked' | 'untarred'
                    is_furnished: boolean
                    ownership_doc_url: string | null
                    status: 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'RENTED' | 'OFFLINE'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    title: string
                    description?: string | null
                    property_type: 'flat' | 'bungalow' | 'duplex' | 'room' | 'self_contain' | 'studio'
                    bedrooms: number
                    bathrooms: number
                    annual_rent: number
                    caution_fee?: number
                    agency_fee?: number
                    agreement_fee?: number
                    legal_fee?: number
                    address: string
                    lga: string
                    state?: string
                    lat?: number | null
                    lng?: number | null
                    electricity_band: 'A' | 'B' | 'C' | 'D' | 'E'
                    water_source: 'borehole' | 'mains' | 'well'
                    security_rating: 'estate_security' | 'street_gate' | 'none'
                    road_condition: 'tarred' | 'interlocked' | 'untarred'
                    is_furnished?: boolean
                    ownership_doc_url?: string | null
                    status?: 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'RENTED' | 'OFFLINE'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    title?: string
                    description?: string | null
                    property_type?: 'flat' | 'bungalow' | 'duplex' | 'room' | 'self_contain' | 'studio'
                    bedrooms?: number
                    bathrooms?: number
                    annual_rent?: number
                    caution_fee?: number
                    agency_fee?: number
                    agreement_fee?: number
                    legal_fee?: number
                    address?: string
                    lga?: string
                    state?: string
                    lat?: number | null
                    lng?: number | null
                    electricity_band?: 'A' | 'B' | 'C' | 'D' | 'E'
                    water_source?: 'borehole' | 'mains' | 'well'
                    security_rating?: 'estate_security' | 'street_gate' | 'none'
                    road_condition?: 'tarred' | 'interlocked' | 'untarred'
                    is_furnished?: boolean
                    ownership_doc_url?: string | null
                    status?: 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'RENTED' | 'OFFLINE'
                    created_at?: string
                    updated_at?: string
                }
            }
            property_media: {
                Row: {
                    id: string
                    property_id: string
                    url: string
                    media_type: 'image' | 'video'
                    is_thumbnail: boolean
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    url: string
                    media_type: 'image' | 'video'
                    is_thumbnail?: boolean
                    sort_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    url?: string
                    media_type?: 'image' | 'video'
                    is_thumbnail?: boolean
                    sort_order?: number
                    created_at?: string
                }
            }
            viewing_requests: {
                Row: {
                    id: string
                    property_id: string
                    tenant_id: string
                    landlord_id: string
                    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
                    proposed_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    tenant_id: string
                    landlord_id: string
                    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
                    proposed_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
                    proposed_date?: string | null
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    viewing_request_id: string
                    sender_id: string
                    body: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    viewing_request_id: string
                    sender_id: string
                    body: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    viewing_request_id?: string
                    sender_id?: string
                    body?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            agreements: {
                Row: {
                    id: string
                    viewing_request_id: string | null
                    property_id: string | null
                    landlord_id: string | null
                    tenant_id: string | null
                    pdf_url: string | null
                    status: 'DRAFT' | 'GENERATED' | 'DOWNLOADED_LANDLORD' | 'DOWNLOADED_TENANT'
                    generated_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    viewing_request_id?: string | null
                    property_id?: string | null
                    landlord_id?: string | null
                    tenant_id?: string | null
                    pdf_url?: string | null
                    status?: 'DRAFT' | 'GENERATED' | 'DOWNLOADED_LANDLORD' | 'DOWNLOADED_TENANT'
                    generated_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    viewing_request_id?: string | null
                    property_id?: string | null
                    landlord_id?: string | null
                    tenant_id?: string | null
                    pdf_url?: string | null
                    status?: 'DRAFT' | 'GENERATED' | 'DOWNLOADED_LANDLORD' | 'DOWNLOADED_TENANT'
                    generated_at?: string | null
                    created_at?: string
                }
            }
            listing_payments: {
                Row: {
                    id: string
                    property_id: string
                    landlord_id: string
                    amount_paid: number | null
                    payment_method: 'bank_transfer' | 'ussd' | null
                    payment_proof_url: string | null
                    confirmed_by: string | null
                    confirmed_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    landlord_id: string
                    amount_paid?: number | null
                    payment_method?: 'bank_transfer' | 'ussd' | null
                    payment_proof_url?: string | null
                    confirmed_by?: string | null
                    confirmed_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    landlord_id?: string
                    amount_paid?: number | null
                    payment_method?: 'bank_transfer' | 'ussd' | null
                    payment_proof_url?: string | null
                    confirmed_by?: string | null
                    confirmed_at?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
