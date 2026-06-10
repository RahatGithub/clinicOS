'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  Plus,
  Trash2,
  Check,
  Download,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, SectionCard, SlideOver, StatusBadge } from '@/components/shared'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { plans } from '@/lib/data'
import { formatCurrency, cn } from '@/lib/utils'

// ── Helpers ──

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

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
        className,
      )}
      rows={3}
      {...props}
    />
  )
}

const fadeTab = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } }

// ── Default data ──

const DEFAULT_GENERAL = {
  name: 'Northgate Diagnostic Center',
  tagline: 'Your trusted partner in diagnostics and preventive health.',
  email: 'admin@northgate.health',
  phone: '+1 (312) 555-0100',
  street: '2400 N Lincoln Ave',
  city: 'Chicago',
  state: 'IL',
  country: 'USA',
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const DEFAULT_HOURS: { day: string; open: boolean; start: string; end: string }[] = DAYS.map((d) => ({
  day: d,
  open: d !== 'Sunday',
  start: '09:00',
  end: d === 'Saturday' ? '13:00' : '18:00',
}))

const DEFAULT_SPECIALTIES = ['General Medicine', 'Orthopedics', 'Ophthalmology', 'ENT', 'Cardiology', 'Dermatology']

const DEFAULT_HOLIDAYS = [
  { date: '2026-07-04', reason: 'Independence Day' },
  { date: '2026-11-26', reason: 'Thanksgiving' },
  { date: '2026-12-25', reason: 'Christmas Day' },
]

const PRESET_COVERS = [
  'linear-gradient(105deg, #F2700F 0%, #F89B1E 50%, #FCC23A 100%)',
  'linear-gradient(105deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
  'linear-gradient(105deg, #059669 0%, #10B981 50%, #34D399 100%)',
]

const COLOR_SWATCHES = ['#F08A1D', '#2563EB', '#059669', '#7C3AED', '#E11D48', '#0891B2']

const SAMPLE_INVOICES = [
  { id: 'INV-2026-06', date: 'Jun 01, 2026', amount: 149, status: 'paid' as const },
  { id: 'INV-2026-05', date: 'May 01, 2026', amount: 149, status: 'paid' as const },
  { id: 'INV-2026-04', date: 'Apr 01, 2026', amount: 149, status: 'paid' as const },
  { id: 'INV-2026-03', date: 'Mar 01, 2026', amount: 149, status: 'paid' as const },
]

// ── Page ──

export default function CenterSettingsPage() {
  // General
  const [general, setGeneral] = useState({ ...DEFAULT_GENERAL })
  const updateGeneral = useCallback(
    <K extends keyof typeof DEFAULT_GENERAL>(key: K, value: string) =>
      setGeneral((prev) => ({ ...prev, [key]: value })),
    [],
  )

  // Branding
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverGradient, setCoverGradient] = useState(PRESET_COVERS[0])
  const [primaryColor, setPrimaryColor] = useState('#F08A1D')

  // Working hours
  const [hours, setHours] = useState(() => DEFAULT_HOURS.map((h) => ({ ...h })))

  // Appointments
  const [slotDuration, setSlotDuration] = useState(30)
  const [sameDayBooking, setSameDayBooking] = useState(true)
  const [sendReminders, setSendReminders] = useState(true)

  // Specialties
  const [specialties, setSpecialties] = useState([...DEFAULT_SPECIALTIES])
  const [newSpecialty, setNewSpecialty] = useState('')

  // Holidays
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS.map((h) => ({ ...h })))
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayReason, setNewHolidayReason] = useState('')

  // Billing
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // ── Handlers ──

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setCoverPreview(URL.createObjectURL(file))
      setCoverGradient('')
    }
  }

  function addSpecialty() {
    const val = newSpecialty.trim()
    if (!val || specialties.includes(val)) return
    setSpecialties((prev) => [...prev, val])
    setNewSpecialty('')
  }

  function addHoliday() {
    if (!newHolidayDate || !newHolidayReason.trim()) return
    setHolidays((prev) => [...prev, { date: newHolidayDate, reason: newHolidayReason.trim() }])
    setNewHolidayDate('')
    setNewHolidayReason('')
  }

  function save(section: string) {
    toast.success(`${section} saved.`)
  }

  // Resolved cover background for branding preview
  const resolvedCover = coverPreview ? `url(${coverPreview})` : coverGradient

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Customize your center\u2019s profile, hours, and branding." />

      <Tabs defaultValue="general">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList variant="line" className="w-max">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="hours">Working Hours</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="specialties">Specialties</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
        </div>

        {/* ── GENERAL ── */}
        <TabsContent value="general" className="mt-5">
          <motion.div {...fadeTab}>
            <SectionCard title="Center Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Center name" htmlFor="g-name">
                  <Input id="g-name" value={general.name} onChange={(e) => updateGeneral('name', e.target.value)} />
                </Field>
                <Field label="Contact email" htmlFor="g-email">
                  <Input id="g-email" type="email" value={general.email} onChange={(e) => updateGeneral('email', e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Tagline / About" htmlFor="g-tag">
                    <Textarea id="g-tag" value={general.tagline} onChange={(e) => updateGeneral('tagline', e.target.value)} />
                  </Field>
                </div>
                <Field label="Phone" htmlFor="g-phone">
                  <Input id="g-phone" value={general.phone} onChange={(e) => updateGeneral('phone', e.target.value)} />
                </Field>
                <Field label="Street" htmlFor="g-street">
                  <Input id="g-street" value={general.street} onChange={(e) => updateGeneral('street', e.target.value)} />
                </Field>
                <Field label="City" htmlFor="g-city">
                  <Input id="g-city" value={general.city} onChange={(e) => updateGeneral('city', e.target.value)} />
                </Field>
                <Field label="State" htmlFor="g-state">
                  <Input id="g-state" value={general.state} onChange={(e) => updateGeneral('state', e.target.value)} />
                </Field>
                <Field label="Country" htmlFor="g-country">
                  <Input id="g-country" value={general.country} onChange={(e) => updateGeneral('country', e.target.value)} />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <Button className="bg-brand-gradient text-white border-none" onClick={() => save('General settings')}>
                  Save changes
                </Button>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* ── BRANDING ── */}
        <TabsContent value="branding" className="mt-5">
          <motion.div {...fadeTab} className="space-y-5">
            <SectionCard title="Logo">
              <div className="flex items-center gap-4">
                {/* Preview */}
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-gradient text-2xl font-bold text-white">
                    N
                  </div>
                )}
                <div>
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" /> Upload logo
                  </label>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                  <p className="mt-1 text-[11px] text-ink-faint">PNG or JPG, recommended 256&times;256 px</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cover Image">
              <div className="space-y-3">
                {/* Preview */}
                <div
                  className="h-28 w-full rounded-xl bg-cover bg-center"
                  style={{ background: resolvedCover, backgroundSize: 'cover' }}
                />
                {/* Preset gradients */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-faint">Quick picks:</span>
                  {PRESET_COVERS.map((g) => (
                    <button
                      key={g}
                      className={cn(
                        'h-8 w-12 rounded-md border-2 transition-all',
                        coverGradient === g && !coverPreview ? 'border-ink ring-2 ring-brand/30' : 'border-transparent',
                      )}
                      style={{ background: g }}
                      onClick={() => { setCoverGradient(g); setCoverPreview(null) }}
                    />
                  ))}
                </div>
                <div>
                  <label
                    htmlFor="cover-upload"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" /> Upload cover image
                  </label>
                  <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Primary Color">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <span className="font-mono text-sm text-ink-soft">{primaryColor}</span>
                <div className="flex gap-1.5">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      className={cn(
                        'h-6 w-6 rounded-full border-2 transition-all',
                        primaryColor === c ? 'border-ink scale-110' : 'border-transparent',
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setPrimaryColor(c)}
                    />
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Live preview card */}
            <SectionCard title="Live Preview">
              <div className="overflow-hidden rounded-xl" style={{ background: resolvedCover, backgroundSize: 'cover' }}>
                <div className="relative px-5 py-6" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' }}>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        N
                      </div>
                    )}
                    <div>
                      <p className="font-display text-lg font-bold text-white">{general.name}</p>
                      <p className="text-sm text-white/80">Jun 10, 2026 &middot; Good morning</p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Branding')}>
                Save changes
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── WORKING HOURS ── */}
        <TabsContent value="hours" className="mt-5">
          <motion.div {...fadeTab}>
            <SectionCard title="Working Hours">
              <div className="space-y-3">
                {hours.map((h, i) => (
                  <div key={h.day} className="flex flex-wrap items-center gap-3 rounded-lg border border-line-soft px-4 py-2.5">
                    <span className="w-24 text-sm font-medium text-ink">{h.day}</span>

                    {/* Toggle */}
                    <button
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        h.open ? 'bg-ok' : 'bg-ink-faint/30',
                      )}
                      onClick={() => setHours((prev) => prev.map((x, j) => (j === i ? { ...x, open: !x.open } : x)))}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                          h.open ? 'translate-x-[18px]' : 'translate-x-[3px]',
                        )}
                      />
                    </button>
                    <span className={cn('text-xs w-12', h.open ? 'text-ok' : 'text-ink-faint')}>
                      {h.open ? 'Open' : 'Closed'}
                    </span>

                    {h.open && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.start}
                          onChange={(e) =>
                            setHours((prev) => prev.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))
                          }
                          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                        />
                        <span className="text-xs text-ink-faint">to</span>
                        <input
                          type="time"
                          value={h.end}
                          onChange={(e) =>
                            setHours((prev) => prev.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))
                          }
                          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Working hours')}>
                  Save changes
                </Button>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* ── APPOINTMENTS ── */}
        <TabsContent value="appointments" className="mt-5">
          <motion.div {...fadeTab}>
            <SectionCard title="Appointment Settings">
              <div className="space-y-5">
                <Field label="Default slot duration">
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map((d) => (
                      <button
                        key={d}
                        className={cn(
                          'rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors',
                          slotDuration === d
                            ? 'border-brand bg-brand/10 text-brand-deep'
                            : 'border-input text-ink-soft hover:border-ink-faint',
                        )}
                        onClick={() => setSlotDuration(d)}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </Field>

                <Separator />

                <ToggleRow
                  label="Allow same-day booking"
                  description="Patients or staff can book appointments for today."
                  checked={sameDayBooking}
                  onToggle={() => setSameDayBooking((v) => !v)}
                />
                <ToggleRow
                  label="Send appointment reminders"
                  description="Automated email/SMS reminders 24h before the appointment."
                  checked={sendReminders}
                  onToggle={() => setSendReminders((v) => !v)}
                />
              </div>
              <div className="mt-5 flex justify-end">
                <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Appointment settings')}>
                  Save changes
                </Button>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* ── SPECIALTIES ── */}
        <TabsContent value="specialties" className="mt-5">
          <motion.div {...fadeTab}>
            <SectionCard title="Specialties / Departments">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {specialties.map((s) => (
                    <motion.span
                      key={s}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-3 py-1 text-sm text-ink"
                    >
                      {s}
                      <button
                        className="ml-0.5 rounded-full p-0.5 text-ink-faint hover:bg-danger/10 hover:text-danger"
                        onClick={() => setSpecialties((prev) => prev.filter((x) => x !== s))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="New specialty\u2026"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSpecialty()}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={addSpecialty}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              <div className="mt-5 flex justify-end">
                <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Specialties')}>
                  Save changes
                </Button>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* ── HOLIDAYS ── */}
        <TabsContent value="holidays" className="mt-5">
          <motion.div {...fadeTab}>
            <SectionCard title="Center Holidays / Closure Dates">
              {holidays.length === 0 ? (
                <p className="text-sm text-ink-faint">No holidays scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {holidays
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((h, i) => (
                      <div key={`${h.date}-${i}`} className="flex items-center gap-3 rounded-lg border border-line-soft px-4 py-2.5">
                        <span className="font-mono text-sm text-ink-soft">{h.date}</span>
                        <span className="flex-1 text-sm text-ink">{h.reason}</span>
                        <button
                          className="rounded p-1 text-ink-faint hover:bg-danger/10 hover:text-danger"
                          onClick={() => setHolidays((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-auto"
                />
                <Input
                  placeholder="Reason\u2026"
                  value={newHolidayReason}
                  onChange={(e) => setNewHolidayReason(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHoliday()}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={addHoliday}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              <div className="mt-5 flex justify-end">
                <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Holidays')}>
                  Save changes
                </Button>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* ── BILLING ── */}
        <TabsContent value="billing" className="mt-5">
          <motion.div {...fadeTab} className="space-y-5">
            {/* Current plan */}
            <SectionCard title="Current Plan">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-display font-semibold text-ink">
                    Professional
                    <span className="ml-2 text-sm font-normal text-ink-soft">
                      {formatCurrency(149, 'USD')}/month
                    </span>
                  </p>
                  <p className="text-sm text-ink-faint">
                    Up to 50 staff &middot; 5,000 patients &middot; Custom branding
                  </p>
                </div>
                <Button className="bg-brand-gradient text-white border-none" onClick={() => setUpgradeOpen(true)}>
                  Upgrade plan <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </SectionCard>

            {/* Payment method */}
            <SectionCard title="Payment Method">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-14 items-center justify-center rounded-md bg-blue-50">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Visa ending in 4242</p>
                  <p className="text-xs text-ink-faint">Expires 08/2028 &middot; Next billing: Jul 01, 2026</p>
                </div>
              </div>
            </SectionCard>

            {/* Billing history */}
            <SectionCard title="Billing History" noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-soft bg-line-soft/50">
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Invoice</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Date</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Amount</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Status</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_INVOICES.map((inv) => (
                      <tr key={inv.id} className="border-b border-line-soft last:border-0">
                        <td className="px-5 py-2.5 font-mono text-xs text-ink">{inv.id}</td>
                        <td className="px-5 py-2.5 text-ink-soft">{inv.date}</td>
                        <td className="px-5 py-2.5 font-medium text-ink">{formatCurrency(inv.amount, 'USD')}</td>
                        <td className="px-5 py-2.5"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-2.5">
                          <button
                            className="p-1 text-ink-faint hover:text-ink"
                            onClick={() => toast.info(`Downloading ${inv.id}\u2026`)}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Upgrade plan SlideOver */}
      <SlideOver
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="Upgrade Plan"
        description="Choose the plan that fits your center."
      >
        <div className="space-y-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === 'PLAN-PRO'
            return (
              <div
                key={plan.id}
                className={cn(
                  'rounded-xl border p-4',
                  isCurrent ? 'border-brand bg-brand/5' : 'border-line',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {plan.name}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand-deep">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {formatCurrency(plan.priceMonthly, 'USD')}/mo &middot;{' '}
                      {plan.userLimit === 'unlimited' ? 'Unlimited' : `Up to ${plan.userLimit}`} staff
                    </p>
                  </div>
                  <Button
                    variant={isCurrent ? 'outline' : 'default'}
                    size="sm"
                    className={isCurrent ? '' : 'bg-brand-gradient text-white border-none'}
                    disabled={isCurrent}
                    onClick={() => {
                      toast.success(`Switched to ${plan.name} plan.`)
                      setUpgradeOpen(false)
                    }}
                  >
                    {isCurrent ? 'Current' : 'Switch'}
                  </Button>
                </div>
                <ul className="mt-3 space-y-1">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <Check className="h-3 w-3 text-ok" /> {f}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-ink-faint">+{plan.features.length - 5} more features</li>
                  )}
                </ul>
              </div>
            )
          })}
          <p className="text-[11px] text-ink-faint">
            Plan changes take effect at the next billing cycle. Charges are prorated. Powered by Stripe.
          </p>
        </div>
      </SlideOver>
    </div>
  )
}

// ── Toggle row helper ──

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-faint">{description}</p>
      </div>
      <button
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-ok' : 'bg-ink-faint/30',
        )}
        onClick={onToggle}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  )
}
