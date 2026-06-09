'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar'
import { Topbar } from './topbar'
import type { Role } from '@/types'

interface AppShellProps {
  role: Role
  userName: string
  userAvatarUrl?: string
  tenantName?: string
  tenantLogoUrl?: string
  children: React.ReactNode
}

export function AppShell({
  role,
  userName,
  userAvatarUrl,
  tenantName,
  tenantLogoUrl,
  children,
}: AppShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line md:block">
        <SidebarContent
          role={role}
          tenantName={tenantName}
          tenantLogoUrl={tenantLogoUrl}
          activePath={pathname}
        />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 p-0"
        >
          <SidebarContent
            role={role}
            tenantName={tenantName}
            tenantLogoUrl={tenantLogoUrl}
            activePath={pathname}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={userName}
          userRole={role}
          userAvatarUrl={userAvatarUrl}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-canvas">
          <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
