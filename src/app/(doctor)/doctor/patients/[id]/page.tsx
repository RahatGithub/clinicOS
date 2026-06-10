'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertTriangle,
  Heart,
  Pill,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import {
  patients,
  staticHealthInfo as initialHealthInfo,
  healthMetrics as initialMetrics,
  prescriptions,
  staff,
} from '@/lib/data'
import {
  calculateAge,
  calculateBMI,
  formatDate,
  formatDateTime,
  cn,
} from '@/lib/utils'
import {
  SectionCard,
  StatusBadge,
  UserAvatar,
  EmptyState,
  SlideOver,
  Sparkline,
} from '@/components/shared'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type {
  HealthMetricType,
  HealthMetricEntry,
  StaticHealthInfo,
  Prescription,
} from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'

const METRIC_LABELS: Record<HealthMetricType, { label: string; unit: string }> = {
  blood_pressure: { label: 'Blood Pressure', unit: 'mmHg' },
  blood_glucose: { label: 'Blood Glucose', unit: 'mg/dL' },
  heart_rate: { label: 'Heart Rate', unit: 'bpm' },
  spo2: { label: 'SpO2', unit: '%' },
  temperature: { label: 'Temperature', unit: '°F' },
  respiratory_rate: { label: 'Respiratory Rate', unit: 'breaths/min' },
  cholesterol_total: { label: 'Total Cholesterol', unit: 'mg/dL' },
  hemoglobin: { label: 'Hemoglobin', unit: 'g/dL' },
  creatinine: { label: 'Creatinine', unit: 'mg/dL' },
  tsh: { label: 'TSH', unit: 'mIU/L' },
  bmi: { label: 'BMI', unit: 'kg/m²' },
  platelet_count: { label: 'Platelet Count', unit: 'x10³/µL' },
}

const BMI_COLORS: Record<string, string> = {
  underweight: 'text-warn',
  normal: 'text-ok',
  overweight: 'text-warn',
  obese: 'text-danger',
}

