import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UseAuthReturn {
    user: User | null
    profile: Profile | null
    isLoading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
    const router = useRouter()
    const { user, profile, setUser, setProfile, clearAuth } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            return data as Profile
        } catch (error) {
            console.error('Client hook failed to retrieve profile:', error)
            return null
        }
    }

    const refreshProfile = async () => {
        if (!user) return
        const freshProfile = await fetchProfile(user.id)
        if (freshProfile) {
            setProfile(freshProfile)
        }
    }

    const signOut = async () => {
        try {
            const signOutPromise = supabase.auth.signOut()
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sign out request timed out')), 1500)
            )
            await Promise.race([signOutPromise, timeoutPromise]).catch(err => {
                console.warn('Sign out request timed out, forcing local state termination:', err)
            })
        } catch (err) {
            console.error('Sign out request exception:', err)
        } finally {
            clearAuth()
            if (typeof window !== 'undefined') {
                localStorage.clear()
                sessionStorage.clear()
            }
            useAuthStore.getState().setUser(null)
            useAuthStore.getState().setProfile(null)
            router.push('/login')
        }
    }

    useEffect(() => {
        let isMounted = true

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const currentUser = session?.user ?? null

                if (!isMounted) return
                setUser(currentUser)

                if (currentUser) {
                    const profileData = await fetchProfile(currentUser.id)
                    if (isMounted) setProfile(profileData)

                    if (typeof window !== 'undefined') {
                        const path = window.location.pathname
                        if (path === '/' || path === '/login' || path === '/signup') {
                            const role = profileData?.role || 'tenant'
                            if (role === 'admin') router.push('/admin')
                            else if (role === 'landlord') router.push('/landlord')
                            else router.push('/tenant')
                        }
                    }
                } else {
                    setProfile(null)
                }
            } catch (err) {
                console.error('Failed to initialize session:', err)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setProfile(null)
                    if (isMounted) setIsLoading(false)
                    if (typeof window !== 'undefined') {
                        router.push('/login')
                    }
                    return
                }

                const currentUser = session?.user ?? null

                if (!isMounted) return
                setUser(currentUser)

                if (currentUser) {
                    const profileData = await fetchProfile(currentUser.id)
                    if (isMounted) setProfile(profileData)

                    if (typeof window !== 'undefined') {
                        const path = window.location.pathname
                        if (path === '/' || path === '/login' || path === '/signup') {
                            const role = profileData?.role || 'tenant'
                            if (role === 'admin') router.push('/admin')
                            else if (role === 'landlord') router.push('/landlord')
                            else router.push('/tenant')
                        }
                    }
                } else {
                    setProfile(null)
                }

                if (isMounted) setIsLoading(false)
            }
        )

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [setUser, setProfile, router])

    return {
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile,
    }
}