'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { getNavForRole, roleLabels } from '@/lib/nav-config'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

interface SidebarProps {
  role: Role
  tenantName?: string
  tenantLogoUrl?: string
  activePath: string
}

function BrandBlock({
  role,
  tenantName,
  tenantLogoUrl,
}: Pick<SidebarProps, 'role' | 'tenantName' | 'tenantLogoUrl'>) {
  const isSuperAdmin = role === 'super_admin'
  const displayName = isSuperAdmin ? 'ClinicOS' : tenantName ?? 'Clinic'
  const initial = displayName[0]?.toUpperCase() ?? 'C'

  return (
    <div className="flex items-center gap-3 px-5 py-5">
      {tenantLogoUrl && !isSuperAdmin ? (
        <img
          src={tenantLogoUrl}
          alt={displayName}
          className="h-9 w-9 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
          {isSuperAdmin ? 'C' : initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold text-ink">
          {displayName}
        </p>
        <p className="text-[11px] text-ink-faint">{roleLabels[role]}</p>
      </div>
    </div>
  )
}

export function SidebarContent({ role, tenantName, tenantLogoUrl, activePath }: SidebarProps) {
  const items = getNavForRole(role)

  return (
    <div className="flex h-full flex-col bg-white">
      <BrandBlock
        role={role}
        tenantName={tenantName}
        tenantLogoUrl={tenantLogoUrl}
      />

      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const active = activePath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-tint text-brand-deep'
                  : 'text-ink-soft hover:bg-line-soft hover:text-ink'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-deep" />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-line-soft px-3 py-3">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-faint transition-colors hover:bg-line-soft hover:text-ink"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </Link>
      </div>
    </div>
  )
}
