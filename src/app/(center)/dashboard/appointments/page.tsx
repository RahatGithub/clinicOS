'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  List,
  CalendarRange,
  Download,
  Clock,
  Info,
} from 'lucide-react'
import {
  PageHeader,
  StatCard,
  SectionCard,
  DataTable,
  StatusBadge,
  UserAvatar,
  SlideOver,
  type DataTableColumn,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { appointments, staff } from '@/lib/data'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import type { Appointment } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const WEEK_START = '2026-06-08'
const WEEK_END = '2026-06-14'
const WEEK_DATES = [
  { date: '2026-06-08', label: 'Mon 8' },
  { date: '2026-06-09', label: 'Tue 9' },
  { date: '2026-06-10', label: 'Wed 10' },
  { date: '2026-06-11', label: 'Thu 11' },
  { date: '2026-06-12', label: 'Fri 12' },
  { date: '2026-06-13', label: 'Sat 13' },
  { date: '2026-06-14', label: 'Sun 14' },
]

const STATUS_COLORS: Record<string, string> = {
  completed: 'border-l-ok bg-ok/5',
  confirmed: 'border-l-blue-500 bg-blue-50',
  in_progress: 'border-l-brand bg-brand/5',
  pending: 'border-l-warn bg-warn/5',
  cancelled: 'border-l-danger bg-danger/5',
}

const doctors = staff.filter((s) => s.role === 'doctor')

type DateScope = 'today' | 'week' | 'all'
type ViewMode = 'list' | 'calendar'

// ── Animation ──

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Helpers ──

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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

function exportCSV(data: Appointment[]) {
  const headers = ['ID', 'Date/Time', 'Patient', 'Doctor', 'Specialty', 'Reason', 'Duration', 'Status']
  const rows = data.map((a) => [
    a.id,
    formatDateTime(a.dateTime),
    a.patientName,
    a.doctorName,
    a.specialty,
    a.reason,
    `${a.durationMin} min`,
    a.status,
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'appointments.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ──

export default function AppointmentsPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [dateScope, setDateScope] = useState<DateScope>('today')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)

  // ── Stats ──

  const todayCount = useMemo(
    () => appointments.filter((a) => a.dateTime.startsWith(TODAY)).length,
    []
  )
  const weekCount = useMemo(
    () => appointments.filter((a) => a.dateTime >= WEEK_START && a.dateTime < `${WEEK_END}T23:59:59Z`).length,
    []
  )
  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === 'completed').length,
    []
  )
  const cancelledCount = useMemo(
    () => appointments.filter((a) => a.status === 'cancelled').length,
    []
  )

  // ── Filtered appointments ──

  const filtered = useMemo(() => {
    let list = [...appointments]

    if (dateScope === 'today') {
      list = list.filter((a) => a.dateTime.startsWith(TODAY))
    } else if (dateScope === 'week') {
      list = list.filter(
        (a) => a.dateTime >= WEEK_START && a.dateTime < `${WEEK_END}T23:59:59Z`
      )
    }

    if (doctorFilter) {
      list = list.filter((a) => a.doctorId === doctorFilter)
    }
    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter)
    }

    return list.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  }, [dateScope, doctorFilter, statusFilter])

  // ── Calendar data ──

  const calendarData = useMemo(() => {
    let base = [...appointments].filter(
      (a) => a.dateTime >= WEEK_START && a.dateTime < `${WEEK_END}T23:59:59Z`
    )
    if (doctorFilter) base = base.filter((a) => a.doctorId === doctorFilter)
    if (statusFilter) base = base.filter((a) => a.status === statusFilter)

    const byDay = new Map<string, Appointment[]>()
    for (const d of WEEK_DATES) byDay.set(d.date, [])
    for (const a of base) {
      const day = a.dateTime.slice(0, 10)
      byDay.get(day)?.push(a)
    }
    for (const [, arr] of byDay) arr.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    return byDay
  }, [doctorFilter, statusFilter])

  // ── Columns ──

  const columns: DataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        key: 'dateTime',
        header: 'Date / Time',
        sortable: true,
        render: (row: Appointment) => (
          <span className="whitespace-nowrap text-sm">{formatDateTime(row.dateTime)}</span>
        ),
      },
      {
        key: 'patientName',
        header: 'Patient',
        sortable: true,
        render: (row: Appointment) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.patientName} size="sm" />
            <span className="font-medium text-ink">{row.patientName}</span>
          </div>
        ),
      },
      {
        key: 'doctorName',
        header: 'Doctor',
        sortable: true,
        className: 'hidden md:table-cell',
      },
      {
        key: 'specialty',
        header: 'Specialty',
        className: 'hidden lg:table-cell',
      },
      {
        key: 'reason',
        header: 'Reason',
        className: 'hidden xl:table-cell max-w-[200px] truncate',
      },
      {
        key: 'durationMin',
        header: 'Dur.',
        className: 'hidden lg:table-cell',
        render: (row: Appointment) => <span>{row.durationMin}m</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: Appointment) => <StatusBadge status={row.status} />,
      },
    ],
    []
  )

  // ── Render ──

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Appointments"
          description="All appointments across your center."
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
          <StatCard label="Today" value={todayCount} icon={CalendarDays} accent />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="This Week" value={weekCount} icon={CalendarCheck} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle2}
            trend={{ value: 'all time', direction: 'neutral' }}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Cancelled" value={cancelledCount} icon={XCircle} />
        </motion.div>
      </motion.div>

      {/* Controls: View toggle + Filters */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-input p-0.5">
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors',
                view === 'list'
                  ? 'bg-brand-gradient text-white'
                  : 'text-ink-soft hover:text-ink'
              )}
              onClick={() => setView('list')}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors',
                view === 'calendar'
                  ? 'bg-brand-gradient text-white'
                  : 'text-ink-soft hover:text-ink'
              )}
              onClick={() => setView('calendar')}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>

          {/* Filters */}
          <Select
            className="w-auto min-w-[120px]"
            value={dateScope}
            onChange={(e) => setDateScope(e.target.value as DateScope)}
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="all">All</option>
          </Select>
          <Select
            className="w-auto min-w-[160px]"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            className="w-auto min-w-[130px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </motion.div>

      {/* List / Calendar view */}
      <motion.div variants={fadeUp}>
        {view === 'list' ? (
          <SectionCard>
            <DataTable
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={filtered as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={['patientName', 'doctorName', 'reason'] as never[]}
              pageSize={10}
              onRowClick={(row) => setSelectedApt(row as unknown as Appointment)}
            />
          </SectionCard>
        ) : (
          <CalendarView
            data={calendarData}
            onSelect={setSelectedApt}
          />
        )}
      </motion.div>

      {/* Appointment detail SlideOver */}
      <SlideOver
        open={selectedApt !== null}
        onOpenChange={(open) => !open && setSelectedApt(null)}
        title="Appointment Details"
        description="Read-only overview"
      >
        {selectedApt && <AppointmentDetail apt={selectedApt} />}
      </SlideOver>
    </motion.div>
  )
}

