'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  UserCheck,
  Clock,
  CheckCircle2,
  Search,
  UserPlus,
  CalendarPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { appointments, patients, staff } from '@/lib/data'
import { formatDate, calculateAge, cn } from '@/lib/utils'
import {
  StatCard,
  SectionCard,
  StatusBadge,
  UserAvatar,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PatientRegistration } from '@/components/receptionist/patient-registration'
import Link from 'next/link'
import type { Appointment, Patient } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const doctors = staff.filter((s) => s.role === 'doctor')

const CHECK_IN_FLOW: Record<string, string> = {
  not_arrived: 'waiting',
  waiting: 'with_doctor',
  with_doctor: 'done',
}

const CHECK_IN_LABELS: Record<string, string> = {
  not_arrived: 'Check in',
  waiting: 'With doctor',
  with_doctor: 'Mark done',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

// ── Component ──

export default function ReceptionistDashboard() {
  const { user } = useAuth()
  const name = user?.name ?? 'Marcus'

  const [searchQuery, setSearchQuery] = useState('')
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [registerOpen, setRegisterOpen] = useState(false)

  const todayAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.dateTime.startsWith(TODAY))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [],
  )

  function getStatus(apt: Appointment): string {
    return statuses[apt.id] ?? apt.checkInStatus ?? apt.status
  }

  function advanceStatus(apt: Appointment) {
    const current = getStatus(apt)
    const next = CHECK_IN_FLOW[current]
    if (!next) return
    setStatuses((prev) => ({ ...prev, [apt.id]: next }))
    toast.success(`${apt.patientName} \u2192 ${next.replace(/_/g, ' ')}.`)
  }

  // Stats
  const checkedIn = todayAppts.filter((a) => {
    const s = getStatus(a)
    return s === 'waiting' || s === 'with_doctor' || s === 'done'
  }).length
  const waitingCount = todayAppts.filter((a) => getStatus(a) === 'waiting').length
  const completedCount = todayAppts.filter((a) => getStatus(a) === 'done' || getStatus(a) === 'completed').length

  // Search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return todayAppts
    const q = searchQuery.toLowerCase()
    return todayAppts.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.patientId.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q),
    )
  }, [todayAppts, searchQuery])

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      {/* Greeting */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-xl bg-brand-gradient" style={{ minHeight: 72 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent" />
        <div className="relative px-6 py-4">
          <h1 className="font-display text-lg font-bold text-white">Welcome, {name.replace(/^(Mr\.\s*|Ms\.\s*|Mrs\.\s*)/, '')}</h1>
          <p className="text-sm text-white/80">Front Desk &middot; {formatDate(`${TODAY}T00:00:00Z`)}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={fadeUp}>
          <StatCard label="Today\u2019s Appointments" value={todayAppts.length} icon={CalendarDays} accent />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Checked In" value={checkedIn} icon={UserCheck} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Waiting" value={waitingCount} icon={Clock} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Completed" value={completedCount} icon={CheckCircle2} />
        </motion.div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        <Link href="/receptionist/appointments">
          <Button className="bg-brand-gradient text-white border-none">
            <CalendarPlus className="mr-1.5 h-4 w-4" /> Book appointment
          </Button>
        </Link>
        <Button variant="outline" onClick={() => setRegisterOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Register patient
        </Button>
      </motion.div>

      <PatientRegistration
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onCreated={() => {}}
      />

      {/* Today's schedule */}
      <motion.div variants={fadeUp}>
        <SectionCard
          title="Today\u2019s Schedule"
          description="All doctors"
          actions={
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input
                placeholder="Search patient / doctor\u2026"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          }
          noPadding
        >
          <div className="divide-y divide-line-soft">
            {filtered.map((apt) => {
              const pat = patients.find((p) => p.id === apt.patientId)
              const status = getStatus(apt)
              const canAdvance = !!CHECK_IN_FLOW[status]
              return (
                <div key={apt.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="flex w-14 shrink-0 items-center gap-1 text-sm font-medium text-ink">
                    <Clock className="h-3.5 w-3.5 text-ink-faint" />
                    {formatTime(apt.dateTime)}
                  </div>
                  <UserAvatar name={apt.patientName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {apt.patientName}
                      {pat && <span className="ml-1 font-normal text-ink-faint">({calculateAge(pat.dob)})</span>}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {apt.doctorName} &middot; {apt.specialty}
                    </p>
                  </div>
                  <span className="hidden text-xs text-ink-soft md:block max-w-[160px] truncate">{apt.reason}</span>
                  <StatusBadge status={status} />
                  {canAdvance ? (
                    <Button
                      size="sm"
                      variant={status === 'not_arrived' ? 'default' : 'outline'}
                      className={status === 'not_arrived' ? 'bg-brand-gradient text-white border-none text-xs' : 'text-xs'}
                      onClick={() => advanceStatus(apt)}
                    >
                      {CHECK_IN_LABELS[status]}
                    </Button>
                  ) : (
                    <span className="w-20" />
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-ink-faint">No matching appointments.</div>
            )}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}
