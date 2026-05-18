import { useEffect, useState } from 'react'
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
        await supabase.auth.signOut()
        clearAuth()
    }

    useEffect(() => {
        let isMounted = true

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null

                if (!isMounted) return
                setUser(currentUser)

                if (currentUser) {
                    const profileData = await fetchProfile(currentUser.id)
                    if (isMounted) setProfile(profileData)
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
    }, [setUser, setProfile])

    return {
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile,
    }
}