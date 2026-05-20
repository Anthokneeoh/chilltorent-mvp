'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TenantAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, profile, router])

  if (isLoading) return null
  if (!user) return null
  return <>{children}</>
}
