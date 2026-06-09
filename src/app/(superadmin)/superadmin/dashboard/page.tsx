'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  CreditCard,
  Users,
  UserMinus,
  Download,
  Activity,
  Server,
  Zap,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import {
  PageHeader,
  StatCard,
  SectionCard,
  DataTable,
  StatusBadge,
} from '@/components/shared'
import type { DataTableColumn } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { tenants, plans } from '@/lib/data'
import { formatDate, formatCurrency } from '@/lib/utils'

// ── Computed stats from mock data ──
const planPrices: Record<string, number> = {
  basic: 49,
  professional: 149,
  enterprise: 399,
}

const activeTenants = tenants.filter((t) => t.status === 'active')
const mrr = activeTenants.reduce(
  (sum, t) => sum + (planPrices[t.plan] ?? 0),
  0
)
const totalUsers = tenants.reduce((sum, t) => sum + t.userCount, 0)

const planCounts = [
  {
    name: 'Basic',
    value: tenants.filter((t) => t.plan === 'basic').length,
    color: '#FCC23A',
  },
  {
    name: 'Professional',
    value: tenants.filter((t) => t.plan === 'professional').length,
    color: '#F08A1D',
  },
  {
    name: 'Enterprise',
    value: tenants.filter((t) => t.plan === 'enterprise').length,
    color: '#D9700C',
  },
]

// ── Revenue trend (12 months, believable upward) ──
const revenueData = [
  { month: 'Jul', mrr: 448 },
  { month: 'Aug', mrr: 498 },
  { month: 'Sep', mrr: 547 },
  { month: 'Oct', mrr: 596 },
  { month: 'Nov', mrr: 695 },
  { month: 'Dec', mrr: 744 },
  { month: 'Jan', mrr: 893 },
  { month: 'Feb', mrr: 893 },
  { month: 'Mar', mrr: 1042 },
  { month: 'Apr', mrr: 1042 },
  { month: 'May', mrr: 1094 },
  { month: 'Jun', mrr },
]

// ── Tenant growth (12 months) ──
const growthData = [
  { month: 'Jul', tenants: 0 },
  { month: 'Aug', tenants: 1 },
  { month: 'Sep', tenants: 1 },
  { month: 'Oct', tenants: 0 },
  { month: 'Nov', tenants: 1 },
  { month: 'Dec', tenants: 0 },
  { month: 'Jan', tenants: 1 },
  { month: 'Feb', tenants: 1 },
  { month: 'Mar', tenants: 1 },
  { month: 'Apr', tenants: 0 },
  { month: 'May', tenants: 1 },
  { month: 'Jun', tenants: 1 },
]

// ── Platform health items ──
const healthItems = [
  { label: 'Uptime', value: '99.9%', status: 'active', icon: Server },
  { label: 'Active sessions', value: '47', status: 'active', icon: Activity },
  { label: 'API response', value: '42 ms', status: 'active', icon: Zap },
  { label: 'Open incidents', value: '0', status: 'active', icon: AlertCircle },
]

// ── Tenants table ──
interface TenantRow {
  id: string
  name: string
  adminName: string
  plan: string
  country: string
  registeredDate: string
  userCount: number
  status: string
  [key: string]: unknown
}

const tenantRows: TenantRow[] = tenants
  .slice()
  .sort(
    (a, b) =>
      new Date(b.registeredDate).getTime() -
      new Date(a.registeredDate).getTime()
  )
  .map((t) => ({
    id: t.id,
    name: t.name,
    adminName: t.adminName,
    plan: t.plan,
    country: t.address.country,
    registeredDate: t.registeredDate,
    userCount: t.userCount,
    status: t.status,
  }))

