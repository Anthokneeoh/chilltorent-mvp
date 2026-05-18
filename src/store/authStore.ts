import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
    user: User | null
    profile: Profile | null
    isLoading: boolean
    setUser: (user: User | null) => void
    setProfile: (profile: Profile | null) => void
    setLoading: (isLoading: boolean) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            profile: null,
            isLoading: true,
            setUser: (user) => set({ user }),
            setProfile: (profile) => set({ profile }),
            setLoading: (isLoading) => set({ isLoading }),
            clearAuth: () => set({ user: null, profile: null, isLoading: false }),
        }),
        {
            name: 'chilltorent-auth',
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
            }),
        }
    )
)