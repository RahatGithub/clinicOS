'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Check,
  Minus,
  Plus,
  Pencil,
  AlertTriangle,
  Heart,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import {
  staff,
  patients,
  appointments,
  healthMetrics as initialMetrics,
  staticHealthInfo as initialHealthInfo,
} from '@/lib/data'
import { calculateAge, calculateBMI, formatDate, formatDateTime, cn } from '@/lib/utils'
import {
  PageHeader,
  SectionCard,
  StatusBadge,
  UserAvatar,
  SlideOver,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type {
  Appointment,
  HealthMetricType,
  HealthMetricEntry,
  StaticHealthInfo,
  Patient,
} from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'

const METRIC_LABELS: Record<HealthMetricType, { label: string; unit: string }> = {
  blood_pressure: { label: 'Blood Pressure', unit: 'mmHg' },
  blood_glucose: { label: 'Blood Glucose', unit: 'mg/dL' },
  heart_rate: { label: 'Heart Rate', unit: 'bpm' },
  spo2: { label: 'SpO2', unit: '%' },
  temperature: { label: 'Temperature', unit: '\u00b0F' },
  respiratory_rate: { label: 'Respiratory Rate', unit: 'breaths/min' },
  cholesterol_total: { label: 'Total Cholesterol', unit: 'mg/dL' },
  hemoglobin: { label: 'Hemoglobin', unit: 'g/dL' },
  creatinine: { label: 'Creatinine', unit: 'mg/dL' },
  tsh: { label: 'TSH', unit: 'mIU/L' },
  bmi: { label: 'BMI', unit: 'kg/m\u00b2' },
  platelet_count: { label: 'Platelet Count', unit: 'x10\u00b3/\u00b5L' },
}

const BMI_COLORS: Record<string, string> = {
  underweight: 'text-warn', normal: 'text-ok', overweight: 'text-warn', obese: 'text-danger',
}

const QUEUE_OPTIONS = [
  { value: 'not_arrived', label: 'Not arrived' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'ready', label: 'Ready for doctor' },
  { value: 'with_doctor', label: 'With doctor' },
  { value: 'done', label: 'Done' },
]

function resolveNurse(userId: string) {
  return staff.find((s) => s.id === userId && s.role === 'nurse') ?? staff.find((s) => s.id === 'STF-89856')!
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select className={cn('h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50', className)} {...props}>
      {children}
    </select>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>
}

let idCounter = 200

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Component ──

export default function NurseQueuePage() {
  const { user } = useAuth()
  const nurse = useMemo(() => resolveNurse(user?.id ?? ''), [user])
  const doctorId = nurse.assignedDoctorId ?? 'STF-10001'
  const assignedDoctor = useMemo(() => staff.find((s) => s.id === doctorId), [doctorId])

  // Queue
  const todayQueue = useMemo(
    () => appointments.filter((a) => a.doctorId === doctorId && a.dateTime.startsWith(TODAY)).sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [doctorId],
  )
  const [queueStatuses, setQueueStatuses] = useState<Record<string, string>>({})

  // Metrics store — keyed by patientId
  const [metricsStore, setMetricsStore] = useState<Record<string, HealthMetricEntry[]>>(() => {
    const store: Record<string, HealthMetricEntry[]> = {}
    for (const a of todayQueue) {
      store[a.patientId] = initialMetrics.filter((m) => m.patientId === a.patientId)
    }
    return store
  })

  // Health info store
  const [healthInfoStore, setHealthInfoStore] = useState<Record<string, StaticHealthInfo | undefined>>(() => {
    const store: Record<string, StaticHealthInfo | undefined> = {}
    for (const a of todayQueue) {
      store[a.patientId] = initialHealthInfo.find((h) => h.patientId === a.patientId)
    }
    return store
  })

  // Slide-over state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [newMetricType, setNewMetricType] = useState<HealthMetricType>('blood_pressure')
  const [newMetricValue, setNewMetricValue] = useState('')
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Health info edit
  const [editingHealthInfo, setEditingHealthInfo] = useState(false)
  const [hiForm, setHiForm] = useState<StaticHealthInfo | null>(null)

  // Pre-consultation notes
  const [preNotes, setPreNotes] = useState<Record<string, string>>({})

  const selectedPatient = useMemo(() => patients.find((p) => p.id === selectedPatientId), [selectedPatientId])
  const selectedMetrics = selectedPatientId ? (metricsStore[selectedPatientId] ?? []) : []
  const selectedHealthInfo = selectedPatientId ? healthInfoStore[selectedPatientId] : undefined
  const selectedBmi = useMemo(
    () => selectedHealthInfo ? calculateBMI(selectedHealthInfo.heightCm, selectedHealthInfo.weightKg) : null,
    [selectedHealthInfo],
  )

  // Recent metrics (latest per type)
  const recentMetrics = useMemo(() => {
    const sorted = [...selectedMetrics].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    const seen = new Set<string>()
    return sorted.filter((m) => { if (seen.has(m.type)) return false; seen.add(m.type); return true })
  }, [selectedMetrics])

  function getStatus(apt: Appointment) {
    return queueStatuses[apt.id] ?? apt.checkInStatus ?? apt.status
  }

  function hasVitals(patientId: string): boolean {
    return (metricsStore[patientId] ?? []).some((m) => m.recordedAt >= '2026-06-09T00:00:00Z')
  }

  function openVitals(patientId: string) {
    setSelectedPatientId(patientId)
    setNewMetricValue('')
    setNewMetricType('blood_pressure')
    setEditingMetricId(null)
    setEditingHealthInfo(false)
  }

  function addMetric() {
    if (!newMetricValue.trim() || !selectedPatientId) return
    const meta = METRIC_LABELS[newMetricType]
    const entry: HealthMetricEntry = {
      id: `HM-N-${idCounter++}`,
      patientId: selectedPatientId,
      type: newMetricType,
      label: meta.label,
      value: newMetricValue.trim(),
      unit: meta.unit,
      recordedAt: `${TODAY}T${new Date().toISOString().slice(11)}`,
      recordedById: nurse.id,
      recordedByName: nurse.name,
      recordedByRole: 'nurse',
    }
    setMetricsStore((prev) => ({ ...prev, [selectedPatientId]: [...(prev[selectedPatientId] ?? []), entry] }))
    setNewMetricValue('')
    toast.success(`${meta.label} recorded.`)
  }

  function saveMetricEdit(metricId: string) {
    if (!selectedPatientId || !editValue.trim()) return
    setMetricsStore((prev) => ({
      ...prev,
      [selectedPatientId]: (prev[selectedPatientId] ?? []).map((m) =>
        m.id === metricId ? { ...m, value: editValue.trim() } : m,
      ),
    }))
    setEditingMetricId(null)
    toast.success('Metric updated.')
  }

  function openHealthInfoEdit() {
    if (!selectedHealthInfo || !selectedPatientId) return
    setHiForm({ ...selectedHealthInfo })
    setEditingHealthInfo(true)
  }

  function saveHealthInfo() {
    if (!hiForm || !selectedPatientId) return
    setHealthInfoStore((prev) => ({ ...prev, [selectedPatientId]: { ...hiForm } }))
    setEditingHealthInfo(false)
    toast.success('Health profile updated.')
  }

  function markReady() {
    if (!selectedPatientId) return
    const apt = todayQueue.find((a) => a.patientId === selectedPatientId)
    if (apt) {
      setQueueStatuses((prev) => ({ ...prev, [apt.id]: 'ready' }))
      toast.success(`${apt.patientName} marked ready for ${assignedDoctor?.name ?? 'doctor'}.`)
    }
    setSelectedPatientId(null)
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader title="Patient Queue" description={`Record vitals and prepare patients for ${assignedDoctor?.name ?? 'the doctor'}.`} />
      </motion.div>

      {/* Queue table */}
      <motion.div variants={fadeUp}>
        <SectionCard noPadding>
          <div className="divide-y divide-line-soft">
            {todayQueue.map((apt, idx) => {
              const pat = patients.find((p) => p.id === apt.patientId)
              const status = getStatus(apt)
              const vitals = hasVitals(apt.patientId)
              return (
                <div key={apt.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-6 text-center text-xs font-semibold text-ink-faint">{idx + 1}</span>
                  <div className="flex w-14 shrink-0 items-center gap-1 text-sm text-ink">
                    <Clock className="h-3.5 w-3.5 text-ink-faint" />
                    {formatTime(apt.dateTime)}
                  </div>
                  <UserAvatar name={apt.patientName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {apt.patientName}
                      {pat && <span className="ml-1 font-normal text-ink-faint">({calculateAge(pat.dob)})</span>}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                  {vitals ? (
                    <span className="hidden items-center gap-0.5 text-[10px] font-medium text-ok sm:inline-flex">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <Minus className="hidden h-3.5 w-3.5 text-ink-faint sm:block" />
                  )}
                  <Button size="sm" className="bg-brand-gradient text-white border-none text-xs" onClick={() => openVitals(apt.patientId)}>
                    Record vitals
                  </Button>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* ── Record Vitals SlideOver ── */}
      <SlideOver
        open={selectedPatientId !== null}
        onOpenChange={(open) => !open && setSelectedPatientId(null)}
        title="Record Vitals"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedPatientId(null)}>Close</Button>
            <Button className="bg-brand-gradient text-white border-none" onClick={markReady}>
              <Check className="mr-1.5 h-4 w-4" /> Mark ready for doctor
            </Button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-5">
            {/* Patient header */}
            <div className="flex items-center gap-3">
              <UserAvatar name={selectedPatient.name} size="lg" />
              <div>
                <h3 className="font-display text-base font-semibold text-ink">{selectedPatient.name}</h3>
                <p className="text-xs text-ink-faint">
                  {selectedPatient.id} &middot; {calculateAge(selectedPatient.dob)} yrs &middot; <span className="capitalize">{selectedPatient.gender}</span>
                </p>
              </div>
            </div>

            {/* Clinical chips */}
            {selectedHealthInfo && (selectedHealthInfo.allergies.length > 0 || selectedHealthInfo.chronicConditions.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {selectedHealthInfo.allergies.map((a) => (
                  <span key={a} className="inline-flex items-center gap-0.5 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                    <AlertTriangle className="h-2.5 w-2.5" /> {a}
                  </span>
                ))}
                {selectedHealthInfo.chronicConditions.map((c) => (
                  <span key={c} className="inline-flex items-center gap-0.5 rounded-full bg-warn/10 px-2 py-0.5 text-[10px] font-medium text-warn">
                    <Heart className="h-2.5 w-2.5" /> {c}
                  </span>
                ))}
              </div>
            )}

            <Separator />

            {/* Static health info */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Health Profile</span>
                {selectedHealthInfo && (
                  <button className="text-xs text-brand hover:underline" onClick={openHealthInfoEdit}>
                    <Pencil className="mr-0.5 inline h-3 w-3" /> Edit
                  </button>
                )}
              </div>
              {selectedHealthInfo ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-ink-faint">Blood group:</span> <span className="font-medium text-ink">{selectedHealthInfo.bloodGroup ?? '\u2014'}</span></div>
                  {selectedBmi && (
                    <div>
                      <span className="text-ink-faint">BMI:</span>{' '}
                      <span className="font-medium text-ink">{selectedBmi.value}</span>{' '}
                      <span className={cn('text-xs capitalize', BMI_COLORS[selectedBmi.category])}>({selectedBmi.category})</span>
                    </div>
                  )}
                  <div><span className="text-ink-faint">Height:</span> <span className="font-medium text-ink">{selectedHealthInfo.heightCm ? `${selectedHealthInfo.heightCm} cm` : '\u2014'}</span></div>
                  <div><span className="text-ink-faint">Weight:</span> <span className="font-medium text-ink">{selectedHealthInfo.weightKg ? `${selectedHealthInfo.weightKg} kg` : '\u2014'}</span></div>
                </div>
              ) : (
                <p className="text-sm text-ink-faint">No health profile on file.</p>
              )}
            </div>

            <Separator />

            {/* Add metric */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-faint">Add Reading</span>
              <div className="flex gap-2">
                <Select className="flex-1" value={newMetricType} onChange={(e) => setNewMetricType(e.target.value as HealthMetricType)}>
                  {Object.entries(METRIC_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
                <Input
                  className="w-28"
                  placeholder={METRIC_LABELS[newMetricType].unit === 'mmHg' ? '120/80' : 'Value'}
                  value={newMetricValue}
                  onChange={(e) => setNewMetricValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMetric()}
                />
                <Button size="sm" className="bg-brand-gradient text-white border-none" onClick={addMetric}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-ink-faint">
                Unit: {METRIC_LABELS[newMetricType].unit} &middot; Recorded by {nurse.name}
              </p>
            </div>

            {/* Recorded metrics */}
            {recentMetrics.length > 0 && (
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-faint">Recorded Metrics</span>
                <div className="space-y-1.5">
                  {recentMetrics.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-md border border-line-soft px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">
                          <span className="font-medium">{m.label}</span>{' '}
                          {editingMetricId === m.id ? (
                            <span className="inline-flex items-center gap-1">
                              <input
                                className="w-20 rounded border border-input px-1.5 py-0.5 text-sm outline-none focus-visible:border-ring"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveMetricEdit(m.id)}
                                autoFocus
                              />
                              <button className="text-ok" onClick={() => saveMetricEdit(m.id)}><Check className="h-3.5 w-3.5" /></button>
                              <button className="text-ink-faint" onClick={() => setEditingMetricId(null)}><X className="h-3.5 w-3.5" /></button>
                            </span>
                          ) : (
                            <span className="text-brand-deep">{m.value} {m.unit}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-ink-faint">{formatDateTime(m.recordedAt)} &middot; {m.recordedByName}</p>
                      </div>
                      {editingMetricId !== m.id && (
                        <button
                          className="rounded p-1 text-ink-faint hover:text-brand"
                          onClick={() => { setEditingMetricId(m.id); setEditValue(m.value) }}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Pre-consultation notes */}
            <div>
              <Label htmlFor="pre-notes" className="mb-1.5 text-xs uppercase tracking-wider text-ink-faint">Pre-consultation Notes</Label>
              <textarea
                id="pre-notes"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={2}
                placeholder="Notes for the doctor\u2026"
                value={preNotes[selectedPatientId!] ?? ''}
                onChange={(e) => setPreNotes((prev) => ({ ...prev, [selectedPatientId!]: e.target.value }))}
              />
            </div>
          </div>
        )}
      </SlideOver>

      {/* Edit health info SlideOver */}
      <SlideOver
        open={editingHealthInfo}
        onOpenChange={setEditingHealthInfo}
        title="Edit Health Profile"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingHealthInfo(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-none" onClick={saveHealthInfo}>Save</Button>
          </div>
        }
      >
        {hiForm && (
          <div className="space-y-4">
            <Field label="Blood Group" htmlFor="hi-bg">
              <Input id="hi-bg" value={hiForm.bloodGroup ?? ''} onChange={(e) => setHiForm({ ...hiForm, bloodGroup: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (cm)" htmlFor="hi-ht">
                <Input id="hi-ht" type="number" value={hiForm.heightCm ?? ''} onChange={(e) => setHiForm({ ...hiForm, heightCm: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="Weight (kg)" htmlFor="hi-wt">
                <Input id="hi-wt" type="number" value={hiForm.weightKg ?? ''} onChange={(e) => setHiForm({ ...hiForm, weightKg: Number(e.target.value) || undefined })} />
              </Field>
            </div>
            <Field label="Allergies (comma-separated)" htmlFor="hi-al">
              <Input id="hi-al" value={hiForm.allergies.join(', ')} onChange={(e) => setHiForm({ ...hiForm, allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Chronic Conditions (comma-separated)" htmlFor="hi-cc">
              <Input id="hi-cc" value={hiForm.chronicConditions.join(', ')} onChange={(e) => setHiForm({ ...hiForm, chronicConditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
          </div>
        )}
      </SlideOver>
    </motion.div>
  )
}
