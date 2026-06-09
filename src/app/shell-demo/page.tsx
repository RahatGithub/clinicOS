'use client'

import { useState } from 'react'
import { Users, Calendar, Stethoscope, Activity } from 'lucide-react'
import { AppShell, PageHeader, StatCard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types'

const roles: { role: Role; label: string }[] = [
  { role: 'super_admin', label: 'Super Admin' },
  { role: 'center_admin', label: 'Center Admin' },
  { role: 'doctor', label: 'Doctor' },
  { role: 'nurse', label: 'Nurse' },
  { role: 'receptionist', label: 'Receptionist' },
]

const userNames: Record<Role, string> = {
  super_admin: 'Arjun Kapoor',
  center_admin: 'Dr. Helen Mirowski',
  doctor: 'Dr. Kwame Mensah',
  nurse: 'Ruby Classius',
  receptionist: 'Marcus Webb',
}

export default function ShellDemo() {
  const [activeRole, setActiveRole] = useState<Role>('center_admin')

  return (
    <div className="flex h-screen flex-col">
      {/* Role switcher bar */}
      <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint mr-2">
          Preview as:
        </span>
        {roles.map(({ role, label }) => (
          <Button
            key={role}
            size="sm"
            variant={activeRole === role ? 'default' : 'outline'}
            className={
              activeRole === role
                ? 'bg-brand-gradient text-white border-none'
                : undefined
            }
            onClick={() => setActiveRole(role)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Shell preview */}
      <div className="flex-1 overflow-hidden">
        <AppShell
          key={activeRole}
          role={activeRole}
          userName={userNames[activeRole]}
          tenantName={
            activeRole === 'super_admin'
              ? undefined
              : 'Northgate Diagnostic Center'
          }
          onLogout={() => console.log('Logout from shell demo')}
        >
          <div className="space-y-6">
            <PageHeader
              title={`${userNames[activeRole]}'s Dashboard`}
              description={`Viewing as ${roles.find((r) => r.role === activeRole)?.label}. This is placeholder content inside the app shell.`}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Patients"
                value={25}
                icon={Users}
                trend={{ value: '+12%', direction: 'up' }}
                accent
              />
              <StatCard
                label="Today's Appointments"
                value={14}
                icon={Calendar}
                trend={{ value: '+3', direction: 'up' }}
              />
              <StatCard
                label="Active Staff"
                value={11}
                icon={Stethoscope}
              />
              <StatCard
                label="Pending Reports"
                value={5}
                icon={Activity}
                trend={{ value: '-2', direction: 'down' }}
              />
            </div>
          </div>
        </AppShell>
      </div>
    </div>
  )
}
