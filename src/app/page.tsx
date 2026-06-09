'use client'

import { useState } from 'react'
import {
  Users,
  Calendar,
  Activity,
  Stethoscope,
  Plus,
  FileText,
  Trash2,
} from 'lucide-react'
import {
  StatCard,
  PageHeader,
  StatusBadge,
  DataTable,
  UserAvatar,
  EmptyState,
  SlideOver,
  ConfirmDialog,
  SectionCard,
  Sparkline,
} from '@/components/shared'
import type { DataTableColumn } from '@/components/shared'
import { patients } from '@/lib/data'
import { calculateAge } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PatientRow {
  id: string
  name: string
  age: number
  gender: string
  status: string
  [key: string]: unknown
}

const patientRows: PatientRow[] = patients.slice(0, 8).map((p) => ({
  id: p.id,
  name: p.name,
  age: calculateAge(p.dob),
  gender: p.gender,
  status: p.lastVisit ? 'active' : 'pending',
}))

const patientColumns: DataTableColumn<PatientRow>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
  { key: 'gender', header: 'Gender', className: 'capitalize' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
]

export default function Home() {
  const [slideOpen, setSlideOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-10">
      {/* Page Header */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Page Header
        </h2>
        <PageHeader
          title="Component Showcase"
          description="Temporary QA page — verifying all shared components."
          actions={
            <Button className="bg-brand-gradient text-white border-none">
              <Plus className="h-4 w-4" data-icon="inline-start" />
              Add New
            </Button>
          }
        />
      </div>

      {/* Stat Cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Stat Cards
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Patients"
            value={patients.length}
            icon={Users}
            trend={{ value: '+12% this month', direction: 'up' }}
            accent
          />
          <StatCard
            label="Appointments Today"
            value={14}
            icon={Calendar}
            trend={{ value: '+3 from yesterday', direction: 'up' }}
          />
          <StatCard
            label="Active Staff"
            value={11}
            icon={Stethoscope}
          />
          <StatCard
            label="Pending Reports"
            value={5}
            icon={Activity}
            trend={{ value: '-2 since last week', direction: 'down' }}
          />
        </div>
      </div>

      {/* Status Badges */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Status Badges
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            'active', 'pending', 'completed', 'cancelled', 'in_progress',
            'with_doctor', 'paid', 'overdue', 'trial', 'on_leave',
            'suspended', 'not_arrived',
          ].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Data Table
        </h2>
        <DataTable
          columns={patientColumns}
          data={patientRows}
          searchable
          searchKeys={['name', 'id']}
          pageSize={5}
          onRowClick={(row) => console.log('Row clicked:', row)}
        />
      </div>

      {/* User Avatars */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          User Avatars
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <UserAvatar name="Dr. Kwame Mensah" size="sm" />
            <span className="text-xs text-ink-faint">sm</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <UserAvatar name="Ruby Classius" size="md" />
            <span className="text-xs text-ink-faint">md</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <UserAvatar name="Marcus Webb" size="lg" />
            <span className="text-xs text-ink-faint">lg</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Empty State
        </h2>
        <SectionCard>
          <EmptyState
            icon={FileText}
            title="No prescriptions yet"
            description="Prescriptions will appear here once a doctor creates one for this patient."
            action={
              <Button className="bg-brand-gradient text-white border-none">
                Create Prescription
              </Button>
            }
          />
        </SectionCard>
      </div>

      {/* Overlays */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Overlays
        </h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setSlideOpen(true)}>
            Open SlideOver
          </Button>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Trash2 className="h-4 w-4" data-icon="inline-start" />
            Delete (Dialog)
          </Button>
        </div>

        <SlideOver
          open={slideOpen}
          onOpenChange={setSlideOpen}
          title="Patient Details"
          description="Viewing full patient record."
          footer={
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setSlideOpen(false)}>
                Close
              </Button>
              <Button className="bg-brand-gradient text-white border-none">
                Save Changes
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatar name="Roger Binny" size="lg" />
              <div>
                <p className="font-display font-semibold">Roger Binny</p>
                <p className="text-sm text-ink-soft">PAT-96652 &middot; Male, 58</p>
              </div>
            </div>
            <div className="rounded-lg border border-line p-4 text-sm text-ink-soft">
              <p>This is the scrollable body area of the slide-over panel. It supports arbitrary content.</p>
            </div>
          </div>
        </SlideOver>

        <ConfirmDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Delete Patient Record?"
          description="This action cannot be undone. The patient's data will be permanently removed."
          confirmLabel="Delete"
          destructive
          onConfirm={() => console.log('Confirmed delete')}
        />
      </div>

      {/* Section Card + Sparkline */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint mb-4">
          Section Card + Sparkline
        </h2>
        <SectionCard
          title="Blood Pressure Trend"
          description="Roger Binny — last 4 readings"
        >
          <div className="flex items-center gap-6">
            <Sparkline values={[148, 142, 138, 132]} width={160} height={40} />
            <div className="text-sm text-ink-soft">
              <p>Latest: <span className="font-semibold text-ink">132/84</span> mmHg</p>
              <p className="text-ok text-xs mt-0.5">Improving trend</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <p className="text-sm text-ink-faint pb-8">
        Temporary showcase — will be replaced by the landing page.
      </p>
    </div>
  )
}
