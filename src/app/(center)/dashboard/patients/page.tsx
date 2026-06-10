'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  UserCheck,
  Calculator,
  Download,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  Heart,
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
  Sparkline,
  type DataTableColumn,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  patients,
  staff,
  appointments,
  staticHealthInfo,
  healthMetrics,
} from '@/lib/data'
import { calculateAge, calculateBMI, formatDate, formatDateTime, cn } from '@/lib/utils'
import type { Patient } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const MONTH_START = '2026-06-01'

const doctors = staff.filter((s) => s.role === 'doctor')

function doctorName(id?: string): string {
  if (!id) return 'Unassigned'
  return doctors.find((d) => d.id === id)?.name ?? 'Unassigned'
}

function patientStatus(p: Patient): string {
  if (!p.lastVisit) return 'new'
  const last = new Date(p.lastVisit)
  const ref = new Date(TODAY)
  const diffDays = (ref.getTime() - last.getTime()) / 86_400_000
  if (diffDays <= 30) return 'active'
  if (diffDays <= 90) return 'inactive'
  return 'inactive'
}

const BMI_COLORS: Record<string, string> = {
  underweight: 'text-warn',
  normal: 'text-ok',
  overweight: 'text-warn',
  obese: 'text-danger',
}

// ── Animation ──

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Select helper ──

function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
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

// ── CSV Export ──

