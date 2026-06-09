import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  Settings,
  Users,
  UserRound,
  CalendarDays,
  ScrollText,
  FileText,
  ListChecks,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navByRole: Record<Role, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
    { label: 'Tenants', href: '/superadmin/tenants', icon: Building2 },
    { label: 'Plans & Pricing', href: '/superadmin/plans', icon: CreditCard },
    { label: 'Billing', href: '/superadmin/billing', icon: Receipt },
    { label: 'Settings', href: '/superadmin/settings', icon: Settings },
  ],
  center_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Staff', href: '/dashboard/staff', icon: Users },
    { label: 'Patients', href: '/dashboard/patients', icon: UserRound },
    { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
    { label: 'Activity Logs', href: '/dashboard/logs', icon: ScrollText },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Schedule', href: '/doctor/schedule', icon: CalendarDays },
    { label: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
    { label: 'Profile', href: '/doctor/profile', icon: UserRound },
  ],
  nurse: [
    { label: 'Dashboard', href: '/nurse/dashboard', icon: LayoutDashboard },
    { label: 'Patient Queue', href: '/nurse/queue', icon: ListChecks },
    { label: 'Profile', href: '/nurse/profile', icon: UserRound },
  ],
  receptionist: [
    { label: 'Dashboard', href: '/receptionist/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', href: '/receptionist/appointments', icon: CalendarDays },
    { label: 'Profile', href: '/receptionist/profile', icon: UserRound },
  ],
}

export function getNavForRole(role: Role): NavItem[] {
  return navByRole[role]
}

export const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  center_admin: 'Center Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
}

export function roleHomePath(role: Role): string {
  return navByRole[role][0].href
}