function resolveDoctor(userId: string) {
  return (
    staff.find((s) => s.id === userId && s.role === 'doctor') ??
    staff.find((s) => s.id === 'STF-10001')!
  )
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

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
      rows={3}
      {...props}
    />
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

let metricIdCounter = 100

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Empty medicine row ──

interface MedicineRow {
  name: string
  dose: string
  frequency: string
  duration: string
  instructions: string
}

const emptyMedicine: MedicineRow = { name: '', dose: '', frequency: '', duration: '', instructions: '' }

// ── Component ──

export default function PatientRecordPage() {
  const params = useParams<{ id: string }>()
  const patientId = params.id
  const { user } = useAuth()
  const doctor = useMemo(() => resolveDoctor(user?.id ?? ''), [user])

  const patient = useMemo(() => patients.find((p) => p.id === patientId), [patientId])

  // ── Local state: static health info ──
  const [healthInfo, setHealthInfo] = useState<StaticHealthInfo | undefined>(() =>
    initialHealthInfo.find((h) => h.patientId === patientId),
  )
  const [editingHealth, setEditingHealth] = useState(false)
  const [healthForm, setHealthForm] = useState<StaticHealthInfo | null>(null)

  // ── Local state: metrics ──
  const [metrics, setMetrics] = useState<HealthMetricEntry[]>(() =>
    initialMetrics.filter((m) => m.patientId === patientId),
  )
  const [addingMetric, setAddingMetric] = useState(false)
  const [newMetricType, setNewMetricType] = useState<HealthMetricType>('blood_pressure')
  const [newMetricValue, setNewMetricValue] = useState('')

  // ── Local state: consultation ──
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<MedicineRow[]>([{ ...emptyMedicine }])
  const [testsSuggested, setTestsSuggested] = useState('')
  const [todos, setTodos] = useState('')
  const [notTodos, setNotTodos] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')

  // ── Local state: visit history (append on save) ──
  const [localPrescriptions, setLocalPrescriptions] = useState<Prescription[]>(() =>
    prescriptions.filter((rx) => rx.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date)),
  )
  const [expandedRx, setExpandedRx] = useState<string | null>(null)

  // ── Derived ──

  const bmi = useMemo(
    () => (healthInfo ? calculateBMI(healthInfo.heightCm, healthInfo.weightKg) : null),
    [healthInfo],
  )

  // Group metrics by type, latest first per type, with sparkline data
  const metricGroups = useMemo(() => {
    const grouped = new Map<string, HealthMetricEntry[]>()
    for (const m of [...metrics].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) {
      const arr = grouped.get(m.type) ?? []
      arr.push(m)
      grouped.set(m.type, arr)
    }
    return Array.from(grouped, ([type, entries]) => {
      const latest = entries[entries.length - 1]
      const sparkVals = entries.length >= 2
        ? entries.map((e) => {
            const v = e.value.includes('/') ? parseFloat(e.value.split('/')[0]) : parseFloat(e.value)
            return isNaN(v) ? 0 : v
          })
        : null
      return { type, latest, entries, sparkVals }
    })
  }, [metrics])

  // ── Not found ──
  if (!patient) {
    return (
      <div className="space-y-6">
        <Link href="/doctor/schedule" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to schedule
        </Link>
        <EmptyState title="Patient not found" description="This patient ID doesn\u2019t match any record." />
      </div>
    )
  }

  // ── Handlers ──

  function openHealthEdit() {
    if (!healthInfo) return
    setHealthForm({ ...healthInfo })
    setEditingHealth(true)
  }

  function saveHealthInfo() {
    if (!healthForm) return
    setHealthInfo({ ...healthForm })
    setEditingHealth(false)
    toast.success('Health profile updated.')
  }

  function addMetric() {
    if (!newMetricValue.trim()) return
    const meta = METRIC_LABELS[newMetricType]
    const entry: HealthMetricEntry = {
      id: `HM-NEW-${metricIdCounter++}`,
      patientId,
      type: newMetricType,
      label: meta.label,
      value: newMetricValue.trim(),
      unit: meta.unit,
      recordedAt: `${TODAY}T${new Date().toISOString().slice(11)}`,
      recordedById: doctor.id,
      recordedByName: doctor.name,
      recordedByRole: 'doctor',
    }
    setMetrics((prev) => [...prev, entry])
    setNewMetricValue('')
    setAddingMetric(false)
    toast.success(`${meta.label} recorded.`)
  }

  function updateMedicine(idx: number, key: keyof MedicineRow, value: string) {
    setMedicines((prev) => prev.map((m, i) => (i === idx ? { ...m, [key]: value } : m)))
  }

  function completeConsultation() {
    if (!patient || !diagnosis.trim()) {
      toast.error('Diagnosis is required.')
      return
    }
    const rx: Prescription = {
      id: `RX-NEW-${Date.now()}`,
      patientId,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: `${TODAY}T${new Date().toISOString().slice(11)}`,
      chiefComplaint: chiefComplaint.trim(),
      diagnosis: diagnosis.trim(),
      medicines: medicines
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          dose: m.dose.trim(),
          frequency: m.frequency.trim(),
          duration: m.duration.trim(),
          ...(m.instructions.trim() && { instructions: m.instructions.trim() }),
        })),
      testsSuggested: testsSuggested.split(',').map((s) => s.trim()).filter(Boolean),
      todos: todos.split('\n').map((s) => s.trim()).filter(Boolean),
      notTodos: notTodos.split('\n').map((s) => s.trim()).filter(Boolean),
      ...(followUpDate && { followUpDate: `${followUpDate}T00:00:00Z` }),
      ...(notes.trim() && { notes: notes.trim() }),
    }
    setLocalPrescriptions((prev) => [rx, ...prev])
    // Reset form
    setChiefComplaint('')
    setDiagnosis('')
    setMedicines([{ ...emptyMedicine }])
    setTestsSuggested('')
    setTodos('')
    setNotTodos('')
    setFollowUpDate('')
    setNotes('')
    toast.success('Consultation saved \u2014 PDF generation coming next.')
  }

  // ── Render ──

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      {/* Back link */}
      <motion.div variants={fadeUp}>
        <Link href="/doctor/schedule" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to schedule
        </Link>
      </motion.div>

      {/* ── Patient header ── */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-start gap-4">
            <UserAvatar name={patient.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-semibold text-ink">{patient.name}</h1>
              <p className="text-sm text-ink-faint">
                {patient.id} &middot; {calculateAge(patient.dob)} yrs &middot;{' '}
                <span className="capitalize">{patient.gender}</span>
                {healthInfo?.bloodGroup && <> &middot; {healthInfo.bloodGroup}</>}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {patient.phone} &middot; {patient.email}
                {patient.assignedDoctorId && (
                  <> &middot; Assigned: {staff.find((s) => s.id === patient.assignedDoctorId)?.name ?? '\u2014'}</>
                )}
              </p>
            </div>
          </div>

          {/* Clinical chips */}
          {healthInfo && (healthInfo.allergies.length > 0 || healthInfo.chronicConditions.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {healthInfo.allergies.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger"
                >
                  <AlertTriangle className="h-3 w-3" /> {a}
                </span>
              ))}
              {healthInfo.chronicConditions.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn"
                >
                  <Heart className="h-3 w-3" /> {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="health">
          <TabsList variant="line">
            <TabsTrigger value="health">Health Info</TabsTrigger>
            <TabsTrigger value="history">Visit History</TabsTrigger>
            <TabsTrigger value="consultation">Consultation</TabsTrigger>
          </TabsList>

          {/* ═══ HEALTH INFO TAB ═══ */}
          <TabsContent value="health" className="mt-5 space-y-5">
            {/* Static health info */}
            <SectionCard
              title="Health Profile"
              actions={
                healthInfo && (
                  <Button variant="ghost" size="sm" className="text-xs text-brand" onClick={openHealthEdit}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                )
              }
            >
              {healthInfo ? (
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <InfoCell label="Blood Group" value={healthInfo.bloodGroup ?? '\u2014'} />
                  <InfoCell
                    label="BMI"
                    value={bmi ? `${bmi.value}` : '\u2014'}
                    extra={bmi ? <span className={cn('text-xs capitalize', BMI_COLORS[bmi.category])}>({bmi.category})</span> : null}
                  />
                  <InfoCell label="Height" value={healthInfo.heightCm ? `${healthInfo.heightCm} cm` : '\u2014'} />
                  <InfoCell label="Weight" value={healthInfo.weightKg ? `${healthInfo.weightKg} kg` : '\u2014'} />
                  <InfoCell label="Smoking" value={healthInfo.smoking} />
                  <InfoCell label="Alcohol" value={healthInfo.alcohol} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <InfoCell
                      label="Current Medications"
                      value={healthInfo.currentMedications.length ? healthInfo.currentMedications.join(', ') : 'None'}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-faint">No health profile on file.</p>
              )}
            </SectionCard>

            {/* Dynamic metrics */}
            <SectionCard
              title="Health Metrics"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-brand"
                  onClick={() => setAddingMetric(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add metric
                </Button>
              }
            >
              {metricGroups.length === 0 ? (
                <p className="text-sm text-ink-faint">No metrics recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {metricGroups.map(({ type, latest, sparkVals }) => (
                    <div key={type} className="flex items-center justify-between gap-3 rounded-lg border border-line-soft px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {latest.label}{' '}
                          <span className="font-normal text-brand-deep">
                            {latest.value} {latest.unit}
                          </span>
                        </p>
                        <p className="text-[11px] text-ink-faint">
                          {formatDateTime(latest.recordedAt)} &middot; {latest.recordedByName}
                        </p>
                      </div>
                      {sparkVals && <Sparkline values={sparkVals} width={80} height={24} />}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Add metric SlideOver */}
            <SlideOver
              open={addingMetric}
              onOpenChange={setAddingMetric}
              title="Record Metric"
              footer={
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddingMetric(false)}>Cancel</Button>
                  <Button className="bg-brand-gradient text-white border-none" onClick={addMetric}>Save</Button>
                </div>
              }
            >
              <div className="space-y-4">
                <Field label="Metric type">
                  <Select value={newMetricType} onChange={(e) => setNewMetricType(e.target.value as HealthMetricType)}>
                    {Object.entries(METRIC_LABELS).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.label} ({meta.unit})</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Value" htmlFor="m-val">
                  <Input
                    id="m-val"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder={METRIC_LABELS[newMetricType].unit === 'mmHg' ? '120/80' : '0'}
                  />
                </Field>
                <p className="text-xs text-ink-faint">
                  Recorded by {doctor.name} &middot; {formatDate(`${TODAY}T00:00:00Z`)}
                </p>
              </div>
            </SlideOver>

            {/* Edit health info SlideOver */}
            <SlideOver
              open={editingHealth}
              onOpenChange={setEditingHealth}
              title="Edit Health Profile"
              footer={
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingHealth(false)}>Cancel</Button>
                  <Button className="bg-brand-gradient text-white border-none" onClick={saveHealthInfo}>Save</Button>
                </div>
              }
            >
              {healthForm && (
                <div className="space-y-4">
                  <Field label="Blood Group" htmlFor="h-bg">
                    <Input id="h-bg" value={healthForm.bloodGroup ?? ''} onChange={(e) => setHealthForm({ ...healthForm, bloodGroup: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Height (cm)" htmlFor="h-ht">
                      <Input id="h-ht" type="number" value={healthForm.heightCm ?? ''} onChange={(e) => setHealthForm({ ...healthForm, heightCm: Number(e.target.value) || undefined })} />
                    </Field>
                    <Field label="Weight (kg)" htmlFor="h-wt">
                      <Input id="h-wt" type="number" value={healthForm.weightKg ?? ''} onChange={(e) => setHealthForm({ ...healthForm, weightKg: Number(e.target.value) || undefined })} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Smoking">
                      <Select value={healthForm.smoking} onChange={(e) => setHealthForm({ ...healthForm, smoking: e.target.value as StaticHealthInfo['smoking'] })}>
                        <option value="never">Never</option>
                        <option value="former">Former</option>
                        <option value="current">Current</option>
                        <option value="unknown">Unknown</option>
                      </Select>
                    </Field>
                    <Field label="Alcohol">
                      <Select value={healthForm.alcohol} onChange={(e) => setHealthForm({ ...healthForm, alcohol: e.target.value as StaticHealthInfo['alcohol'] })}>
                        <option value="never">Never</option>
                        <option value="occasional">Occasional</option>
                        <option value="regular">Regular</option>
                        <option value="unknown">Unknown</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Allergies (comma-separated)" htmlFor="h-allergy">
                    <Input
                      id="h-allergy"
                      value={healthForm.allergies.join(', ')}
                      onChange={(e) => setHealthForm({ ...healthForm, allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </Field>
                  <Field label="Chronic Conditions (comma-separated)" htmlFor="h-cond">
                    <Input
                      id="h-cond"
                      value={healthForm.chronicConditions.join(', ')}
                      onChange={(e) => setHealthForm({ ...healthForm, chronicConditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </Field>
                  <Field label="Current Medications (comma-separated)" htmlFor="h-meds">
                    <Input
                      id="h-meds"
                      value={healthForm.currentMedications.join(', ')}
                      onChange={(e) => setHealthForm({ ...healthForm, currentMedications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </Field>
                </div>
              )}
            </SlideOver>
          </TabsContent>

          {/* ═══ VISIT HISTORY TAB ═══ */}
          <TabsContent value="history" className="mt-5">
            {localPrescriptions.length === 0 ? (
              <EmptyState title="No visit history" description="This patient has no consultation records yet." />
            ) : (
              <div className="space-y-3">
                {localPrescriptions.map((rx) => {
                  const isOpen = expandedRx === rx.id
                  return (
                    <div key={rx.id} className="rounded-xl border border-line bg-white">
                      <button
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
                        onClick={() => setExpandedRx(isOpen ? null : rx.id)}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <Pill className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">{rx.diagnosis}</p>
                          <p className="text-xs text-ink-faint">
                            {formatDate(rx.date)} &middot; {rx.doctorName} &middot; {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-ink-faint" /> : <ChevronDown className="h-4 w-4 text-ink-faint" />}
                      </button>

                      {isOpen && (
                        <div className="border-t border-line-soft px-5 py-4 space-y-3 text-sm">
                          {rx.chiefComplaint && (
                            <div><span className="text-ink-faint">Chief complaint:</span> <span className="text-ink">{rx.chiefComplaint}</span></div>
                          )}
                          {rx.medicines.length > 0 && (
                            <div>
                              <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">Medicines</span>
                              <div className="mt-1 space-y-1.5">
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
                              <ul className="mt-0.5 list-inside list-disc text-ink">
                                {rx.todos.map((t, i) => <li key={i}>{t}</li>)}
                              </ul>
                            </div>
                          )}
                          {rx.notTodos.length > 0 && (
                            <div>
                              <span className="text-ink-faint">Avoid:</span>
                              <ul className="mt-0.5 list-inside list-disc text-danger">
                                {rx.notTodos.map((t, i) => <li key={i}>{t}</li>)}
                              </ul>
                            </div>
                          )}
                          {rx.followUpDate && (
                            <div><span className="text-ink-faint">Follow-up:</span> <span className="text-ink">{formatDate(rx.followUpDate)}</span></div>
                          )}
                          {rx.notes && (
                            <div><span className="text-ink-faint">Notes:</span> <span className="text-ink">{rx.notes}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══ CONSULTATION TAB ═══ */}
          <TabsContent value="consultation" className="mt-5 space-y-5">
            <SectionCard title="Chief Complaint &amp; Diagnosis">
              <div className="space-y-4">
                <Field label="Chief complaint" htmlFor="c-cc">
                  <Textarea id="c-cc" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} placeholder="Patient\u2019s primary complaint\u2026" />
                </Field>
                <Field label="Diagnosis *" htmlFor="c-dx">
                  <Textarea id="c-dx" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Clinical diagnosis\u2026" />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Prescription"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-brand"
                  onClick={() => setMedicines((prev) => [...prev, { ...emptyMedicine }])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add medicine
                </Button>
              }
            >
              <div className="space-y-4">
                {medicines.map((m, idx) => (
                  <div key={idx} className="rounded-lg border border-line-soft p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-faint">Medicine {idx + 1}</span>
                      {medicines.length > 1 && (
                        <button
                          className="rounded p-1 text-ink-faint hover:bg-danger/10 hover:text-danger"
                          onClick={() => setMedicines((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="Medicine name" value={m.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} />
                      <Input placeholder="Dose (e.g. 500mg)" value={m.dose} onChange={(e) => updateMedicine(idx, 'dose', e.target.value)} />
                      <Input placeholder="Frequency (e.g. Twice daily)" value={m.frequency} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} />
                      <Input placeholder="Duration (e.g. 30 days)" value={m.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} />
                      <div className="sm:col-span-2">
                        <Input placeholder="Instructions (optional)" value={m.instructions} onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Additional">
              <div className="space-y-4">
                <Field label="Tests suggested (comma-separated)" htmlFor="c-tests">
                  <Input id="c-tests" value={testsSuggested} onChange={(e) => setTestsSuggested(e.target.value)} placeholder="HbA1c, Lipid panel, CBC\u2026" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="To-dos (one per line)" htmlFor="c-todos">
                    <Textarea id="c-todos" value={todos} onChange={(e) => setTodos(e.target.value)} placeholder="Walk 30 min daily&#10;Monitor BP at home" />
                  </Field>
                  <Field label="Avoid / Don\u2019ts (one per line)" htmlFor="c-nots">
                    <Textarea id="c-nots" value={notTodos} onChange={(e) => setNotTodos(e.target.value)} placeholder="Do not skip medication&#10;Avoid excess salt" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Follow-up date" htmlFor="c-fu">
                    <Input id="c-fu" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </Field>
                </div>
                <Field label="Doctor\u2019s notes" htmlFor="c-notes">
                  <Textarea id="c-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional observations\u2026" />
                </Field>
              </div>
            </SectionCard>

            <div className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4">
              <div className="flex items-start gap-1.5 text-xs text-ink-soft">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                PDF prescription generation is available in the next update.
              </div>
              <Button
                className="bg-brand-gradient text-white border-none"
                onClick={completeConsultation}
              >
                <Check className="mr-1.5 h-4 w-4" /> Complete consultation
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

// ── Tiny helpers ──

function InfoCell({
  label,
  value,
  extra,
}: {
  label: string
  value: string
  extra?: React.ReactNode
}) {
  return (
    <div>
      <span className="text-xs text-ink-faint">{label}</span>
      <p className="mt-0.5 font-medium capitalize text-ink">
        {value} {extra}
      </p>
    </div>
  )
}
