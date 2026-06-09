import { Building2, CreditCard, Users } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/shared'

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Manage tenants, plans, and platform billing."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active Tenants"
          value={6}
          icon={Building2}
          trend={{ value: '+2 this quarter', direction: 'up' }}
          accent
        />
        <StatCard
          label="Total Users"
          value={165}
          icon={Users}
          trend={{ value: '+18%', direction: 'up' }}
        />
        <StatCard
          label="Monthly Revenue"
          value="$2,834"
          icon={CreditCard}
          trend={{ value: '+8%', direction: 'up' }}
        />
      </div>
      <p className="text-sm text-ink-faint">Dashboard content coming soon.</p>
    </div>
  )
}
