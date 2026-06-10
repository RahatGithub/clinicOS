'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ScrollText,
  Activity,
  CalendarCheck,
  FileText,
  UserPlus,
  UserMinus,
  Settings,
  LogIn,
  CreditCard,
  Download,
  Search,
  Award,
  Zap,
} from 'lucide-react'
import {
  PageHeader,
  StatCard,
  EmptyState,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { activityLogs } from '@/lib/data'
import { formatDateTime, cn } from '@/lib/utils'
import type { ActivityLog } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const WEEK_START = '2026-06-04'
const PAGE_SIZE = 15

type DateScope = 'today' | 'week' | 'all'

const ACTION_TYPE_META: Record<
  string,
  { label: string; icon: typeof Activity; bg: string; text: string }
> = {
  metric: {
    label: 'Health metrics',
    icon: Activity,
    bg: 'bg-brand/10',
    text: 'text-brand-deep',
  },
  appointment: {
    label: 'Appointments',
    icon: CalendarCheck,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  prescription: {
    label: 'Prescriptions',
    icon: FileText,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  patient: {
    label: 'Patients',
    icon: UserPlus,
    bg: 'bg-teal-50',
    text: 'text-teal-600',
  },
  staff: {
    label: 'Staff',
    icon: UserMinus,
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
  auth: {
    label: 'Authentication',
    icon: LogIn,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  },
  billing: {
    label: 'Billing',
    icon: CreditCard,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  center_admin: 'Center Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
}

// ── Animation ──

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Helpers ──

function timeAgo(iso: string): string {
  const now = new Date(`${TODAY}T09:30:00Z`)
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d ago`
}

function dayLabel(dateStr: string): string {
  if (dateStr === TODAY) return `Today \u2014 ${formatDayHeader(dateStr)}`
  const ref = new Date(TODAY)
  const d = new Date(dateStr)
  const diff = Math.round((ref.getTime() - d.getTime()) / 86_400_000)
  if (diff === 1) return `Yesterday \u2014 ${formatDayHeader(dateStr)}`
  return formatDayHeader(dateStr)
}

function formatDayHeader(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function exportCSV(data: ActivityLog[]) {
  const headers = ['ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Type', 'Patient', 'Old Value', 'New Value']
  const rows = data.map((l) => [
    l.id,
    formatDateTime(l.timestamp),
    `${l.actorName} (${l.actorId})`,
    l.actorRole,
    l.action,
    l.actionType,
    l.patientName ?? '',
    l.oldValue ?? '',
    l.newValue ?? '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'activity-logs.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ──

export default function ActivityLogsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [dateScope, setDateScope] = useState<DateScope>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // ── Unique actors for the filter dropdown ──

  const actors = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of activityLogs) map.set(l.actorId, l.actorName)
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [])

  // ── Stats ──

  const todayLogs = useMemo(
    () => activityLogs.filter((l) => l.timestamp.startsWith(TODAY)),
    []
  )

  const mostActiveStaff = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>()
    for (const l of todayLogs) {
      const entry = counts.get(l.actorId) ?? { name: l.actorName, count: 0 }
      entry.count++
      counts.set(l.actorId, entry)
    }
    let best = { name: '\u2014', count: 0 }
    for (const v of counts.values()) {
      if (v.count > best.count) best = v
    }
    return best
  }, [todayLogs])

  const metricCount = useMemo(
    () => activityLogs.filter((l) => l.actionType === 'metric').length,
    []
  )

  const loginsToday = useMemo(
    () => todayLogs.filter((l) => l.actionType === 'auth').length,
    []
  )

  // ── Filtered & grouped ──

  const filtered = useMemo(() => {
    let list = [...activityLogs]

    if (dateScope === 'today') {
      list = list.filter((l) => l.timestamp.startsWith(TODAY))
    } else if (dateScope === 'week') {
      list = list.filter((l) => l.timestamp >= WEEK_START)
    }

    if (typeFilter) {
      list = list.filter((l) => l.actionType === typeFilter)
    }
    if (actorFilter) {
      list = list.filter((l) => l.actorId === actorFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.patientName && l.patientName.toLowerCase().includes(q))
      )
    }

    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [search, typeFilter, actorFilter, dateScope])

  const visible = filtered.slice(0, visibleCount)

  const grouped = useMemo(() => {
    const groups: { date: string; label: string; entries: ActivityLog[] }[] = []
    let currentDate = ''
    for (const entry of visible) {
      const date = entry.timestamp.slice(0, 10)
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, label: dayLabel(date), entries: [] })
      }
      groups[groups.length - 1].entries.push(entry)
    }
    return groups
  }, [visible])

  // ── Render ──

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Activity Logs"
          description="A complete record of everything happening across your center."
          actions={
            <Button variant="outline" onClick={() => exportCSV(filtered)}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          }
        />
      </motion.div>

      {/* Stat row */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={fadeUp}>
          <StatCard
            label="Events Today"
            value={todayLogs.length}
            icon={ScrollText}
            accent
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Most Active"
            value={`${mostActiveStaff.name.replace(/^Dr\.\s*/, '')} (${mostActiveStaff.count})`}
            icon={Award}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Metric Updates"
            value={metricCount}
            icon={Zap}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Logins Today"
            value={loginsToday}
            icon={LogIn}
          />
        </motion.div>
      </motion.div>

      {/* Filters bar */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Search actor, action, patient\u2026"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
              className="pl-8"
            />
          </div>
          <Select
            className="w-auto min-w-[150px]"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          >
            <option value="">All types</option>
            {Object.entries(ACTION_TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
          <Select
            className="w-auto min-w-[160px]"
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          >
            <option value="">All staff</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select
            className="w-auto min-w-[120px]"
            value={dateScope}
            onChange={(e) => { setDateScope(e.target.value as DateScope); setVisibleCount(PAGE_SIZE) }}
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="all">All</option>
          </Select>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeUp}>
        {grouped.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No matching logs"
            description="Try adjusting your filters or search query."
          />
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.date}>
                {/* Day header */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-line-soft" />
                  <span className="text-xs text-ink-faint">
                    {group.entries.length} event{group.entries.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-1">
                  {group.entries.map((log) => (
                    <LogEntry key={log.id} log={log} />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {visibleCount < filtered.length && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Log entry row ──

function LogEntry({ log }: { log: ActivityLog }) {
  const meta = ACTION_TYPE_META[log.actionType] ?? ACTION_TYPE_META.settings
  const Icon = meta.icon

  return (
    <div className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-line-soft/40">
      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          meta.bg
        )}
      >
        <Icon className={cn('h-4 w-4', meta.text)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-ink">
          <span className="font-semibold">{log.actorName}</span>{' '}
          <span className="text-ink-faint">
            ({ROLE_LABELS[log.actorRole] ?? log.actorRole})
          </span>{' '}
          <span className="text-ink-soft">{log.action}</span>
        </p>

        {/* Old → New value change */}
        {(log.oldValue || log.newValue) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {log.oldValue && (
              <span className="inline-flex rounded-md bg-danger/8 px-2 py-0.5 text-xs text-ink-faint line-through">
                {log.oldValue}
              </span>
            )}
            {log.oldValue && log.newValue && (
              <span className="text-xs text-ink-faint">&rarr;</span>
            )}
            {log.newValue && (
              <span className="inline-flex rounded-md bg-ok/8 px-2 py-0.5 text-xs font-medium text-ink">
                {log.newValue}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Timestamp — right side on desktop, below on mobile */}
      <div className="hidden shrink-0 text-right sm:block">
        <span
          className="text-xs text-ink-faint"
          title={formatDateTime(log.timestamp)}
        >
          {timeAgo(log.timestamp)}
        </span>
      </div>
      {/* Mobile timestamp shown inline via the action type badge area */}
      <div className="mt-0.5 shrink-0 sm:hidden">
        <span className="text-[11px] text-ink-faint">{timeAgo(log.timestamp)}</span>
      </div>
    </div>
  )
}
