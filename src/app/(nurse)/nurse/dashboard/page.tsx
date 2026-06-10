'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ListChecks,
  Activity,
  Clock,
  UserCheck,
  Check,
  Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { staff, patients, appointments, healthMetrics } from '@/lib/data'
import { formatDate, calculateAge, cn } from '@/lib/utils'
import {
  StatCard,
  SectionCard,
  StatusBadge,
  UserAvatar,
} from '@/components/shared'
import type { Appointment } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'

const QUEUE_OPTIONS = [
  { value: 'not_arrived', label: 'Not arrived' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'ready', label: 'Ready for doctor' },
  { value: 'with_doctor', label: 'With doctor' },
  { value: 'done', label: 'Done' },
]

function resolveNurse(userId: string) {
  return (
    staff.find((s) => s.id === userId && s.role === 'nurse') ??
    staff.find((s) => s.id === 'STF-89856')!
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Component ──

export default function NurseDashboard() {
  const { user } = useAuth()
  const nurse = useMemo(() => resolveNurse(user?.id ?? ''), [user])
  const assignedDoctor = useMemo(
    () => staff.find((s) => s.id === nurse.assignedDoctorId),
    [nurse],
  )
  const doctorId = nurse.assignedDoctorId ?? 'STF-10001'

  // Local queue state for inline status updates
  const [queueStatuses, setQueueStatuses] = useState<Record<string, string>>({})

  const todayQueue = useMemo(
    () =>
      appointments
        .filter((a) => a.doctorId === doctorId && a.dateTime.startsWith(TODAY))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [doctorId],
  )

  const vitalsToday = useMemo(
    () =>
      healthMetrics.filter(
        (m) => m.recordedById === nurse.id && m.recordedAt.startsWith(TODAY),
      ).length,
    [nurse.id],
  )

  // Vitals check for each patient
  const vitalsMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const a of todayQueue) {
      map.set(
        a.patientId,
        healthMetrics.some(
          (m) => m.patientId === a.patientId && m.recordedAt >= '2026-06-09T00:00:00Z',
        ),
      )
    }
    return map
  }, [todayQueue])

  function getStatus(apt: Appointment): string {
    return queueStatuses[apt.id] ?? apt.checkInStatus ?? apt.status
  }

  const waitingCount = todayQueue.filter((a) => getStatus(a) === 'waiting').length
  const readyCount = todayQueue.filter((a) => getStatus(a) === 'ready').length

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      {/* Greeting */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-xl bg-brand-gradient" style={{ minHeight: 72 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent" />
        <div className="relative px-6 py-4">
          <h1 className="font-display text-lg font-bold text-white">Hello, Nurse {nurse.name.replace(/^(Dr\.\s*|Nurse\s*)/, '')}</h1>
          <p className="text-sm text-white/80">
            Assigned to {assignedDoctor?.name ?? 'Dr. Kwame Mensah'} &middot; {formatDate(`${TODAY}T00:00:00Z`)}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={fadeUp}>
          <StatCard label="Patients in Queue" value={todayQueue.length} icon={ListChecks} accent />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Vitals Recorded" value={vitalsToday} icon={Activity} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Waiting" value={waitingCount} icon={Clock} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Ready for Doctor" value={readyCount} icon={UserCheck} />
        </motion.div>
      </motion.div>

      {/* Queue */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Today\u2019s Queue" description={`${assignedDoctor?.name ?? 'Dr. Mensah'}\u2019s patients`} noPadding>
          <div className="divide-y divide-line-soft">
            {todayQueue.map((apt) => {
              const pat = patients.find((p) => p.id === apt.patientId)
              const hasVitals = vitalsMap.get(apt.patientId) ?? false
              const status = getStatus(apt)
              return (
                <div key={apt.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  {/* Time */}
                  <div className="flex w-14 shrink-0 items-center gap-1 text-sm font-medium text-ink">
                    <Clock className="h-3.5 w-3.5 text-ink-faint" />
                    {formatTime(apt.dateTime)}
                  </div>

                  {/* Patient */}
                  <UserAvatar name={apt.patientName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {apt.patientName}
                      {pat && <span className="ml-1 font-normal text-ink-faint">({calculateAge(pat.dob)})</span>}
                    </p>
                    <p className="truncate text-xs text-ink-soft">{apt.reason}</p>
                  </div>

                  {/* Vitals indicator */}
                  {hasVitals ? (
                    <span className="hidden items-center gap-0.5 rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok sm:inline-flex">
                      <Check className="h-3 w-3" /> vitals
                    </span>
                  ) : (
                    <span className="hidden items-center gap-0.5 rounded-full bg-ink-faint/10 px-2 py-0.5 text-[10px] text-ink-faint sm:inline-flex">
                      <Minus className="h-3 w-3" /> pending
                    </span>
                  )}

                  {/* Status select */}
                  <select
                    className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
                    value={status}
                    onChange={(e) => {
                      setQueueStatuses((prev) => ({ ...prev, [apt.id]: e.target.value }))
                      toast.success(`${apt.patientName} marked as ${e.target.value.replace(/_/g, ' ')}.`)
                    }}
                  >
                    {QUEUE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  {/* Action */}
                  <Link href="/nurse/queue">
                    <button className="rounded-md bg-brand-gradient px-3 py-1 text-xs font-medium text-white hover:brightness-105">
                      Record vitals
                    </button>
                  </Link>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}
