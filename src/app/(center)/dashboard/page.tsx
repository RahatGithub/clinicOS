'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  UserRound,
  Users,
  DollarSign,
  CalendarCheck,
  Stethoscope,
  FileText,
  Activity,
  UserPlus,
  Settings,
  LogIn,
  CreditCard,
  UserMinus,
  Clock,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { appointments, patients, staff, activityLogs } from '@/lib/data'
import { formatDate, formatCurrency } from '@/lib/utils'
import { StatCard, SectionCard, StatusBadge, UserAvatar } from '@/components/shared'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ActivityLog } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEK_DATES = [
  '2026-06-04', '2026-06-05', '2026-06-06',
  '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10',
]

const STATUS_COLORS: Record<string, string> = {
  completed: '#1D9E75',
  confirmed: '#2563EB',
  in_progress: '#F08A1D',
  pending: '#BA7517',
  cancelled: '#E5484D',
}

const actionTypeIcons: Record<string, typeof CalendarCheck> = {
  appointment: CalendarCheck,
  metric: Activity,
  prescription: FileText,
  patient: UserPlus,
  staff: UserMinus,
  settings: Settings,
  auth: LogIn,
  billing: CreditCard,
}

// ── Animation variants ──

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ── Helper: time-ago for activity feed ──

function timeAgo(isoDate: string): string {
  const now = new Date(`${TODAY}T09:30:00Z`)
  const then = new Date(isoDate)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d ago`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getGreeting(): string {
  return 'Good morning'
}

// ── Component ──

export default function CenterAdminDashboard() {
  const { user } = useAuth()
  const adminName = user?.name ?? 'Admin'

  // ── Derived data ──

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.dateTime.startsWith(TODAY))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    []
  )

  const activeStaff = useMemo(
    () => staff.filter((s) => s.status === 'active'),
    []
  )

  const weeklyData = useMemo(() => {
    return WEEK_DATES.map((date, i) => ({
      day: WEEK_DAYS[i],
      appointments: appointments.filter((a) => a.dateTime.startsWith(date)).length,
    }))
  }, [])

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of todayAppointments) {
      counts[a.status] = (counts[a.status] ?? 0) + 1
    }
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      value: count,
      status,
    }))
  }, [todayAppointments])

  const recentLogs = useMemo(
    () =>
      [...activityLogs]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 8),
    []
  )

  const onlineStaff = useMemo(
    () => activeStaff.slice(0, 9),
    [activeStaff]
  )

  const displayedAppointments = todayAppointments.slice(0, 8)

  // ── Chart configs ──

  const weeklyChartConfig: ChartConfig = {
    appointments: {
      label: 'Appointments',
      color: '#F08A1D',
    },
  }

  const statusChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    for (const item of statusBreakdown) {
      config[item.status] = {
        label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        color: STATUS_COLORS[item.status] ?? '#938880',
      }
    }
    return config
  }, [statusBreakdown])

  // ── Render ──

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* ── TASK 1: Branded cover banner ── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-xl bg-brand-gradient"
        style={{ minHeight: 130 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="relative flex items-center gap-4 px-6 py-7 sm:px-8 sm:py-8">
          {/* Logo initial */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold text-white backdrop-blur-sm sm:h-16 sm:w-16 sm:text-3xl">
            N
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold text-white sm:text-2xl">
              Northgate Diagnostic Center
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {formatDate(`${TODAY}T00:00:00Z`)} &middot; {getGreeting()}, {adminName.replace(/^Dr\.\s*/, '')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── TASK 3: Stat cards ── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            label="Appointments Today"
            value={todayAppointments.length}
            icon={CalendarDays}
            accent
            trend={{ value: '+3 from yesterday', direction: 'up' }}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Total Patients"
            value={patients.length}
            icon={UserRound}
            trend={{ value: '+5 this month', direction: 'up' }}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Active Staff"
            value={`${staff.length} · ${activeStaff.length} online`}
            icon={Users}
            trend={{ value: '1 on leave', direction: 'neutral' }}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Revenue This Month"
            value={formatCurrency(48750, 'USD')}
            icon={DollarSign}
            trend={{ value: '+12% vs last month', direction: 'up' }}
          />
        </motion.div>
      </motion.div>

      {/* ── TASK 4: Charts row ── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {/* Bar chart — Appointments this week */}
        <motion.div variants={fadeUp}>
          <SectionCard title="Appointments this week">
            <ChartContainer config={weeklyChartConfig} className="h-[250px] w-full">
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#EDE6E0" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#938880' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#938880' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="appointments"
                  fill="var(--color-appointments)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </SectionCard>
        </motion.div>

        {/* Donut chart — Appointment status */}
        <motion.div variants={fadeUp}>
          <SectionCard title="Appointment status">
            <ChartContainer config={statusChartConfig} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {statusBreakdown.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? '#938880'}
                    />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </SectionCard>
        </motion.div>
      </motion.div>

      {/* ── TASK 5: Lower row — Today's appointments + Recent activity ── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {/* Today's appointments table */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="Today's appointments"
            actions={
              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-xs text-brand">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-line-soft bg-line-soft/50 hover:bg-line-soft/50">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                      Time
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                      Patient
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint hidden sm:table-cell">
                      Doctor
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedAppointments.map((apt) => (
                    <TableRow
                      key={apt.id}
                      className="cursor-pointer border-line-soft"
                      onClick={() =>
                        toast.info(`${apt.patientName} — ${apt.reason}`, {
                          description: `${formatTime(apt.dateTime)} with ${apt.doctorName}`,
                        })
                      }
                    >
                      <TableCell className="whitespace-nowrap text-sm font-medium text-ink">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-ink-faint" />
                          {formatTime(apt.dateTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar name={apt.patientName} size="sm" />
                          <span className="text-sm text-ink">{apt.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-ink-soft sm:table-cell">
                        {apt.doctorName}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={apt.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {todayAppointments.length > 8 && (
              <div className="border-t border-line-soft px-5 py-2.5 text-center">
                <Link
                  href="/dashboard/appointments"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  +{todayAppointments.length - 8} more appointments
                </Link>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Recent activity feed */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="Recent activity"
            actions={
              <Link href="/dashboard/activity-logs">
                <Button variant="ghost" size="sm" className="text-xs text-brand">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            }
            noPadding
          >
            <div className="divide-y divide-line-soft">
              {recentLogs.map((log: ActivityLog) => {
                const Icon = actionTypeIcons[log.actionType] ?? Activity
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint">
                      <Icon className="h-3.5 w-3.5 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">
                        <span className="font-medium">{log.actorName}</span>{' '}
                        <span className="text-ink-soft">
                          {log.action.replace(log.actorName, '').replace(/^\s*/, '')}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {timeAgo(log.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </motion.div>
      </motion.div>

      {/* ── TASK 6: Staff online strip ── */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Staff online">
          <div className="flex flex-wrap items-center gap-4">
            {onlineStaff.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="relative">
                  <UserAvatar name={s.name} size="sm" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ok" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-ink leading-tight">
                    {s.name.replace(/^Dr\.\s*/, '')}
                  </p>
                  <p className="text-[10px] capitalize text-ink-faint leading-tight">
                    {s.role}
                  </p>
                </div>
              </div>
            ))}
            {onlineStaff.length > 6 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-line-soft text-[10px] font-semibold text-ink-soft">
                +{onlineStaff.length - 6}
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}
