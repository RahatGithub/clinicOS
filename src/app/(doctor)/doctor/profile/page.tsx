'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Upload, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { staff } from '@/lib/data'
import { PageHeader, SectionCard, UserAvatar } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Constants ──

const SPECIALTIES = [
  'General Medicine',
  'Orthopedics',
  'Ophthalmology',
  'ENT',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

function resolveDoctor(userId: string) {
  return (
    staff.find((s) => s.id === userId && s.role === 'doctor') ??
    staff.find((s) => s.id === 'STF-10001')!
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

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Component ──

export default function DoctorProfilePage() {
  const { user } = useAuth()
  const doctor = useMemo(() => resolveDoctor(user?.id ?? ''), [user])

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [available, setAvailable] = useState(true)

  // Personal
  const [personal, setPersonal] = useState({
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    dob: doctor.dob.split('T')[0],
    gender: doctor.gender,
    nationalId: doctor.nationalId,
  })

  // Professional
  const [professional, setProfessional] = useState({
    specialty: doctor.specialty ?? 'General Medicine',
    qualifications: doctor.qualifications ?? '',
    experience: '12',
    bio: 'Board-certified physician with over a decade of experience in internal medicine, diabetes management, and preventive health. Committed to evidence-based, patient-centered care.',
  })

  // Availability
  const [schedule, setSchedule] = useState(() =>
    DAYS.map((d) => ({
      day: d,
      available: d !== 'Sunday',
      start: '09:00',
      end: d === 'Saturday' ? '13:00' : '17:00',
    })),
  )

  // Security
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  function save(section: string) {
    toast.success(`${section} updated.`)
  }

  function changePassword() {
    if (!currentPw || !newPw) {
      toast.error('Please fill in all password fields.')
      return
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match.')
      return
    }
    if (newPw.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    toast.success('Password changed.')
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader title="My Profile" description="Manage your professional profile and account." />
      </motion.div>

      {/* Profile header card */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <UserAvatar name={doctor.name} size="lg" className="h-20 w-20 text-2xl" />
              )}
              <label
                htmlFor="avatar-file"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand-gradient text-white hover:brightness-110"
              >
                <Upload className="h-3.5 w-3.5" />
              </label>
              <input
                id="avatar-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setAvatarPreview(URL.createObjectURL(f))
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-ink">{personal.name}</h2>
              <p className="text-sm text-ink-soft">{professional.specialty} &middot; {doctor.id}</p>
            </div>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                available ? 'bg-ok/10 text-ok' : 'bg-ink-faint/10 text-ink-faint',
              )}
              onClick={() => { setAvailable((v) => !v); toast.success(available ? 'Marked as unavailable.' : 'Marked as available.') }}
            >
              <span className={cn('h-2 w-2 rounded-full', available ? 'bg-ok' : 'bg-ink-faint')} />
              {available ? 'Available' : 'Unavailable'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Personal info */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Personal Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="p-name">
              <Input id="p-name" value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="p-email">
              <Input id="p-email" type="email" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} />
            </Field>
            <Field label="Phone" htmlFor="p-phone">
              <Input id="p-phone" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} />
            </Field>
            <Field label="Date of birth" htmlFor="p-dob">
              <Input id="p-dob" type="date" value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={personal.gender} onChange={(e) => setPersonal({ ...personal, gender: e.target.value as 'male' | 'female' | 'other' })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="National ID" htmlFor="p-nid">
              <Input id="p-nid" value={personal.nationalId} onChange={(e) => setPersonal({ ...personal, nationalId: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Personal info')}>Save changes</Button>
          </div>
        </SectionCard>
      </motion.div>

      {/* Professional info */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Professional Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Specialty">
              <Select value={professional.specialty} onChange={(e) => setProfessional({ ...professional, specialty: e.target.value })}>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Years of experience" htmlFor="pr-exp">
              <Input id="pr-exp" type="number" value={professional.experience} onChange={(e) => setProfessional({ ...professional, experience: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Qualifications" htmlFor="pr-qual">
                <Input id="pr-qual" value={professional.qualifications} onChange={(e) => setProfessional({ ...professional, qualifications: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Bio" htmlFor="pr-bio">
                <Textarea id="pr-bio" value={professional.bio} onChange={(e) => setProfessional({ ...professional, bio: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Professional info')}>Save changes</Button>
          </div>
        </SectionCard>
      </motion.div>

      {/* Availability */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Availability Schedule">
          <div className="space-y-3">
            {schedule.map((s, i) => (
              <div key={s.day} className="flex flex-wrap items-center gap-3 rounded-lg border border-line-soft px-4 py-2.5">
                <span className="w-24 text-sm font-medium text-ink">{s.day}</span>
                <button
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    s.available ? 'bg-ok' : 'bg-ink-faint/30',
                  )}
                  onClick={() => setSchedule((prev) => prev.map((x, j) => (j === i ? { ...x, available: !x.available } : x)))}
                >
                  <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform', s.available ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
                </button>
                <span className={cn('w-12 text-xs', s.available ? 'text-ok' : 'text-ink-faint')}>
                  {s.available ? 'Available' : 'Off'}
                </span>
                {s.available && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={s.start}
                      onChange={(e) => setSchedule((prev) => prev.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                    />
                    <span className="text-xs text-ink-faint">to</span>
                    <input
                      type="time"
                      value={s.end}
                      onChange={(e) => setSchedule((prev) => prev.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button className="bg-brand-gradient text-white border-none" onClick={() => save('Availability')}>Save changes</Button>
          </div>
        </SectionCard>
      </motion.div>

      {/* Security */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Security">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Lock className="h-4 w-4" /> Change your password
            </div>
            <Field label="Current password" htmlFor="pw-cur">
              <Input id="pw-cur" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </Field>
            <Field label="New password" htmlFor="pw-new">
              <Input id="pw-new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </Field>
            <Field label="Confirm new password" htmlFor="pw-conf">
              <Input id="pw-conf" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </Field>
            <Button className="bg-brand-gradient text-white border-none" onClick={changePassword}>
              Change password
            </Button>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}