// ── Calendar view component ──

function CalendarView({
  data,
  onSelect,
}: {
  data: Map<string, Appointment[]>
  onSelect: (apt: Appointment) => void
}) {
  return (
    <>
      {/* Desktop: 7-column grid */}
      <div className="hidden sm:block rounded-lg border border-line bg-white">
        <div className="grid grid-cols-7 border-b border-line-soft">
          {WEEK_DATES.map((d) => (
            <div
              key={d.date}
              className={cn(
                'px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider',
                d.date === TODAY
                  ? 'bg-brand/5 text-brand-deep'
                  : 'text-ink-faint'
              )}
            >
              {d.label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-line-soft" style={{ minHeight: 320 }}>
          {WEEK_DATES.map((d) => {
            const dayApts = data.get(d.date) ?? []
            return (
              <div
                key={d.date}
                className={cn(
                  'p-1.5 space-y-1',
                  d.date === TODAY && 'bg-brand/[0.02]'
                )}
              >
                {dayApts.length === 0 && (
                  <p className="mt-8 text-center text-[10px] text-ink-faint">No appointments</p>
                )}
                {dayApts.map((apt) => (
                  <button
                    key={apt.id}
                    className={cn(
                      'w-full rounded-md border-l-[3px] px-1.5 py-1 text-left transition-colors hover:ring-1 hover:ring-brand/30',
                      STATUS_COLORS[apt.status] ?? 'border-l-ink-faint bg-line-soft/50'
                    )}
                    onClick={() => onSelect(apt)}
                  >
                    <p className="truncate text-[11px] font-medium text-ink">
                      {apt.patientName}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {formatTime(apt.dateTime)} &middot; {apt.durationMin}m
                    </p>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: stacked day list */}
      <div className="space-y-3 sm:hidden">
        {WEEK_DATES.map((d) => {
          const dayApts = data.get(d.date) ?? []
          if (dayApts.length === 0) return null
          return (
            <SectionCard key={d.date} title={d.date === TODAY ? `${d.label} (Today)` : d.label}>
              <div className="space-y-2">
                {dayApts.map((apt) => (
                  <button
                    key={apt.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border-l-[3px] px-3 py-2 text-left',
                      STATUS_COLORS[apt.status] ?? 'border-l-ink-faint bg-line-soft/50'
                    )}
                    onClick={() => onSelect(apt)}
                  >
                    <UserAvatar name={apt.patientName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{apt.patientName}</p>
                      <p className="text-xs text-ink-faint">
                        {formatTime(apt.dateTime)} &middot; {apt.doctorName}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </button>
                ))}
              </div>
            </SectionCard>
          )
        })}
      </div>
    </>
  )
}

// ── Appointment detail ──

function AppointmentDetail({ apt }: { apt: Appointment }) {
  return (
    <div className="space-y-5">
      {/* Patient */}
      <div className="flex items-center gap-3">
        <UserAvatar name={apt.patientName} size="lg" />
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{apt.patientName}</h3>
          <p className="text-xs text-ink-faint">{apt.patientId}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3 text-sm">
        <DetailRow label="Doctor" value={apt.doctorName} />
        <DetailRow label="Specialty" value={apt.specialty} />
        <DetailRow label="Date / Time" value={formatDateTime(apt.dateTime)} />
        <DetailRow label="Duration" value={`${apt.durationMin} minutes`} />
        <DetailRow label="Reason" value={apt.reason} />
        <div className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-ink-faint">Status</span>
          <StatusBadge status={apt.status} />
        </div>
        {apt.checkInStatus && (
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-ink-faint">Check-in</span>
            <StatusBadge status={apt.checkInStatus} />
          </div>
        )}
      </div>

      <div className="flex items-start gap-1.5 rounded-lg bg-brand-tint/60 px-3 py-2 text-xs text-ink-soft">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
        Clinical details live in the patient&apos;s record.
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 text-ink-faint">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
