'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarPlus,
  MoreHorizontal,
  CheckCircle2,
  CalendarClock,
  XCircle,
  UserCheck,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { appointments as initialAppointments, patients as initialPatients, staff } from '@/lib/data'
import { formatDate, formatDateTime, calculateAge, cn } from '@/lib/utils'
import {
  PageHeader,
  SectionCard,
  DataTable,
  StatusBadge,
  UserAvatar,
  SlideOver,
  ConfirmDialog,
  type DataTableColumn,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Appointment, Patient } from '@/types'

// ── Constants ──

const TODAY = '2026-06-10'
const WEEK_START = '2026-06-04'
const WEEK_END_EXCL = '2026-06-15'
const doctors = staff.filter((s) => s.role === 'doctor' && s.status === 'active')

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00',
]

type DateScope = 'today' | 'week' | 'all'

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

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

let aptIdCounter = 9000
let patIdCounter = 99000

// ── Component ──

export default function ReceptionistAppointmentsPage() {
  // ── State ──
  const [aptList, setAptList] = useState<Appointment[]>(() => [...initialAppointments])
  const [patientList, setPatientList] = useState<Patient[]>(() => [...initialPatients])
  const [dateScope, setDateScope] = useState<DateScope>('today')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Booking
  const [bookingOpen, setBookingOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [newPat, setNewPat] = useState({ name: '', phone: '', email: '', gender: 'male' as const, dob: '' })
  const [bookDoc, setBookDoc] = useState(doctors[0]?.id ?? '')
  const [bookDate, setBookDate] = useState(TODAY)
  const [bookTime, setBookTime] = useState('09:00')
  const [bookReason, setBookReason] = useState('')
  const [bookDuration, setBookDuration] = useState(30)

  // Reschedule
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')

  // Cancel confirm
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null)

  // ── Filtered ──
  const filtered = useMemo(() => {
    let list = [...aptList]
    if (dateScope === 'today') list = list.filter((a) => a.dateTime.startsWith(TODAY))
    else if (dateScope === 'week') list = list.filter((a) => a.dateTime >= WEEK_START && a.dateTime < WEEK_END_EXCL)
    if (doctorFilter) list = list.filter((a) => a.doctorId === doctorFilter)
    if (statusFilter) list = list.filter((a) => a.status === statusFilter)
    return list.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  }, [aptList, dateScope, doctorFilter, statusFilter])

  // Patient search for booking
  const searchResults = useMemo(() => {
    if (!patientSearch.trim()) return []
    const q = patientSearch.toLowerCase()
    return patientList.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.id.toLowerCase().includes(q),
    ).slice(0, 5)
  }, [patientList, patientSearch])

  // ── Actions ──
  function confirmApt(apt: Appointment) {
    setAptList((prev) => prev.map((a) => (a.id === apt.id ? { ...a, status: 'confirmed' as const } : a)))
    toast.success(`${apt.patientName} appointment confirmed.`)
  }

  function checkInApt(apt: Appointment) {
    const nextMap: Record<string, string> = { not_arrived: 'waiting', waiting: 'with_doctor', with_doctor: 'done' }
    const current = apt.checkInStatus ?? 'not_arrived'
    const next = nextMap[current]
    if (!next) return
    setAptList((prev) => prev.map((a) => (a.id === apt.id ? { ...a, checkInStatus: next as Appointment['checkInStatus'] } : a)))
    toast.success(`${apt.patientName} \u2192 ${next.replace(/_/g, ' ')}.`)
  }

  function doReschedule() {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return
    setAptList((prev) =>
      prev.map((a) =>
        a.id === rescheduleApt.id ? { ...a, dateTime: `${rescheduleDate}T${rescheduleTime}:00Z` } : a,
      ),
    )
    toast.success(`${rescheduleApt.patientName} rescheduled to ${formatDate(`${rescheduleDate}T00:00:00Z`)} at ${rescheduleTime}.`)
    setRescheduleApt(null)
  }

  function doCancel() {
    if (!cancelApt) return
    setAptList((prev) => prev.map((a) => (a.id === cancelApt.id ? { ...a, status: 'cancelled' as const } : a)))
    toast.success(`${cancelApt.patientName} appointment cancelled.`)
    setCancelApt(null)
  }

  function openBooking() {
    setBookingOpen(true)
    setPatientSearch('')
    setSelectedPatient(null)
    setIsNewPatient(false)
    setNewPat({ name: '', phone: '', email: '', gender: 'male', dob: '' })
    setBookDoc(doctors[0]?.id ?? '')
    setBookDate(TODAY)
    setBookTime('09:00')
    setBookReason('')
    setBookDuration(30)
  }

  function submitBooking() {
    let pat = selectedPatient
    if (isNewPatient) {
      if (!newPat.name.trim()) { toast.error('Patient name is required.'); return }
      const id = `PAT-${patIdCounter++}`
      pat = {
        id,
        name: newPat.name.trim(),
        dob: newPat.dob ? `${newPat.dob}T00:00:00Z` : '1990-01-01T00:00:00Z',
        gender: newPat.gender,
        email: newPat.email.trim(),
        phone: newPat.phone.trim(),
        registeredDate: `${TODAY}T00:00:00Z`,
      }
      setPatientList((prev) => [...prev, pat!])
    }
    if (!pat) { toast.error('Please select or register a patient.'); return }
    if (!bookReason.trim()) { toast.error('Reason for visit is required.'); return }

    const doc = doctors.find((d) => d.id === bookDoc)
    const apt: Appointment = {
      id: `APT-${aptIdCounter++}`,
      patientId: pat.id,
      patientName: pat.name,
      doctorId: bookDoc,
      doctorName: doc?.name ?? 'Doctor',
      specialty: doc?.specialty ?? 'General Medicine',
      dateTime: `${bookDate}T${bookTime}:00Z`,
      durationMin: bookDuration,
      reason: bookReason.trim(),
      status: 'confirmed',
      checkInStatus: 'not_arrived',
    }
    setAptList((prev) => [...prev, apt])
    toast.success(`Appointment booked for ${pat.name} with ${doc?.name}.`)
    setBookingOpen(false)
  }

  // ── Columns ──
  const columns: DataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        key: 'dateTime',
        header: 'Date / Time',
        sortable: true,
        render: (row: Appointment) => <span className="whitespace-nowrap text-sm">{formatDateTime(row.dateTime)}</span>,
      },
      {
        key: 'patientName',
        header: 'Patient',
        sortable: true,
        render: (row: Appointment) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.patientName} size="sm" />
            <span className="font-medium text-ink">{row.patientName}</span>
          </div>
        ),
      },
      { key: 'doctorName', header: 'Doctor', sortable: true, className: 'hidden md:table-cell' },
      { key: 'specialty', header: 'Specialty', className: 'hidden lg:table-cell' },
      { key: 'reason', header: 'Reason', className: 'hidden xl:table-cell max-w-[180px] truncate' },
      {
        key: 'status',
        header: 'Status',
        render: (row: Appointment) => <StatusBadge status={row.checkInStatus ?? row.status} />,
      },
      {
        key: 'actions',
        header: '',
        className: 'w-10',
        render: (row: Appointment) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted" render={<button type="button" />}>
                <MoreHorizontal className="h-4 w-4 text-ink-faint" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                {row.status === 'pending' && (
                  <DropdownMenuItem onSelect={() => confirmApt(row)}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Confirm
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => checkInApt(row)}>
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Check in
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { setRescheduleApt(row); setRescheduleDate(row.dateTime.slice(0, 10)); setRescheduleTime(row.dateTime.slice(11, 16)) }}>
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Reschedule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setCancelApt(row)}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  )

  // ── Render ──
  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Appointments"
          description="Book and manage appointments across the center."
          actions={
            <Button className="bg-brand-gradient text-white border-none" onClick={openBooking}>
              <CalendarPlus className="mr-1.5 h-4 w-4" /> Book appointment
            </Button>
          }
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap items-center gap-3">
          <Select className="w-auto min-w-[120px]" value={dateScope} onChange={(e) => setDateScope(e.target.value as DateScope)}>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="all">All</option>
          </Select>
          <Select className="w-auto min-w-[160px]" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
            <option value="">All doctors</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select className="w-auto min-w-[130px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        <SectionCard>
          <DataTable
            columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
            data={filtered as unknown as Record<string, unknown>[]}
            searchable
            searchKeys={['patientName', 'doctorName', 'reason'] as never[]}
            pageSize={10}
          />
        </SectionCard>
      </motion.div>

      {/* ── Book Appointment SlideOver ── */}
      <SlideOver
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        title="Book Appointment"
        description="Search for an existing patient or register a new one."
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-none" onClick={submitBooking}>Book appointment</Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Section 1 — Patient */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-faint">Patient</span>

            {!selectedPatient && !isNewPatient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <Input
                    placeholder="Search by name, phone, or ID\u2026"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-lg border border-line-soft">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-line-soft/40"
                        onClick={() => { setSelectedPatient(p); setPatientSearch('') }}
                      >
                        <UserAvatar name={p.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                          <p className="text-xs text-ink-faint">{p.id} &middot; {p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="mt-2 text-xs text-ink-faint">No patient found.</p>
                )}
                <Button variant="ghost" size="sm" className="mt-2 text-xs text-brand" onClick={() => setIsNewPatient(true)}>
                  + Register new patient
                </Button>
              </>
            ) : selectedPatient ? (
              <div className="flex items-center gap-3 rounded-lg border border-line-soft p-3">
                <UserAvatar name={selectedPatient.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{selectedPatient.name}</p>
                  <p className="text-xs text-ink-faint">{selectedPatient.id} &middot; {selectedPatient.phone} &middot; {selectedPatient.email}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => setSelectedPatient(null)}>Change</Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-line-soft p-3">
                <p className="text-xs font-medium text-ink-faint">New patient</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Full name *" value={newPat.name} onChange={(e) => setNewPat({ ...newPat, name: e.target.value })} />
                  <Input placeholder="Phone" value={newPat.phone} onChange={(e) => setNewPat({ ...newPat, phone: e.target.value })} />
                  <Input placeholder="Email" value={newPat.email} onChange={(e) => setNewPat({ ...newPat, email: e.target.value })} />
                  <Input type="date" value={newPat.dob} onChange={(e) => setNewPat({ ...newPat, dob: e.target.value })} />
                </div>
                <Button variant="ghost" size="xs" className="text-xs text-brand" onClick={() => { setIsNewPatient(false); setPatientSearch('') }}>
                  Search existing instead
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Section 2 — Appointment details */}
          <div>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-ink-faint">Appointment</span>
            <div className="space-y-4">
              <Field label="Doctor">
                <Select value={bookDoc} onChange={(e) => setBookDoc(e.target.value)}>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} \u2014 {d.specialty}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" htmlFor="b-date">
                  <Input id="b-date" type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
                </Field>
                <Field label="Time">
                  <Select value={bookTime} onChange={(e) => setBookTime(e.target.value)}>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Reason for visit *" htmlFor="b-reason">
                <Input id="b-reason" value={bookReason} onChange={(e) => setBookReason(e.target.value)} placeholder="Annual checkup, follow-up\u2026" />
              </Field>
              <Field label="Duration">
                <Select value={String(bookDuration)} onChange={(e) => setBookDuration(Number(e.target.value))}>
                  <option value="15">15 min</option>
                  <option value="20">20 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </Select>
              </Field>
            </div>
          </div>
        </div>
      </SlideOver>

      {/* Reschedule SlideOver */}
      <SlideOver
        open={rescheduleApt !== null}
        onOpenChange={(open) => !open && setRescheduleApt(null)}
        title="Reschedule Appointment"
        description={rescheduleApt ? `${rescheduleApt.patientName} with ${rescheduleApt.doctorName}` : ''}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => setRescheduleApt(null)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-none" onClick={doReschedule}>Reschedule</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="New date" htmlFor="r-date">
            <Input id="r-date" type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
          </Field>
          <Field label="New time">
            <Select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
      </SlideOver>

      {/* Cancel confirm */}
      <ConfirmDialog
        open={cancelApt !== null}
        onOpenChange={(open) => !open && setCancelApt(null)}
        title="Cancel appointment"
        description={`Cancel ${cancelApt?.patientName}\u2019s appointment with ${cancelApt?.doctorName}?`}
        confirmLabel="Cancel appointment"
        destructive
        onConfirm={doCancel}
      />
    </motion.div>
  )
}
