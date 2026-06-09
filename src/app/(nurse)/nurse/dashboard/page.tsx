import { ListChecks, Activity, Users } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/shared'

export default function NurseDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nurse Dashboard"
        description="Patient queue and vitals entry."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Patients in Queue"
          value={4}
          icon={ListChecks}
          accent
        />
        <StatCard
          label="Vitals Recorded Today"
          value={9}
          icon={Activity}
          trend={{ value: '+3', direction: 'up' }}
        />
        <StatCard
          label="Assigned Doctor's Patients"
          value={8}
          icon={Users}
        />
      </div>
      <p className="text-sm text-ink-faint">Dashboard content coming soon.</p>
    </div>
  )
}
