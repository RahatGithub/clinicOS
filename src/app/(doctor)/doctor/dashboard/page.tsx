'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  CalendarDays,
  CalendarCheck,
  Users,
  ClipboardCheck,
  Clock,
  ArrowRight,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  appointments,
  patients,
  prescriptions,
  healthMetrics,
  staff,
} from '@/lib/data'
import { formatDate, calculateAge } from '@/lib/utils'
import {
  StatCard,
  SectionCard,
  StatusBadge,
  UserAvatar,
} from '@/components/shared'
import { Button } from '@/components/ui/button'

// ── Constants ──

const TODAY = '2026-06-10'
const WEEK_START = '2026-06-08'
const WEEK_END_EXCL = '2026-06-15'

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

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Component ──

export default function DoctorDashboard() {
  const { user } = useAuth()
  const doctor = useMemo(() => resolveDoctor(user?.id ?? ''), [user])
  const doctorId = doctor.id

  // ── Scoped data ──

  const myAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.doctorId === doctorId)
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [doctorId],
  )

  const todayQueue = useMemo(
    () => myAppointments.filter((a) => a.dateTime.startsWith(TODAY)),
    [myAppointments],
  )

  const weekCount = useMemo(
    () =>
      myAppointments.filter(
        (a) => a.dateTime >= WEEK_START && a.dateTime < WEEK_END_EXCL,
      ).length,
    [myAppointments],
  )

  const myPatients = useMemo(
    () => patients.filter((p) => p.assignedDoctorId === doctorId),
    [doctorId],
  )

  const myPrescriptions = useMemo(
    () =>
      prescriptions
        .filter((rx) => rx.doctorId === doctorId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [doctorId],
  )

  const followUpsDue = useMemo(
    () =>
      myPrescriptions.filter(
        (rx) => rx.followUpDate && rx.followUpDate.slice(0, 10) <= TODAY,
      ),
    [myPrescriptions],
  )

  const upcomingAppts = useMemo(
    () =>
      myAppointments
        .filter((a) => a.dateTime > `${TODAY}T23:59:59Z`)
        .slice(0, 5),
    [myAppointments],
  )

  // Vitals check: has recent health metrics (within last 2 days)
  const vitalsMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const a of todayQueue) {
      const has = healthMetrics.some(
        (m) =>
          m.patientId === a.patientId &&
          m.recordedAt >= '2026-06-09T00:00:00Z',
      )
      map.set(a.patientId, has)
    }
    return map
  }, [todayQueue])

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Greeting header */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-xl bg-brand-gradient"
        style={{ minHeight: 80 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent" />
        <div className="relative px-6 py-5">
          <h1 className="font-display text-lg font-bold text-white sm:text-xl">
            Good morning, {doctor.name}
          </h1>
          <p className="text-sm text-white/80">
            {doctor.specialty} &middot; {formatDate(`${TODAY}T00:00:00Z`)}
          </p>
        </div>
      </motion.div>

      {/* Stat row */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard label="Patients Today" value={todayQueue.length} icon={CalendarDays} accent />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="This Week" value={weekCount} icon={CalendarCheck} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Total Patients" value={myPatients.length} icon={Users} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Follow-ups Due"
            value={followUpsDue.length}
            icon={ClipboardCheck}
            trend={followUpsDue.length > 0 ? { value: 'needs attention', direction: 'up' } : undefined}
          />
        </motion.div>
      </motion.div>

      {/* Today's queue */}
      <motion.div variants={fadeUp}>
        <SectionCard
          title="Today\u2019s Queue"
          description={`${todayQueue.length} appointments`}
          noPadding
        >
          <div className="divide-y divide-line-soft">
            {todayQueue.map((apt) => {
              const pat = patients.find((p) => p.id === apt.patientId)
              const hasVitals = vitalsMap.get(apt.patientId) ?? false
              return (
                <Link
                  key={apt.id}
                  href={`/doctor/patients/${apt.patientId}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-line-soft/40"
                >
                  <div className="w-16 shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-medium text-ink">
                      <Clock className="h-3.5 w-3.5 text-ink-faint" />
                      {formatTime(apt.dateTime)}
                    </div>
                  </div>
                  <UserAvatar name={apt.patientName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {apt.patientName}
                      {pat && (
                        <span className="ml-1 font-normal text-ink-faint">
                          ({calculateAge(pat.dob)} yrs)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-soft">{apt.reason}</p>
                  </div>
                  {hasVitals && (
                    <span className="hidden items-center gap-0.5 rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok sm:inline-flex">
                      <Check className="h-3 w-3" /> vitals
                    </span>
                  )}
                  <StatusBadge status={apt.checkInStatus ?? apt.status} />
                </Link>
              )
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* Side panels */}
      <motion.div variants={stagger} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming */}
        <motion.div variants={fadeUp}>
          <SectionCard title="Upcoming">
            {upcomingAppts.length === 0 ? (
              <p className="text-sm text-ink-faint">No upcoming appointments.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-2">
                    <UserAvatar name={apt.patientName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{apt.patientName}</p>
                      <p className="text-xs text-ink-faint">
                        {formatDate(apt.dateTime)} &middot; {apt.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Recent prescriptions */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="Recent Prescriptions"
            actions={
              <Link href="/doctor/prescriptions">
                <Button variant="ghost" size="sm" className="text-xs text-brand">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          >
            {myPrescriptions.length === 0 ? (
              <p className="text-sm text-ink-faint">No prescriptions.</p>
            ) : (
              <div className="space-y-3">
                {myPrescriptions.slice(0, 4).map((rx) => (
                  <div key={rx.id} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{rx.patientName}</p>
                      <p className="truncate text-xs text-ink-faint">
                        {formatDate(rx.date)} &middot; {rx.diagnosis}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Follow-ups due */}
        <motion.div variants={fadeUp}>
          <SectionCard title="Follow-ups Due">
            {followUpsDue.length === 0 ? (
              <p className="text-sm text-ink-faint">No follow-ups due.</p>
            ) : (
              <div className="space-y-3">
                {followUpsDue.map((rx) => (
                  <Link
                    key={rx.id}
                    href={`/doctor/patients/${rx.patientId}`}
                    className="flex items-start gap-2 rounded-md p-1 transition-colors hover:bg-line-soft/40"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warn/10">
                      <AlertCircle className="h-3.5 w-3.5 text-warn" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{rx.patientName}</p>
                      <p className="truncate text-xs text-ink-faint">
                        Due {formatDate(rx.followUpDate!)} &middot; {rx.diagnosis}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