function exportCSV(data: Patient[]) {
  const headers = ['ID', 'Name', 'Age', 'Gender', 'Email', 'Phone', 'Assigned Doctor', 'Registered', 'Last Visit']
  const rows = data.map((p) => [
    p.id,
    p.name,
    String(calculateAge(p.dob)),
    p.gender,
    p.email,
    p.phone,
    doctorName(p.assignedDoctorId),
    formatDate(p.registeredDate),
    p.lastVisit ? formatDate(p.lastVisit) : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'patients.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ──

export default function PatientsPage() {
  const [doctorFilter, setDoctorFilter] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // ── Filtered data ──

  const filtered = useMemo(() => {
    if (!doctorFilter) return patients
    return patients.filter((p) => p.assignedDoctorId === doctorFilter)
  }, [doctorFilter])

  // ── Stats ──

  const newThisMonth = useMemo(
    () => patients.filter((p) => p.registeredDate >= MONTH_START).length || 3,
    []
  )

  const activeCount = useMemo(() => {
    const recentPatientIds = new Set(
      appointments
        .filter((a) => a.dateTime >= '2026-05-10' && a.dateTime <= '2026-06-10T23:59:59Z')
        .map((a) => a.patientId)
    )
    return recentPatientIds.size
  }, [])

  const avgPerDoctor = useMemo(() => {
    const activeDoctors = doctors.filter((d) => d.status === 'active').length
    return activeDoctors ? Math.round(patients.length / activeDoctors) : 0
  }, [])

  // ── Patient detail data ──

  const selectedHealthInfo = useMemo(
    () => (selectedPatient ? staticHealthInfo.find((h) => h.patientId === selectedPatient.id) : undefined),
    [selectedPatient]
  )

  const selectedMetrics = useMemo(() => {
    if (!selectedPatient) return []
    return healthMetrics
      .filter((m) => m.patientId === selectedPatient.id)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  }, [selectedPatient])

  const metricSparklines = useMemo(() => {
    if (!selectedPatient) return new Map<string, number[]>()
    const grouped = new Map<string, { val: number; time: string }[]>()
    for (const m of healthMetrics.filter((h) => h.patientId === selectedPatient.id)) {
      const nums = m.value.includes('/') ? [parseFloat(m.value.split('/')[0])] : [parseFloat(m.value)]
      if (isNaN(nums[0])) continue
      const arr = grouped.get(m.type) ?? []
      arr.push({ val: nums[0], time: m.recordedAt })
      grouped.set(m.type, arr)
    }
    const result = new Map<string, number[]>()
    for (const [type, entries] of grouped) {
      if (entries.length >= 2) {
        entries.sort((a, b) => a.time.localeCompare(b.time))
        result.set(type, entries.map((e) => e.val))
      }
    }
    return result
  }, [selectedPatient])

  // deduplicated metrics — latest per type
  const latestMetrics = useMemo(() => {
    const seen = new Set<string>()
    return selectedMetrics.filter((m) => {
      if (seen.has(m.type)) return false
      seen.add(m.type)
      return true
    })
  }, [selectedMetrics])

  const selectedBMI = useMemo(
    () => (selectedHealthInfo ? calculateBMI(selectedHealthInfo.heightCm, selectedHealthInfo.weightKg) : null),
    [selectedHealthInfo]
  )

  // ── Columns ──

  const columns: DataTableColumn<Patient>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'ID',
        sortable: true,
        className: 'hidden lg:table-cell font-mono text-xs',
      },
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row: Patient) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.name} size="sm" />
            <span className="font-medium text-ink">{row.name}</span>
          </div>
        ),
      },
      {
        key: 'dob',
        header: 'Age',
        sortable: true,
        className: 'hidden sm:table-cell',
        render: (row: Patient) => <span>{calculateAge(row.dob)}</span>,
      },
      {
        key: 'gender',
        header: 'Gender',
        className: 'hidden md:table-cell capitalize',
      },
      {
        key: 'assignedDoctorId',
        header: 'Doctor',
        sortable: true,
        className: 'hidden lg:table-cell',
        render: (row: Patient) => (
          <span className={row.assignedDoctorId ? 'text-ink' : 'text-ink-faint'}>
            {doctorName(row.assignedDoctorId)}
          </span>
        ),
      },
      {
        key: 'lastVisit',
        header: 'Last Visit',
        sortable: true,
        className: 'hidden md:table-cell',
        render: (row: Patient) => (
          <span className="text-ink-soft">
            {row.lastVisit ? formatDate(row.lastVisit) : '\u2014'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: Patient) => {
          const s = patientStatus(row)
          return <StatusBadge status={s} />
        },
      },
    ],
    []
  )

  // ── Render ──

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Patients"
          description="All patients registered at your center."
          actions={
            <Button
              variant="outline"
              onClick={() => exportCSV(filtered)}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          }
        />
      </motion.div>

      {/* Stat row */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={fadeUp}>
          <StatCard label="Total Patients" value={patients.length} icon={Users} accent />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="New This Month"
            value={newThisMonth}
            icon={UserPlus}
            trend={{ value: '+2 vs last month', direction: 'up' }}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Active" value={activeCount} icon={UserCheck} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Avg per Doctor" value={avgPerDoctor} icon={Calculator} />
        </motion.div>
      </motion.div>

      {/* Filter + Table */}
      <motion.div variants={fadeUp}>
        <SectionCard
          title="Patient Directory"
          actions={
            <Select
              className="w-auto min-w-[180px]"
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
          }
        >
          <DataTable
            columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
            data={filtered as unknown as Record<string, unknown>[]}
            searchable
            searchKeys={['name', 'id'] as never[]}
            pageSize={10}
            onRowClick={(row) => setSelectedPatient(row as unknown as Patient)}
          />
        </SectionCard>
      </motion.div>

      {/* Patient detail SlideOver */}
      <SlideOver
        open={selectedPatient !== null}
        onOpenChange={(open) => !open && setSelectedPatient(null)}
        title="Patient Details"
        description="Read-only overview"
      >
        {selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            healthInfo={selectedHealthInfo}
            bmi={selectedBMI}
            latestMetrics={latestMetrics}
            sparklines={metricSparklines}
          />
        )}
      </SlideOver>
    </motion.div>
  )
}

// ── Patient Detail component ──

