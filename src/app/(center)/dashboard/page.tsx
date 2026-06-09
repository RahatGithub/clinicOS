import { Users, CalendarDays, UserRound } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/shared'

export default function CenterAdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Dashboard"
        description="Overview of Northgate Diagnostic Center."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Staff"
          value={13}
          icon={Users}
          accent
        />
        <StatCard
          label="Today's Appointments"
          value={14}
          icon={CalendarDays}
          trend={{ value: '+3 from yesterday', direction: 'up' }}
        />
        <StatCard
          label="Registered Patients"
          value={25}
          icon={UserRound}
          trend={{ value: '+5 this month', direction: 'up' }}
        />
      </div>
      <p className="text-sm text-ink-faint">Dashboard content coming soon.</p>
    </div>
  )
}
