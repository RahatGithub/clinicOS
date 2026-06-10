'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Upload, Lock, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { staff } from '@/lib/data'
import { PageHeader, SectionCard, UserAvatar } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function resolveReceptionist(userId: string) {
  return staff.find((s) => s.id === userId && s.role === 'receptionist') ?? staff.find((s) => s.id === 'STF-30010')!
}

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

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

export default function ReceptionistProfilePage() {
  const { user } = useAuth()
  const rec = useMemo(() => resolveReceptionist(user?.id ?? ''), [user])

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [personal, setPersonal] = useState({
    name: rec.name,
    email: rec.email,
    phone: rec.phone,
    dob: rec.dob.split('T')[0],
    gender: rec.gender,
    nationalId: rec.nationalId,
  })

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  function save(section: string) { toast.success(`${section} updated.`) }

  function changePassword() {
    if (!currentPw || !newPw) { toast.error('Please fill in all password fields.'); return }
    if (newPw !== confirmPw) { toast.error('New passwords do not match.'); return }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters.'); return }
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    toast.success('Password changed.')
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader title="My Profile" description="Manage your personal information and account." />
      </motion.div>

      {/* Profile header */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <UserAvatar name={rec.name} size="lg" className="h-20 w-20 text-2xl" />
              )}
              <label
                htmlFor="av-file"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand-gradient text-white hover:brightness-110"
              >
                <Upload className="h-3.5 w-3.5" />
              </label>
              <input id="av-file" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatarPreview(URL.createObjectURL(f)) }} />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-ink">{personal.name}</h2>
              <p className="text-sm text-ink-soft">Receptionist &middot; {rec.id}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Role info (read-only) */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Role">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint">
              <Building2 className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Receptionist</p>
              <p className="text-xs text-ink-faint">Northgate Diagnostic Center &middot; Front Desk</p>
            </div>
          </div>
        </SectionCard>
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
            <Button className="bg-brand-gradient text-white border-none" onClick={changePassword}>Change password</Button>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}
