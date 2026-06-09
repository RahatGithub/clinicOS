'use client'

import { useRouter } from 'next/navigation'
import { RouteGuard, AppShell } from '@/components/shared'
import { useAuth } from '@/lib/auth-context'

export default function NurseLayout({
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
    <RouteGuard allowedRoles={['nurse']}>
      <AppShell
        role="nurse"
        userName={user?.name ?? ''}
        tenantName="Northgate Diagnostic Center"
        onLogout={handleLogout}
      >
        {children}
      </AppShell>
    </RouteGuard>
  )
}
