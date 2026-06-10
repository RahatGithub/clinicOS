'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { SlideOver, UserAvatar } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { calculateAge, cn } from '@/lib/utils'
import type { Patient, StaticHealthInfo } from '@/types'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>
}

function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select className={cn('h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50', className)} {...props}>
      {children}
    </select>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{children}</p>
}

let patCounter = 80000

interface PatientRegistrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (patient: Patient, healthInfo?: StaticHealthInfo) => void
}

interface FormState {
  name: string
  dob: string
  gender: 'male' | 'female' | 'other'
  email: string
  phone: string
  nationalId: string
  insuranceProvider: string
  policyNumber: string
  healthId: string
  street: string
  city: string
  state: string
  country: string
  ecName: string
  ecRelationship: string
  ecPhone: string
  bloodGroup: string
  allergies: string
  conditions: string
}

const empty: FormState = {
  name: '', dob: '', gender: 'male',
  email: '', phone: '',
  nationalId: '', insuranceProvider: '', policyNumber: '', healthId: '',
  street: '', city: '', state: '', country: '',
  ecName: '', ecRelationship: '', ecPhone: '',
  bloodGroup: '', allergies: '', conditions: '',
}

export function PatientRegistration({ open, onOpenChange, onCreated }: PatientRegistrationProps) {
  const [form, setForm] = useState<FormState>({ ...empty })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function reset() {
    setForm({ ...empty })
    setAvatarPreview(null)
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('Patient name is required.')
      return
    }

    const id = `PAT-${patCounter++}`
    const patient: Patient = {
      id,
      name: form.name.trim(),
      dob: form.dob ? `${form.dob}T00:00:00Z` : '1990-01-01T00:00:00Z',
      gender: form.gender,
      email: form.email.trim(),
      phone: form.phone.trim(),
      registeredDate: '2026-06-10T00:00:00Z',
      ...(form.nationalId.trim() && { nationalId: form.nationalId.trim() }),
      ...(form.insuranceProvider.trim() && {
        insurance: {
          provider: form.insuranceProvider.trim(),
          policyNumber: form.policyNumber.trim(),
          healthId: form.healthId.trim(),
        },
      }),
      ...(form.street.trim() && {
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim() || 'USA',
        },
      }),
      ...(form.ecName.trim() && {
        emergencyContact: {
          name: form.ecName.trim(),
          relationship: form.ecRelationship.trim(),
          phone: form.ecPhone.trim(),
        },
      }),
    }

    let healthInfo: StaticHealthInfo | undefined
    if (form.bloodGroup.trim() || form.allergies.trim() || form.conditions.trim()) {
      healthInfo = {
        patientId: id,
        bloodGroup: form.bloodGroup.trim() || undefined,
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicConditions: form.conditions.split(',').map((s) => s.trim()).filter(Boolean),
        currentMedications: [],
        smoking: 'unknown',
        alcohol: 'unknown',
      }
    }

    onCreated(patient, healthInfo)
    toast.success(`${patient.name} registered (${id}).`)
    reset()
    onOpenChange(false)
  }

  const computedAge = form.dob ? calculateAge(`${form.dob}T00:00:00Z`) : null

  return (
    <SlideOver
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}
      title="Register Patient"
      description="Add a new patient to the center."
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancel</Button>
          <Button className="bg-brand-gradient text-white border-none" onClick={handleSubmit}>Register patient</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Personal */}
        <SectionHeading>Personal</SectionHeading>
        <div className="flex items-center gap-3">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <UserAvatar name={form.name || '?'} size="lg" />
          )}
          <div>
            <label htmlFor="reg-avatar" className="cursor-pointer text-xs text-brand hover:underline">
              <Upload className="mr-0.5 inline h-3 w-3" /> Upload photo
            </label>
            <input id="reg-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatarPreview(URL.createObjectURL(f)) }} />
            <p className="text-[10px] text-ink-faint">Optional</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name *" htmlFor="r-name">
            <Input id="r-name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Date of birth" htmlFor="r-dob">
            <div className="flex items-center gap-2">
              <Input id="r-dob" type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} className="flex-1" />
              {computedAge !== null && <span className="text-xs text-ink-faint">{computedAge} yrs</span>}
            </div>
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(e) => update('gender', e.target.value as FormState['gender'])}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>

        <Separator />

        {/* Contact */}
        <SectionHeading>Contact</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" htmlFor="r-email">
            <Input id="r-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="r-phone">
            <Input id="r-phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (312) 555-0000" />
          </Field>
        </div>

        <Separator />

        {/* ID & Insurance */}
        <SectionHeading>ID &amp; Insurance</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="National ID" htmlFor="r-nid">
            <Input id="r-nid" value={form.nationalId} onChange={(e) => update('nationalId', e.target.value)} />
          </Field>
          <Field label="Insurance provider" htmlFor="r-ins">
            <Input id="r-ins" value={form.insuranceProvider} onChange={(e) => update('insuranceProvider', e.target.value)} />
          </Field>
          <Field label="Policy number" htmlFor="r-pol">
            <Input id="r-pol" value={form.policyNumber} onChange={(e) => update('policyNumber', e.target.value)} />
          </Field>
          <Field label="Health ID" htmlFor="r-hid">
            <Input id="r-hid" value={form.healthId} onChange={(e) => update('healthId', e.target.value)} />
          </Field>
        </div>

        <Separator />

        {/* Address */}
        <SectionHeading>Address</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Street" htmlFor="r-street">
              <Input id="r-street" value={form.street} onChange={(e) => update('street', e.target.value)} />
            </Field>
          </div>
          <Field label="City" htmlFor="r-city">
            <Input id="r-city" value={form.city} onChange={(e) => update('city', e.target.value)} />
          </Field>
          <Field label="State" htmlFor="r-state">
            <Input id="r-state" value={form.state} onChange={(e) => update('state', e.target.value)} />
          </Field>
          <Field label="Country" htmlFor="r-country">
            <Input id="r-country" value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="USA" />
          </Field>
        </div>

        <Separator />

        {/* Emergency Contact */}
        <SectionHeading>Emergency Contact</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="r-ecn">
            <Input id="r-ecn" value={form.ecName} onChange={(e) => update('ecName', e.target.value)} />
          </Field>
          <Field label="Relationship" htmlFor="r-ecr">
            <Input id="r-ecr" value={form.ecRelationship} onChange={(e) => update('ecRelationship', e.target.value)} placeholder="Spouse, Parent\u2026" />
          </Field>
          <Field label="Phone" htmlFor="r-ecp">
            <Input id="r-ecp" value={form.ecPhone} onChange={(e) => update('ecPhone', e.target.value)} />
          </Field>
        </div>

        <Separator />

        {/* Basic Health Info */}
        <SectionHeading>Basic Health Info (optional)</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Blood group" htmlFor="r-bg">
            <Input id="r-bg" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} placeholder="O+, A-, etc." />
          </Field>
          <Field label="Known allergies" htmlFor="r-al">
            <Input id="r-al" value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="Comma-separated" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Chronic conditions" htmlFor="r-cc">
              <Input id="r-cc" value={form.conditions} onChange={(e) => update('conditions', e.target.value)} placeholder="Comma-separated" />
            </Field>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}
