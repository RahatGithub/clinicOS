'use client'

import { useRouter } from 'next/navigation'
import { RouteGuard, AppShell } from '@/components/shared'
import { useAuth } from '@/lib/auth-context'

export default function CenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <RouteGuard allowedRoles={['center_admin']}>
      <AppShell
        role="center_admin"
        userName={user?.name ?? ''}
        tenantName="Northgate Diagnostic Center"
        onLogout={handleLogout}
      >
        {children}
      </AppShell>
    </RouteGuard>
  )
}
