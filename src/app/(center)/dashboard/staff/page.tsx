'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Stethoscope,
  HeartPulse,
  ConciergeBell,
  Plus,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
  UserCog,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader,
  StatCard,
  DataTable,
  StatusBadge,
  UserAvatar,
  SlideOver,
  ConfirmDialog,
  type DataTableColumn,
} from '@/components/shared'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { staff as initialStaff } from '@/lib/data'
import { formatDate, cn } from '@/lib/utils'
import type { StaffMember, Role } from '@/types'

// ── Constants ──

const SPECIALTIES = [
  'General Medicine',
  'Orthopedics',
  'Ophthalmology',
  'ENT',
  'Cardiology',
  'Dermatology',
]

const GENDERS: { value: StaffMember['gender']; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

type StaffRole = 'doctor' | 'nurse' | 'receptionist'

// ── Animation ──

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ── Form state ──

interface FormState {
  name: string
  email: string
  phone: string
  dob: string
  gender: StaffMember['gender']
  nationalId: string
  role: StaffRole
  specialty: string
  qualifications: string
  assignedDoctorId: string
  password: string
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: 'male',
  nationalId: '',
  role: 'doctor',
  specialty: '',
  qualifications: '',
  assignedDoctorId: '',
  password: '',
}

let idCounter = 50000

function generateStaffId(): string {
  return `STF-${idCounter++}`
}

// ── Select (styled like Input) ──

function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

// ── Component ──

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>(() => [
    ...initialStaff,
  ])
  const [slideMode, setSlideMode] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null)

  // ── Derived lists ──

  const doctors = useMemo(
    () => staffList.filter((s) => s.role === 'doctor'),
    [staffList]
  )
  const nurses = useMemo(
    () => staffList.filter((s) => s.role === 'nurse'),
    [staffList]
  )
  const receptionists = useMemo(
    () => staffList.filter((s) => s.role === 'receptionist'),
    [staffList]
  )

  // ── Helpers ──

  const doctorName = useCallback(
    (id?: string) => {
      if (!id) return 'Unassigned'
      const doc = doctors.find((d) => d.id === id)
      return doc?.name ?? 'Unassigned'
    },
    [doctors]
  )

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // ── Actions ──

  function openAdd() {
    setSlideMode('add')
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  function openEdit(member: StaffMember) {
    setSlideMode('edit')
    setEditingId(member.id)
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      dob: member.dob ? member.dob.split('T')[0] : '',
      gender: member.gender,
      nationalId: member.nationalId,
      role: member.role as StaffRole,
      specialty: member.specialty ?? '',
      qualifications: member.qualifications ?? '',
      assignedDoctorId: member.assignedDoctorId ?? '',
      password: '',
    })
  }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required.')
      return
    }

    if (slideMode === 'add') {
      const newMember: StaffMember = {
        id: generateStaffId(),
        name: form.name.trim(),
        role: form.role as Exclude<Role, 'super_admin'>,
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob ? `${form.dob}T00:00:00Z` : '',
        gender: form.gender,
        nationalId: form.nationalId.trim(),
        status: 'active',
        joinedDate: new Date().toISOString(),
        ...(form.role === 'doctor' && {
          specialty: form.specialty,
          qualifications: form.qualifications.trim(),
        }),
        ...(form.role === 'nurse' && {
          assignedDoctorId: form.assignedDoctorId || undefined,
        }),
      }
      setStaffList((prev) => [...prev, newMember])
      toast.success(`${form.name} added as ${form.role}.`)
    } else if (slideMode === 'edit' && editingId) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                dob: form.dob ? `${form.dob}T00:00:00Z` : s.dob,
                gender: form.gender,
                nationalId: form.nationalId.trim(),
                ...(s.role === 'doctor' && {
                  specialty: form.specialty,
                  qualifications: form.qualifications.trim(),
                }),
                ...(s.role === 'nurse' && {
                  assignedDoctorId: form.assignedDoctorId || undefined,
                }),
              }
            : s
        )
      )
      toast.success(`${form.name} updated.`)
    }

    setSlideMode(null)
  }

  function handleToggleStatus(member: StaffMember) {
    const next = member.status === 'active' ? 'inactive' : 'active'
    setStaffList((prev) =>
      prev.map((s) => (s.id === member.id ? { ...s, status: next } : s))
    )
    toast.success(
      `${member.name} ${next === 'active' ? 'activated' : 'deactivated'}.`
    )
  }

  function handleRemove() {
    if (!removeTarget) return
    setStaffList((prev) => prev.filter((s) => s.id !== removeTarget.id))
    toast.success(`${removeTarget.name} removed.`)
    setRemoveTarget(null)
  }

  // ── Row actions dropdown ──

  function ActionsCell({ member }: { member: StaffMember }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
          render={<button type="button" />}
        >
          <MoreHorizontal className="h-4 w-4 text-ink-faint" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
          <DropdownMenuItem
            onSelect={() => openEdit(member)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            View / Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleToggleStatus(member)}
          >
            {member.status === 'active' ? (
              <>
                <UserX className="mr-1.5 h-3.5 w-3.5" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          {member.role === 'nurse' && (
            <DropdownMenuItem
              onSelect={() => openEdit(member)}
            >
              <UserCog className="mr-1.5 h-3.5 w-3.5" />
              Reassign doctor
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setRemoveTarget(member)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ── Column definitions ──

  const nameCol: DataTableColumn<StaffMember> = {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <UserAvatar name={row.name} size="sm" />
        <span className="font-medium text-ink">{row.name}</span>
      </div>
    ),
  }

  const emailCol: DataTableColumn<StaffMember> = {
    key: 'email',
    header: 'Email',
    sortable: true,
    className: 'hidden md:table-cell',
  }

  const phoneCol: DataTableColumn<StaffMember> = {
    key: 'phone',
    header: 'Phone',
    className: 'hidden lg:table-cell',
  }

  const statusCol: DataTableColumn<StaffMember> = {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  }

  const actionsCol: DataTableColumn<StaffMember> = {
    key: 'actions',
    header: '',
    className: 'w-10',
    render: (row) => <ActionsCell member={row} />,
  }

  const doctorColumns: DataTableColumn<StaffMember>[] = [
    nameCol,
    {
      key: 'specialty',
      header: 'Specialty',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    emailCol,
    phoneCol,
    statusCol,
    actionsCol,
  ]

  const nurseColumns: DataTableColumn<StaffMember>[] = [
    nameCol,
    {
      key: 'assignedDoctorId',
      header: 'Assigned Doctor',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className={row.assignedDoctorId ? 'text-ink' : 'text-ink-faint'}>
          {doctorName(row.assignedDoctorId)}
        </span>
      ),
    },
    emailCol,
    phoneCol,
    statusCol,
    actionsCol,
  ]

  const receptionistColumns: DataTableColumn<StaffMember>[] = [
    nameCol,
    emailCol,
    phoneCol,
    {
      key: 'joinedDate',
      header: 'Joined',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="text-ink-soft">{formatDate(row.joinedDate)}</span>
      ),
    },
    statusCol,
    actionsCol,
  ]

  // ── Form fields ──

  const formContent = (
    <div className="space-y-4">
      {/* Role selector (only in add mode) */}
      {slideMode === 'add' && (
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={form.role}
            onChange={(e) => updateField('role', e.target.value as StaffRole)}
          >
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="receptionist">Receptionist</option>
          </Select>
        </div>
      )}

      {/* Avatar placeholder */}
      <div className="flex items-center gap-3">
        <UserAvatar name={form.name || '?'} size="lg" />
        <div className="flex-1">
          <Label
            htmlFor="avatar-upload"
            className="cursor-pointer text-xs text-brand hover:underline"
          >
            Upload photo
          </Label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => toast.info('Photo upload is demo-only.')}
          />
          <p className="text-[10px] text-ink-faint">JPG or PNG, max 2 MB</p>
        </div>
      </div>

      {/* Common fields */}
      <div className="space-y-1.5">
        <Label htmlFor="f-name">Full name</Label>
        <Input
          id="f-name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Dr. Jane Smith"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="f-email">Email</Label>
          <Input
            id="f-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="jane@northgate.health"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-phone">Phone</Label>
          <Input
            id="f-phone"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+1 (312) 555-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="f-dob">Date of birth</Label>
          <Input
            id="f-dob"
            type="date"
            value={form.dob}
            onChange={(e) => updateField('dob', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-gender">Gender</Label>
          <Select
            id="f-gender"
            value={form.gender}
            onChange={(e) =>
              updateField('gender', e.target.value as StaffMember['gender'])
            }
          >
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-nid">National ID</Label>
        <Input
          id="f-nid"
          value={form.nationalId}
          onChange={(e) => updateField('nationalId', e.target.value)}
          placeholder="SSN-XXX-XX-0000"
        />
      </div>

      {slideMode === 'add' && (
        <div className="space-y-1.5">
          <Label htmlFor="f-pass">Temporary password</Label>
          <Input
            id="f-pass"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="••••••••"
          />
        </div>
      )}

      {/* Doctor-specific */}
      {form.role === 'doctor' && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="f-spec">Specialty</Label>
            <Select
              id="f-spec"
              value={form.specialty}
              onChange={(e) => updateField('specialty', e.target.value)}
            >
              <option value="">Select specialty</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-qual">Qualifications</Label>
            <Input
              id="f-qual"
              value={form.qualifications}
              onChange={(e) => updateField('qualifications', e.target.value)}
              placeholder="MD, FACP — Northwestern University"
            />
          </div>
        </>
      )}

      {/* Nurse-specific */}
      {form.role === 'nurse' && (
        <div className="space-y-1.5">
          <Label htmlFor="f-doc">Assigned doctor</Label>
          <Select
            id="f-doc"
            value={form.assignedDoctorId}
            onChange={(e) => updateField('assignedDoctorId', e.target.value)}
          >
            <option value="">Unassigned</option>
            {doctors
              .filter((d) => d.status === 'active')
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
          </Select>
        </div>
      )}
    </div>
  )

  // ── Render ──

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Staff"
          description="Manage doctors, nurses, and front-desk staff."
          actions={
            <Button
              className="bg-brand-gradient text-white border-none"
              onClick={openAdd}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add staff member
            </Button>
          }
        />
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            label="Total Staff"
            value={staffList.length}
            icon={Users}
            accent
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Doctors"
            value={doctors.length}
            icon={Stethoscope}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Nurses"
            value={nurses.length}
            icon={HeartPulse}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Receptionists"
            value={receptionists.length}
            icon={ConciergeBell}
          />
        </motion.div>
      </motion.div>

      {/* Tabs + DataTables */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="doctors">
          <TabsList variant="line">
            <TabsTrigger value="doctors">
              Doctors ({doctors.length})
            </TabsTrigger>
            <TabsTrigger value="nurses">
              Nurses ({nurses.length})
            </TabsTrigger>
            <TabsTrigger value="receptionists">
              Receptionists ({receptionists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors" className="mt-4">
            <DataTable
              columns={doctorColumns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={doctors as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={['name', 'specialty', 'email'] as never[]}
              pageSize={10}
            />
          </TabsContent>

          <TabsContent value="nurses" className="mt-4">
            <DataTable
              columns={nurseColumns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={nurses as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={['name', 'email'] as never[]}
              pageSize={10}
            />
          </TabsContent>

          <TabsContent value="receptionists" className="mt-4">
            <DataTable
              columns={receptionistColumns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={receptionists as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={['name', 'email'] as never[]}
              pageSize={10}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add / Edit SlideOver */}
      <SlideOver
        open={slideMode !== null}
        onOpenChange={(open) => !open && setSlideMode(null)}
        title={slideMode === 'add' ? 'Add staff member' : 'Edit staff member'}
        description={
          slideMode === 'add'
            ? 'Fill in the details to add a new team member.'
            : 'Update this team member\u2019s information.'
        }
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setSlideMode(null)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-gradient text-white border-none"
              onClick={handleSave}
            >
              {slideMode === 'add' ? 'Add member' : 'Save changes'}
            </Button>
          </div>
        }
      >
        {formContent}
      </SlideOver>

      {/* Remove confirmation */}
      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove staff member"
        description={`Are you sure you want to remove ${removeTarget?.name}? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
      />
    </motion.div>
  )
}
