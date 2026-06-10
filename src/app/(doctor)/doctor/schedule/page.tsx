'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  List,
  CalendarRange,
  Check,
  Minus,
  Info,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  appointments,
  healthMetrics,
  staff,
} from '@/lib/data'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import {
  PageHeader,
  SectionCard,
  DataTable,
  StatusBadge,
  UserAvatar,
  SlideOver,
  type DataTableColumn,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Appointment } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const WEEK_DATES = [
  { date: '2026-06-08', label: 'Mon 8' },
  { date: '2026-06-09', label: 'Tue 9' },
  { date: '2026-06-10', label: 'Wed 10' },
  { date: '2026-06-11', label: 'Thu 11' },
  { date: '2026-06-12', label: 'Fri 12' },
  { date: '2026-06-13', label: 'Sat 13' },
  { date: '2026-06-14', label: 'Sun 14' },
]
const WEEK_START = '2026-06-08'
const WEEK_END_EXCL = '2026-06-15'

const STATUS_COLORS: Record<string, string> = {
  completed: 'border-l-ok bg-ok/5',
  confirmed: 'border-l-blue-500 bg-blue-50',
  in_progress: 'border-l-brand bg-brand/5',
  pending: 'border-l-warn bg-warn/5',
  cancelled: 'border-l-danger bg-danger/5',
}

type DateScope = 'today' | 'week' | 'all'
type ViewMode = 'list' | 'calendar'

// ── Helpers ──

function resolveDoctor(userId: string) {
  return (
    staff.find((s) => s.id === userId && s.role === 'doctor') ??
    staff.find((s) => s.id === 'STF-10001')!
  )
}

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
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Component ──