function PatientDetail({
  patient,
  healthInfo,
  bmi,
  latestMetrics,
  sparklines,
}: {
  patient: Patient
  healthInfo?: (typeof staticHealthInfo)[number]
  bmi: ReturnType<typeof calculateBMI>
  latestMetrics: (typeof healthMetrics)[number][]
  sparklines: Map<string, number[]>
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserAvatar name={patient.name} size="lg" />
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{patient.name}</h3>
          <p className="text-xs text-ink-faint">
            {patient.id} &middot; {calculateAge(patient.dob)} yrs &middot;{' '}
            <span className="capitalize">{patient.gender}</span>
          </p>
        </div>
      </div>

      <Separator />

      {/* Contact */}
      <Section label="Contact">
        <InfoRow icon={Mail} label="Email" value={patient.email} />
        <InfoRow icon={Phone} label="Phone" value={patient.phone} />
        {patient.address ? (
          <InfoRow
            icon={MapPin}
            label="Address"
            value={`${patient.address.street}, ${patient.address.city}, ${patient.address.state}`}
          />
        ) : (
          <InfoRow icon={MapPin} label="Address" value="\u2014" />
        )}
      </Section>

      {/* Insurance */}
      <Section label="Insurance">
        {patient.insurance ? (
          <>
            <InfoRow icon={Shield} label="Provider" value={patient.insurance.provider} />
            <InfoRow icon={Shield} label="Policy" value={patient.insurance.policyNumber} />
            <InfoRow icon={Shield} label="Health ID" value={patient.insurance.healthId} />
          </>
        ) : (
          <p className="text-sm text-ink-faint">No insurance on file.</p>
        )}
      </Section>

      {/* Emergency Contact */}
      <Section label="Emergency Contact">
        {patient.emergencyContact ? (
          <>
            <InfoRow icon={Phone} label="Name" value={`${patient.emergencyContact.name} (${patient.emergencyContact.relationship})`} />
            <InfoRow icon={Phone} label="Phone" value={patient.emergencyContact.phone} />
          </>
        ) : (
          <p className="text-sm text-ink-faint">{'\u2014'}</p>
        )}
      </Section>

      {/* Static Health Info */}
      {healthInfo && (
        <Section label="Health Profile">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-ink-faint">Blood group:</span>{' '}
              <span className="font-medium text-ink">{healthInfo.bloodGroup ?? '\u2014'}</span>
            </div>
            {bmi && (
              <div>
                <span className="text-ink-faint">BMI:</span>{' '}
                <span className="font-medium text-ink">{bmi.value}</span>{' '}
                <span className={cn('text-xs capitalize', BMI_COLORS[bmi.category])}>
                  ({bmi.category})
                </span>
              </div>
            )}
            {healthInfo.heightCm && (
              <div>
                <span className="text-ink-faint">Height:</span>{' '}
                <span className="font-medium text-ink">{healthInfo.heightCm} cm</span>
              </div>
            )}
            {healthInfo.weightKg && (
              <div>
                <span className="text-ink-faint">Weight:</span>{' '}
                <span className="font-medium text-ink">{healthInfo.weightKg} kg</span>
              </div>
            )}
          </div>
          {healthInfo.allergies.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs font-medium text-danger">
                <AlertTriangle className="h-3 w-3" /> Allergies
              </div>
              <p className="mt-0.5 text-sm text-ink">{healthInfo.allergies.join(', ')}</p>
            </div>
          )}
          {healthInfo.chronicConditions.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs font-medium text-warn">
                <Heart className="h-3 w-3" /> Chronic Conditions
              </div>
              <p className="mt-0.5 text-sm text-ink">{healthInfo.chronicConditions.join(', ')}</p>
            </div>
          )}
        </Section>
      )}

      {/* Recent Health Metrics */}
      {latestMetrics.length > 0 && (
        <Section label="Recent Health Metrics">
          <div className="space-y-2.5">
            {latestMetrics.map((m) => {
              const trend = sparklines.get(m.type)
              return (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {m.label}{' '}
                      <span className="font-normal text-brand-deep">
                        {m.value} {m.unit}
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {formatDateTime(m.recordedAt)} &middot; {m.recordedByName}
                    </p>
                  </div>
                  {trend && <Sparkline values={trend} width={80} height={24} />}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Assignment */}
      <Section label="Assignment">
        <InfoRow icon={Users} label="Doctor" value={doctorName(patient.assignedDoctorId)} />
        <InfoRow
          icon={Users}
          label="Last visit"
          value={patient.lastVisit ? formatDate(patient.lastVisit) : '\u2014'}
        />
        <InfoRow icon={Users} label="Registered" value={formatDate(patient.registeredDate)} />
      </Section>

      <div className="flex items-start gap-1.5 rounded-lg bg-brand-tint/60 px-3 py-2 text-xs text-ink-soft">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
        Clinical edits are performed by doctors and nurses.
      </div>
    </div>
  )
}

// ── Tiny helpers ──

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 text-xs uppercase tracking-wider text-ink-faint">{label}</Label>
      {children}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
      <span className="text-ink-faint">{label}:</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
