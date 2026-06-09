'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  MoreHorizontal,
  Eye,
  ToggleRight,
  Trash2,
  ShieldAlert,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Users as UsersIcon,
  CalendarDays,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader,
  StatCard,
  SectionCard,
  DataTable,
  StatusBadge,
  UserAvatar,
  SlideOver,
  ConfirmDialog,
} from '@/components/shared'
import type { DataTableColumn } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { tenants as initialTenants } from '@/lib/data'
import { formatDate } from '@/lib/utils'
import type { Tenant } from '@/types'

// ── Row type for DataTable ──
interface TenantRow {
  id: string
  name: string
  adminName: string
  email: string
  plan: string
  userCount: number
  registeredDate: string
  status: string
  [key: string]: unknown
}

function toRows(list: Tenant[]): TenantRow[] {
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    adminName: t.adminName,
    email: t.email,
    plan: t.plan,
    userCount: t.userCount,
    registeredDate: t.registeredDate,
    status: t.status,
  }))
}

// ── Animation ──
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const },
  }),
}

export default function TenantsPage() {
  const [data, setData] = useState<Tenant[]>(initialTenants)
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)

  // ── Filters ──
  const filtered = useMemo(() => {
    let result = data
    if (planFilter !== 'all') result = result.filter((t) => t.plan === planFilter)
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter)
    return result
  }, [data, planFilter, statusFilter])

  const rows = useMemo(() => toRows(filtered), [filtered])

  // ── Counts ──
  const activeCount = data.filter((t) => t.status === 'active').length
  const trialCount = data.filter((t) => t.status === 'trial').length
  const suspendedCount = data.filter((t) => t.status === 'suspended').length

  // ── Actions ──
  function toggleStatus(tenant: Tenant) {
    const next = tenant.status === 'suspended' ? 'active' : 'suspended'
    setData((prev) =>
      prev.map((t) =>
        t.id === tenant.id ? { ...t, status: next as Tenant['status'] } : t
      )
    )
    toast.success(
      `${tenant.name} ${next === 'active' ? 'activated' : 'suspended'}`
    )
    if (detailTenant?.id === tenant.id) {
      setDetailTenant((prev) =>
        prev ? { ...prev, status: next as Tenant['status'] } : null
      )
    }
  }

  function deleteTenant(tenant: Tenant) {
    setData((prev) => prev.filter((t) => t.id !== tenant.id))
    toast.success(`${tenant.name} removed from platform`)
    if (detailTenant?.id === tenant.id) setDetailTenant(null)
  }

  // ── Table columns ──
  const columns: DataTableColumn<TenantRow>[] = [
    {
      key: 'name',
      header: 'Center',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={row.name} size="sm" />
          <span className="font-medium text-ink">{row.name}</span>
        </div>
      ),
    },
    { key: 'adminName', header: 'Admin', sortable: true },
    {
      key: 'email',
      header: 'Email',
      className: 'hidden lg:table-cell',
      render: (row) => (
        <span className="text-ink-soft">{row.email}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-line-soft px-2.5 py-0.5 text-xs font-medium capitalize text-ink">
          {row.plan}
        </span>
      ),
    },
    { key: 'userCount', header: 'Users', sortable: true },
    {
      key: 'registeredDate',
      header: 'Registered',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (row) => (
        <span className="text-ink-soft">{formatDate(row.registeredDate)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: '_actions',
      header: '',
      className: 'w-10',
      render: (row) => {
        const tenant = data.find((t) => t.id === row.id)!
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setDetailTenant(tenant)
                }}
              >
                <Eye className="h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStatus(tenant)
                }}
              >
                <ToggleRight className="h-4 w-4" />
                {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(tenant)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage all healthcare centers on the platform."
        actions={
          <Button
            className="bg-brand-gradient text-white border-none"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" data-icon="inline-start" />
            Add tenant
          </Button>
        }
      />

      {/* Stat row */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Total Tenants"
          value={data.length}
          icon={Building2}
          accent
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={CheckCircle2}
        />
        <StatCard
          label="Trial"
          value={trialCount}
          icon={Clock}
        />
        <StatCard
          label="Suspended"
          value={suspendedCount}
          icon={XCircle}
        />
      </motion.div>

      {/* Table */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <SectionCard noPadding>
          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-ink-faint whitespace-nowrap">
                Plan
              </Label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-ink outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="all">All</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-ink-faint whitespace-nowrap">
                Status
              </Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-ink outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="p-1">
            <DataTable
              columns={columns}
              data={rows}
              searchable
              searchKeys={['name', 'adminName', 'email']}
              pageSize={8}
              onRowClick={(row) => {
                const tenant = data.find((t) => t.id === row.id)
                if (tenant) setDetailTenant(tenant)
              }}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* ── Detail SlideOver ── */}
      <TenantDetailSlideOver
        tenant={detailTenant}
        onClose={() => setDetailTenant(null)}
        onToggleStatus={(t) => toggleStatus(t)}
      />

      {/* ── Add tenant SlideOver ── */}
      <AddTenantSlideOver
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(t) => {
          setData((prev) => [t, ...prev])
          setAddOpen(false)
          toast.success(`${t.name} added to the platform`)
        }}
      />

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={`Delete ${deleteTarget?.name}?`}
        description="This will permanently remove the tenant and all associated data from the platform. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteTenant(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tenant detail slide-over
// ═══════════════════════════════════════════════
function TenantDetailSlideOver({
  tenant,
  onClose,
  onToggleStatus,
}: {
  tenant: Tenant | null
  onClose: () => void
  onToggleStatus: (t: Tenant) => void
}) {
  if (!tenant) return null
  const addr = tenant.address

  return (
    <SlideOver
      open={!!tenant}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={tenant.name}
      description={`${tenant.id} · Registered ${formatDate(tenant.registeredDate)}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            variant={tenant.status === 'suspended' ? 'default' : 'outline'}
            className={
              tenant.status === 'suspended'
                ? 'bg-brand-gradient text-white border-none'
                : undefined
            }
            onClick={() => onToggleStatus(tenant)}
          >
            <ToggleRight className="h-4 w-4" data-icon="inline-start" />
            {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <UserAvatar name={tenant.name} size="lg" />
          <div>
            <p className="font-display font-semibold text-ink">{tenant.name}</p>
            <StatusBadge status={tenant.status} />
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Overview
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow
              icon={CreditCard}
              label="Plan"
              value={<span className="capitalize">{tenant.plan}</span>}
            />
            <DetailRow
              icon={UsersIcon}
              label="Users"
              value={tenant.userCount}
            />
            <DetailRow
              icon={CalendarDays}
              label="Registered"
              value={formatDate(tenant.registeredDate)}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Primary Contact
          </h4>
          <div className="space-y-2">
            <DetailRow icon={UsersIcon} label="Admin" value={tenant.adminName} />
            <DetailRow icon={Mail} label="Email" value={tenant.email} />
            <DetailRow icon={Phone} label="Phone" value={tenant.phone} />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Address
          </h4>
          <div className="flex items-start gap-2.5 text-sm text-ink-soft">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
            <span>
              {addr.street}, {addr.city}, {addr.state}, {addr.country}
            </span>
          </div>
        </div>

        {/* Subscription */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Subscription
          </h4>
          <div className="rounded-lg border border-line-soft bg-line-soft/30 p-3 text-sm">
            <p className="text-ink">
              <span className="capitalize font-medium">{tenant.plan}</span> plan
              {tenant.status === 'active' && (
                <span className="text-ink-soft">
                  {' '}
                  — Paid · next invoice Jul 1, 2026
                </span>
              )}
              {tenant.status === 'trial' && (
                <span className="text-ink-soft">
                  {' '}
                  — Trial ends Jul 20, 2026
                </span>
              )}
              {tenant.status === 'suspended' && (
                <span className="text-danger"> — Payment overdue</span>
              )}
            </p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex gap-2.5 rounded-lg border border-brand/20 bg-brand-tint/40 p-3.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep" />
          <div className="text-sm">
            <p className="font-medium text-ink">Data Privacy</p>
            <p className="mt-0.5 text-ink-soft">
              Patient records, appointments, and clinical data are private to each
              center and not accessible from the platform.
            </p>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Info
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-ink-faint" />
      <span className="text-ink-soft">{label}:</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Add tenant slide-over
// ═══════════════════════════════════════════════
function AddTenantSlideOver({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (t: Tenant) => void
}) {
  const [name, setName] = useState('')
  const [admin, setAdmin] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [plan, setPlan] = useState<Tenant['plan']>('basic')
  const [country, setCountry] = useState('USA')

  function handleSubmit() {
    if (!name.trim() || !admin.trim() || !email.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    const tenant: Tenant = {
      id: `TEN-${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      adminName: admin.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: { street: '', city: '', state: '', country: country.trim() },
      plan,
      status: 'trial',
      registeredDate: new Date().toISOString(),
      userCount: 1,
    }
    onAdd(tenant)
    setName('')
    setAdmin('')
    setEmail('')
    setPhone('')
    setPlan('basic')
    setCountry('USA')
  }

  return (
    <SlideOver
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title="Add Tenant"
      description="Register a new healthcare center on the platform."
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-brand-gradient text-white border-none"
            onClick={handleSubmit}
          >
            Add Tenant
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="t-name">Center Name *</Label>
          <Input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Downtown Medical Center"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-admin">Admin Name *</Label>
          <Input
            id="t-admin"
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
            placeholder="e.g. Dr. Jane Smith"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-email">Email *</Label>
          <Input
            id="t-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-phone">Phone</Label>
          <Input
            id="t-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-plan">Plan</Label>
          <select
            id="t-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as Tenant['plan'])}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-ink outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-country">Country</Label>
          <Input
            id="t-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="USA"
          />
        </div>
      </div>
    </SlideOver>
  )
}
