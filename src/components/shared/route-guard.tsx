'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Role } from '@/types'

interface RouteGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
}

export function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
    } else if (!allowedRoles.includes(user.role)) {
      router.replace('/unauthorized')
    }
  }, [user, isLoading, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    )
  }

  return <>{children}</>
}
