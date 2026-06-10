'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  CalendarDays,
  Users,
  CalendarCheck,
  Download,
  MoreHorizontal,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { prescriptions, patients, staff, tenants } from '@/lib/data'
import { formatDate, cn } from '@/lib/utils'
import {
  PageHeader,
  StatCard,
  SectionCard,
  DataTable,
  UserAvatar,
  SlideOver,
  type DataTableColumn,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { PrescriptionPdfActions } from '@/components/doctor/prescription-pdf-actions'
import type { Prescription } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const MONTH_START = '2026-06-01'
const WEEK_START = '2026-06-04'

const CENTER_TENANT = tenants.find((t) => t.id === 'TEN-001')!
const CENTER_INFO = {
  name: CENTER_TENANT.name,
  address: `${CENTER_TENANT.address.street}, ${CENTER_TENANT.address.city}, ${CENTER_TENANT.address.state}`,
  phone: CENTER_TENANT.phone,
  email: CENTER_TENANT.email,
}

function resolveDoctor(userId: string) {
  return (
    staff.find((s) => s.id === userId && s.role === 'doctor') ??
    staff.find((s) => s.id === 'STF-10001')!
  )
}

type DateScope = 'week' | 'month' | 'all'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

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

function exportCSV(data: Prescription[]) {
  const headers = ['Rx ID', 'Date', 'Patient', 'Patient ID', 'Diagnosis', 'Medicines', 'Follow-up']
  const rows = data.map((rx) => [
    rx.id,
    formatDate(rx.date),
    rx.patientName,
    rx.patientId,
    rx.diagnosis,
    rx.medicines.map((m) => `${m.name} ${m.dose}`).join('; '),
    rx.followUpDate ? formatDate(rx.followUpDate) : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'prescriptions.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ──

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth()
  const doctor = useMemo(() => resolveDoctor(user?.id ?? ''), [user])
  const doctorId = doctor.id

  const [dateScope, setDateScope] = useState<DateScope>('all')
  const [followUpOnly, setFollowUpOnly] = useState(false)
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)

  // ── Scoped data ──

  const myPrescriptions = useMemo(
    () =>
      prescriptions
        .filter((rx) => rx.doctorId === doctorId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [doctorId],
  )

  // ── Stats ──

  const thisMonth = useMemo(
    () => myPrescriptions.filter((rx) => rx.date >= MONTH_START).length,
    [myPrescriptions],
  )

  const uniquePatients = useMemo(() => {
    const ids = new Set(myPrescriptions.map((rx) => rx.patientId))
    return ids.size
  }, [myPrescriptions])

  const withFollowUp = useMemo(
    () => myPrescriptions.filter((rx) => rx.followUpDate).length,
    [myPrescriptions],
  )

  // ── Filtered ──

  const filtered = useMemo(() => {
    let list = [...myPrescriptions]
    if (dateScope === 'week') {
      list = list.filter((rx) => rx.date >= WEEK_START)
    } else if (dateScope === 'month') {
      list = list.filter((rx) => rx.date >= MONTH_START)
    }
    if (followUpOnly) {
      list = list.filter((rx) => rx.followUpDate)
    }
    return list
  }, [myPrescriptions, dateScope, followUpOnly])

  // ── Columns ──

  const columns: DataTableColumn<Prescription>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'Rx ID',
        sortable: true,
        className: 'font-mono text-xs',
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        className: 'hidden sm:table-cell',
        render: (row: Prescription) => (
          <span className="text-ink-soft">{formatDate(row.date)}</span>
        ),
      },
      {
        key: 'patientName',
        header: 'Patient',
        sortable: true,
        render: (row: Prescription) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.patientName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{row.patientName}</p>
              <p className="text-[10px] text-ink-faint">{row.patientId}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'diagnosis',
        header: 'Diagnosis',
        className: 'hidden md:table-cell max-w-[200px]',
        render: (row: Prescription) => (
          <span className="block truncate text-ink-soft">{row.diagnosis}</span>
        ),
      },
      {
        key: 'medicines',
        header: 'Meds',
        className: 'hidden sm:table-cell',
        render: (row: Prescription) => (
          <span className="text-ink-soft">{row.medicines.length} med{row.medicines.length !== 1 ? 's' : ''}</span>
        ),
      },
      {
        key: 'followUpDate',
        header: 'Follow-up',
        className: 'hidden lg:table-cell',
        sortable: true,
        render: (row: Prescription) => (
          <span className="text-ink-soft">{row.followUpDate ? formatDate(row.followUpDate) : '\u2014'}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-10',
        render: (row: Prescription) => (
          <ActionsCell rx={row} onView={() => setSelectedRx(row)} doctor={doctor} />
        ),
      },
    ],
    [doctor],
  )

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Prescriptions"
          description="All prescriptions you\u2019ve issued."
          actions={
            <Button variant="outline" onClick={() => exportCSV(filtered)}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          }
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={fadeUp}>
          <StatCard label="Total" value={myPrescriptions.length} icon={FileText} accent />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="This Month" value={thisMonth} icon={CalendarDays} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Patients" value={uniquePatients} icon={Users} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="With Follow-up" value={withFollowUp} icon={CalendarCheck} />
        </motion.div>
      </motion.div>

      {/* Filters + Table */}
      <motion.div variants={fadeUp}>
        <SectionCard
          title="Prescription Records"
          actions={
            <div className="flex items-center gap-2">
              <Select
                className="w-auto min-w-[120px]"
                value={dateScope}
                onChange={(e) => setDateScope(e.target.value as DateScope)}
              >
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="all">All</option>
              </Select>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={followUpOnly}
                  onChange={(e) => setFollowUpOnly(e.target.checked)}
                  className="rounded border-input accent-brand"
                />
                Follow-up
              </label>
            </div>
          }
        >
          <DataTable
            columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
            data={filtered as unknown as Record<string, unknown>[]}
            searchable
            searchKeys={['patientName', 'diagnosis', 'id'] as never[]}
            pageSize={10}
            onRowClick={(row) => setSelectedRx(row as unknown as Prescription)}
          />
        </SectionCard>
      </motion.div>

      {/* Detail SlideOver */}
      <SlideOver
        open={selectedRx !== null}
        onOpenChange={(open) => !open && setSelectedRx(null)}
        title="Prescription Details"
        footer={
          selectedRx ? (
            <div className="flex w-full items-center justify-between">
              <span className="font-mono text-xs text-ink-faint">{selectedRx.id}</span>
              <PrescriptionPdfActions
                prescription={selectedRx}
                patient={patients.find((p) => p.id === selectedRx.patientId)!}
                doctor={doctor}
                center={CENTER_INFO}
              />
            </div>
          ) : undefined
        }
      >
        {selectedRx && <RxDetail rx={selectedRx} />}
      </SlideOver>
    </motion.div>
  )
}

