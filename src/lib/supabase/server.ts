import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from './types'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {

                    }
                },
            },
        }
    )
}


export async function createAdminSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {

                    }
                },
            },
        }
    )
}

export async function getCurrentUser() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Profile | null }

    return { user, profile }
}


export async function hasRole(requiredRole: 'tenant' | 'landlord' | 'admin') {
    const accountInstance = await getCurrentUser()

    if (!accountInstance || !accountInstance.profile) {
        return false
    }

    return accountInstance.profile.role === requiredRole
}