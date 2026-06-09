import { CalendarDays, FileText, Users } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/shared'

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="Your schedule, patients, and prescriptions at a glance."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Today's Appointments"
          value={6}
          icon={CalendarDays}
          accent
        />
        <StatCard
          label="Assigned Patients"
          value={8}
          icon={Users}
        />
        <StatCard
          label="Prescriptions This Week"
          value={12}
          icon={FileText}
          trend={{ value: '+4', direction: 'up' }}
        />
      </div>
      <p className="text-sm text-ink-faint">Dashboard content coming soon.</p>
    </div>
  )
}
