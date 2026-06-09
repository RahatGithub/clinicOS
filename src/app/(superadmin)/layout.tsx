'use client'

import { useRouter } from 'next/navigation'
import { RouteGuard, AppShell } from '@/components/shared'
import { useAuth } from '@/lib/auth-context'

export default function SuperAdminLayout({
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
    <RouteGuard allowedRoles={['super_admin']}>
      <AppShell
        role="super_admin"
        userName={user?.name ?? ''}
        tenantName="ClinicOS Platform"
        onLogout={handleLogout}
      >
        {children}
      </AppShell>
    </RouteGuard>
  )
}
