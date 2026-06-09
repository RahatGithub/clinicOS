'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { demoUsers } from '@/lib/data'
import { roleLabels } from '@/lib/nav-config'
import type { Role } from '@/types'

const rolePills: { role: Role; label: string }[] = [
  { role: 'center_admin', label: 'Center Admin' },
  { role: 'doctor', label: 'Doctor' },
  { role: 'nurse', label: 'Nurse' },
  { role: 'receptionist', label: 'Receptionist' },
  { role: 'super_admin', label: 'Super Admin' },
]

const features = [
  'Appointments & prescriptions',
  'Role-based dashboards',
  'Health records & analytics',
  'Multi-tenant center management',
]

const fade = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const },
  }),
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('center_admin')
  const [showPassword, setShowPassword] = useState(false)

  const user = demoUsers.find((u) => u.role === selectedRole)!
  const email = user.email
  const password = user.password

  function handleLogin() {
    console.log('Login attempt:', { role: selectedRole, email, user })
    toast.info('Login wired in next step', {
      description: `Would log in as ${user.name} (${roleLabels[selectedRole]})`,
    })
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Form ── */}
      <div className="flex flex-1 flex-col justify-center px-6 py-10 lg:max-w-[45%] lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="mb-10 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
                C
              </div>
              <span className="font-display text-xl font-semibold text-ink">
                ClinicOS
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <h1 className="font-display text-2xl font-semibold text-ink">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Log in to your ClinicOS workspace.
            </p>
          </motion.div>

          {/* Role switcher */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-7"
          >
            <Label className="text-xs font-medium uppercase tracking-wider text-ink-faint">
              Demo role
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {rolePills.map(({ role, label }) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-brand-gradient text-white shadow-sm'
                      : 'border border-line bg-white text-ink-soft hover:border-brand hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-6 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-line-soft/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  readOnly
                  className="bg-line-soft/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-ink-faint">
              Credentials are pre-filled for the demo — just click Log in.
            </p>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-soft">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded border-line accent-brand"
                />
                Remember me
              </label>
              <button className="text-brand-deep hover:underline">
                Forgot password?
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-6"
          >
            <Button
              className="w-full bg-brand-gradient bg-brand-gradient-hover text-white border-none h-10 text-sm font-semibold"
              onClick={handleLogin}
            >
              Log in
            </Button>
          </motion.div>

          {/* Divider + secondary */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-faint">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <p className="text-center text-sm text-ink-soft">
              New to ClinicOS?{' '}
              <Link
                href="/login"
                className="font-medium text-brand-deep hover:underline"
              >
                Start a free trial
              </Link>
            </p>

            <Link
              href="/"
              className="mt-6 flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Right: Brand panel (desktop only) ── */}
      <div className="relative hidden flex-1 overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute right-24 bottom-32 h-40 w-40 rounded-full bg-white/[0.05]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 max-w-md text-center"
        >
          <h2 className="font-display text-3xl font-bold leading-tight text-white xl:text-4xl">
            Run your clinic.
            <br />
            Not your paperwork.
          </h2>
          <p className="mt-4 text-base text-white/80">
            ClinicOS gives your team one place for appointments, prescriptions,
            billing, and patient health records — built for modern diagnostic centers.
          </p>

          {/* Feature ticks */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-white/90">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3 text-white" />
                </div>
                {f}
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="mt-10 rounded-xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-white/90 italic">
              &ldquo;We switched from paper registers to ClinicOS in a week. Our
              front desk saves two hours a day just on appointment management.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                HM
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Dr. Helen Mirowski
                </p>
                <p className="text-xs text-white/60">
                  Director, Northgate Diagnostic Center
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
