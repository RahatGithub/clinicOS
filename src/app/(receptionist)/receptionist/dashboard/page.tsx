import { CalendarDays, UserRound, Clock } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/shared'

export default function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Front Desk"
        description="Appointments and patient check-in."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Today's Appointments"
          value={14}
          icon={CalendarDays}
          accent
        />
        <StatCard
          label="Checked In"
          value={5}
          icon={UserRound}
          trend={{ value: '3 waiting', direction: 'neutral' }}
        />
        <StatCard
          label="Upcoming (Next Hour)"
          value={3}
          icon={Clock}
        />
      </div>
      <p className="text-sm text-ink-faint">Dashboard content coming soon.</p>
    </div>
  )
}