// ── Actions dropdown ──

function ActionsCell({
  rx,
  onView,
  doctor,
}: {
  rx: Prescription
  onView: () => void
  doctor: ReturnType<typeof resolveDoctor>
}) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
          render={<button type="button" />}
        >
          <MoreHorizontal className="h-4 w-4 text-ink-faint" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
          <DropdownMenuItem onSelect={onView}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="hidden sm:block">
        <PrescriptionPdfActions
          prescription={rx}
          patient={patients.find((p) => p.id === rx.patientId)!}
          doctor={doctor}
          center={CENTER_INFO}
        />
      </div>
    </div>
  )
}

// ── Prescription detail ──

function RxDetail({ rx }: { rx: Prescription }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <UserAvatar name={rx.patientName} size="lg" />
        <div>
          <p className="font-display text-base font-semibold text-ink">{rx.patientName}</p>
          <p className="text-xs text-ink-faint">{rx.patientId} &middot; {formatDate(rx.date)}</p>
        </div>
      </div>
      <Separator />
      {rx.chiefComplaint && (
        <div><span className="text-ink-faint">Chief complaint:</span> <span className="text-ink">{rx.chiefComplaint}</span></div>
      )}
      <div><span className="text-ink-faint">Diagnosis:</span> <span className="font-medium text-ink">{rx.diagnosis}</span></div>
      {rx.medicines.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">Medicines</p>
          <div className="space-y-1.5">
            {rx.medicines.map((m, i) => (
              <div key={i} className="rounded-md bg-canvas px-3 py-1.5">
                <p className="font-medium text-ink">{m.name} — {m.dose}</p>
                <p className="text-xs text-ink-soft">
                  {m.frequency} &middot; {m.duration}
                  {m.instructions && <> &middot; {m.instructions}</>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {rx.testsSuggested.length > 0 && (
        <div><span className="text-ink-faint">Tests:</span> <span className="text-ink">{rx.testsSuggested.join(', ')}</span></div>
      )}
      {rx.todos.length > 0 && (
        <div>
          <span className="text-ink-faint">To-dos:</span>
          <ul className="mt-0.5 list-inside list-disc text-ink">{rx.todos.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      {rx.notTodos.length > 0 && (
        <div>
          <span className="text-ink-faint">Avoid:</span>
          <ul className="mt-0.5 list-inside list-disc text-danger">{rx.notTodos.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      {rx.followUpDate && (
        <div><span className="text-ink-faint">Follow-up:</span> <span className="text-ink">{formatDate(rx.followUpDate)}</span></div>
      )}
      {rx.notes && (
        <div><span className="text-ink-faint">Notes:</span> <span className="text-ink">{rx.notes}</span></div>
      )}
    </div>
  )
}