const tenantColumns: DataTableColumn<TenantRow>[] = [
  { key: 'name', header: 'Center', sortable: true },
  { key: 'adminName', header: 'Admin', sortable: true },
  {
    key: 'plan',
    header: 'Plan',
    sortable: true,
    render: (row) => (
      <span className="capitalize text-sm font-medium">{row.plan}</span>
    ),
  },
  { key: 'country', header: 'Country', sortable: true },
  {
    key: 'registeredDate',
    header: 'Registered',
    sortable: true,
    render: (row) => (
      <span className="text-ink-soft">{formatDate(row.registeredDate)}</span>
    ),
  },
  { key: 'userCount', header: 'Users', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
]

// ── Animation ──
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
}

// ── Custom tooltip ──
function ChartTooltipBox({
  active,
  payload,
  label,
  prefix = '',
}: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string
  prefix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-ink">{label}</p>
      <p className="text-ink-soft">
        {prefix}
        {payload[0].value?.toLocaleString()}
      </p>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const sortedTenants = useMemo(() => tenantRows, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Platform overview"
        description="Monitor tenants, revenue, and platform health across all clinics."
        actions={
          <Button
            variant="outline"
            onClick={() => toast.info('Export coming soon')}
          >
            <Download className="h-4 w-4" data-icon="inline-start" />
            Export report
          </Button>
        }
      />

      {/* Stat cards */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Total Tenants"
          value={tenants.length}
          icon={Building2}
          trend={{ value: '+2 this month', direction: 'up' }}
          accent
        />
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(mrr, 'USD')}
          icon={CreditCard}
          trend={{ value: '+8.3% vs last month', direction: 'up' }}
        />
        <StatCard
          label="Active Users"
          value={totalUsers}
          icon={Users}
          trend={{ value: '+14 this month', direction: 'up' }}
        />
        <StatCard
          label="Churned This Month"
          value={1}
          icon={UserMinus}
          trend={{ value: '1 suspended', direction: 'down' }}
        />
      </motion.div>

      {/* Charts row */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <SectionCard title="Recurring Revenue" description="Monthly MRR trend (USD)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F08A1D" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F08A1D" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EDE6E0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#938880' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#938880' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltipBox prefix="$" />}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#F08A1D"
                  strokeWidth={2}
                  fill="url(#mrrGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Tenant Growth" description="New tenants per month">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={growthData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EDE6E0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#938880' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#938880' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip
                  content={<ChartTooltipBox />}
                />
                <Bar dataKey="tenants" radius={[4, 4, 0, 0]}>
                  {growthData.map((_, i) => (
                    <Cell key={i} fill={i === growthData.length - 1 ? '#F2700F' : '#F08A1D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </motion.div>

      {/* Plan distribution + Health row */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <SectionCard title="Plans" description="Tenant distribution by plan">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {planCounts.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { name: string; value: number }
                      return (
                        <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-medium text-ink">{d.name}</p>
                          <p className="text-ink-soft">{d.value} tenants</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {planCounts.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-sm text-ink">{p.name}</span>
                  <span className="ml-auto text-sm font-semibold text-ink">
                    {p.value}
                  </span>
                </div>
              ))}
              <div className="border-t border-line-soft pt-2">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3" />
                  <span className="text-sm font-medium text-ink-soft">Total</span>
                  <span className="ml-auto text-sm font-semibold text-ink">
                    {tenants.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Platform Health" description="System status overview">
          <div className="space-y-4">
            {healthItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-line-soft">
                    <item.icon className="h-4 w-4 text-ink-faint" />
                  </div>
                  <span className="text-sm text-ink">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">
                    {item.value}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </motion.div>

      {/* Tenants table */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <SectionCard
          title="Recently Registered Tenants"
          description="All clinics on the platform"
          noPadding
        >
          <div className="p-1">
            <DataTable
              columns={tenantColumns}
              data={sortedTenants}
              searchable
              searchKeys={['name', 'adminName']}
              pageSize={8}
              onRowClick={() =>
                toast.info('Tenant detail coming soon', {
                  description: 'Full tenant management is in the next prompt.',
                })
              }
            />
          </div>
        </SectionCard>
      </motion.div>
    </div>
  )
}
