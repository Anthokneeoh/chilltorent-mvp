'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || profile?.role !== 'admin')) {
      router.push('/login')
    }
  }, [isLoading, user, profile, router])

  if (isLoading) return null

  return <>{children}</>
}