export default function DoctorSchedulePage() {
  const { user } = useAuth()
  const doctor = useMemo(() => resolveDoctor(user?.id ?? ''), [user])
  const doctorId = doctor.id

  const [view, setView] = useState<ViewMode>('list')
  const [dateScope, setDateScope] = useState<DateScope>('today')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)

  // ── Scoped data ──

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.doctorId === doctorId),
    [doctorId],
  )

  // Vitals lookup
  const hasVitals = useMemo(() => {
    const set = new Set<string>()
    const patientIds = new Set(myAppointments.map((a) => a.patientId))
    for (const m of healthMetrics) {
      if (patientIds.has(m.patientId) && m.recordedAt >= '2026-06-09T00:00:00Z') {
        set.add(m.patientId)
      }
    }
    return set
  }, [myAppointments])

  // ── Filtered ──

  const filtered = useMemo(() => {
    let list = [...myAppointments]
    if (dateScope === 'today') {
      list = list.filter((a) => a.dateTime.startsWith(TODAY))
    } else if (dateScope === 'week') {
      list = list.filter((a) => a.dateTime >= WEEK_START && a.dateTime < WEEK_END_EXCL)
    }
    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter)
    }
    return list.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  }, [myAppointments, dateScope, statusFilter])

  // Calendar data
  const calendarData = useMemo(() => {
    let base = myAppointments.filter(
      (a) => a.dateTime >= WEEK_START && a.dateTime < WEEK_END_EXCL,
    )
    if (statusFilter) base = base.filter((a) => a.status === statusFilter)
    const byDay = new Map<string, Appointment[]>()
    for (const d of WEEK_DATES) byDay.set(d.date, [])
    for (const a of base) {
      const day = a.dateTime.slice(0, 10)
      byDay.get(day)?.push(a)
    }
    for (const [, arr] of byDay) arr.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    return byDay
  }, [myAppointments, statusFilter])

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
        key: 'reason',
        header: 'Reason',
        className: 'hidden md:table-cell max-w-[220px] truncate',
      },
      {
        key: 'durationMin',
        header: 'Dur.',
        className: 'hidden sm:table-cell',
        render: (row: Appointment) => <span>{row.durationMin}m</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: Appointment) => <StatusBadge status={row.status} />,
      },
      {
        key: 'vitals',
        header: 'Vitals',
        className: 'hidden sm:table-cell',
        render: (row: Appointment) =>
          hasVitals.has(row.patientId) ? (
            <span className="inline-flex items-center gap-0.5 text-ok">
              <Check className="h-3.5 w-3.5" />
            </span>
          ) : (
            <Minus className="h-3.5 w-3.5 text-ink-faint" />
          ),
      },
    ],
    [hasVitals],
  )

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader
          title="My Schedule"
          description="Your appointments and clinic hours."
        />
      </motion.div>

      {/* Controls */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-input p-0.5">
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors',
                view === 'list' ? 'bg-brand-gradient text-white' : 'text-ink-soft hover:text-ink',
              )}
              onClick={() => setView('list')}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors',
                view === 'calendar' ? 'bg-brand-gradient text-white' : 'text-ink-soft hover:text-ink',
              )}
              onClick={() => setView('calendar')}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>

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
            className="w-auto min-w-[130px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeUp}>
        {view === 'list' ? (
          <SectionCard>
            <DataTable
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={filtered as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={['patientName', 'reason'] as never[]}
              pageSize={10}
              onRowClick={(row) => setSelectedApt(row as unknown as Appointment)}
            />
          </SectionCard>
        ) : (
          <>
            {/* Desktop calendar */}
            <div className="hidden sm:block rounded-lg border border-line bg-white">
              <div className="grid grid-cols-7 border-b border-line-soft">
                {WEEK_DATES.map((d) => (
                  <div
                    key={d.date}
                    className={cn(
                      'px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider',
                      d.date === TODAY ? 'bg-brand/5 text-brand-deep' : 'text-ink-faint',
                    )}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-line-soft" style={{ minHeight: 320 }}>
                {WEEK_DATES.map((d) => {
                  const dayApts = calendarData.get(d.date) ?? []
                  return (
                    <div
                      key={d.date}
                      className={cn('p-1.5 space-y-1', d.date === TODAY && 'bg-brand/[0.02]')}
                    >
                      {dayApts.length === 0 && (
                        <p className="mt-8 text-center text-[10px] text-ink-faint">No appts</p>
                      )}
                      {dayApts.map((apt) => (
                        <button
                          key={apt.id}
                          className={cn(
                            'w-full rounded-md border-l-[3px] px-1.5 py-1 text-left transition-colors hover:ring-1 hover:ring-brand/30',
                            STATUS_COLORS[apt.status] ?? 'border-l-ink-faint bg-line-soft/50',
                          )}
                          onClick={() => setSelectedApt(apt)}
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

            {/* Mobile stacked */}
            <div className="space-y-3 sm:hidden">
              {WEEK_DATES.map((d) => {
                const dayApts = calendarData.get(d.date) ?? []
                if (dayApts.length === 0) return null
                return (
                  <SectionCard
                    key={d.date}
                    title={d.date === TODAY ? `${d.label} (Today)` : d.label}
                  >
                    <div className="space-y-2">
                      {dayApts.map((apt) => (
                        <button
                          key={apt.id}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md border-l-[3px] px-3 py-2 text-left',
                            STATUS_COLORS[apt.status] ?? 'border-l-ink-faint bg-line-soft/50',
                          )}
                          onClick={() => setSelectedApt(apt)}
                        >
                          <UserAvatar name={apt.patientName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">
                              {apt.patientName}
                            </p>
                            <p className="text-xs text-ink-faint">
                              {formatTime(apt.dateTime)} &middot; {apt.reason}
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
        )}
      </motion.div>

      {/* Detail SlideOver */}
      <SlideOver
        open={selectedApt !== null}
        onOpenChange={(open) => !open && setSelectedApt(null)}
        title="Appointment Details"
        footer={
          selectedApt ? (
            <div className="flex w-full justify-end">
              <Link href={`/doctor/patients/${selectedApt.patientId}`}>
                <Button className="bg-brand-gradient text-white border-none">
                  Open patient record
                </Button>
              </Link>
            </div>
          ) : undefined
        }
      >
        {selectedApt && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <UserAvatar name={selectedApt.patientName} size="lg" />
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {selectedApt.patientName}
                </h3>
                <p className="text-xs text-ink-faint">{selectedApt.patientId}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <Row label="Date / Time" value={formatDateTime(selectedApt.dateTime)} />
              <Row label="Duration" value={`${selectedApt.durationMin} minutes`} />
              <Row label="Specialty" value={selectedApt.specialty} />
              <Row label="Reason" value={selectedApt.reason} />
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-ink-faint">Status</span>
                <StatusBadge status={selectedApt.status} />
              </div>
              {selectedApt.checkInStatus && (
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-ink-faint">Check-in</span>
                  <StatusBadge status={selectedApt.checkInStatus} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-ink-faint">Vitals</span>
                {hasVitals.has(selectedApt.patientId) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-ok">
                    <Check className="h-3.5 w-3.5" /> Recorded
                  </span>
                ) : (
                  <span className="text-xs text-ink-faint">Not yet recorded</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 rounded-lg bg-brand-tint/60 px-3 py-2 text-xs text-ink-soft">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
              Full clinical details are in the patient record.
            </div>
          </div>
        )}
      </SlideOver>
    </motion.div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 text-ink-faint">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
