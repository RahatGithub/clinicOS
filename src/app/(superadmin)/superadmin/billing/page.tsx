'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Download,
  Receipt,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader,
  StatCard,
  SectionCard,
  DataTable,
  StatusBadge,
  SlideOver,
} from '@/components/shared'
import type { DataTableColumn } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { payments as initialPayments } from '@/lib/data'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Payment } from '@/types'

// ── Row type ──
interface PaymentRow {
  id: string
  transactionId: string
  tenantName: string
  plan: string
  amount: number
  currency: string
  date: string
  status: string
  [key: string]: unknown
}

function toRows(list: Payment[]): PaymentRow[] {
  return list.map((p) => ({
    id: p.id,
    transactionId: p.transactionId,
    tenantName: p.tenantName,
    plan: p.plan,
    amount: p.amount,
    currency: p.currency,
    date: p.date,
    status: p.status,
  }))
}

// ── CSV export ──
function downloadCSV(payments: Payment[]) {
  const header = 'Transaction ID,Tenant,Plan,Amount,Currency,Date,Status'
  const rows = payments.map(
    (p) =>
      `${p.transactionId},${p.tenantName},${p.plan},${p.amount},${p.currency},${p.date.split('T')[0]},${p.status}`
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'clinicos-payments.csv'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV downloaded')
}

// ── Month options ──
const monthOptions = [
  { label: 'All months', value: 'all' },
  { label: 'June 2026', value: '2026-06' },
  { label: 'May 2026', value: '2026-05' },
  { label: 'April 2026', value: '2026-04' },
  { label: 'March 2026', value: '2026-03' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const },
  }),
}

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null)

  const data = initialPayments

  // ── Computed stats ──
  const totalPaid = data
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)
  const overdueAmount = data
    .filter((p) => p.status === 'overdue')
    .reduce((s, p) => s + p.amount, 0)
  const failedCount = data.filter((p) => p.status === 'failed').length
  const thisMonthRev = data
    .filter((p) => p.date.startsWith('2026-06') && p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)

  // ── Filters ──
  const filtered = useMemo(() => {
    let result = data
    if (statusFilter !== 'all')
      result = result.filter((p) => p.status === statusFilter)
    if (monthFilter !== 'all')
      result = result.filter((p) => p.date.startsWith(monthFilter))
    return result
  }, [data, statusFilter, monthFilter])

  const rows = useMemo(() => toRows(filtered), [filtered])

  // ── Table columns ──
  const columns: DataTableColumn<PaymentRow>[] = [
    {
      key: 'transactionId',
      header: 'Transaction',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-ink-soft">
          {row.transactionId}
        </span>
      ),
    },
    { key: 'tenantName', header: 'Tenant', sortable: true },
    { key: 'plan', header: 'Plan', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="font-medium">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (row) => (
        <span className="text-ink-soft">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & payments"
        description="Track payments and invoices across all tenants."
        actions={
          <Button variant="outline" onClick={() => downloadCSV(data)}>
            <Download className="h-4 w-4" data-icon="inline-start" />
            Export CSV
          </Button>
        }
      />

      {/* Stats */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Total Collected"
          value={formatCurrency(totalPaid, 'USD')}
          icon={DollarSign}
          accent
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(overdueAmount, 'USD')}
          icon={AlertTriangle}
          trend={
            overdueAmount > 0
              ? { value: '1 invoice', direction: 'down' }
              : undefined
          }
        />
        <StatCard
          label="Failed Payments"
          value={failedCount}
          icon={XCircle}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(thisMonthRev, 'USD')}
          icon={TrendingUp}
          trend={{ value: '+12% vs May', direction: 'up' }}
        />
      </motion.div>

      {/* Payments table */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <SectionCard noPadding>
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
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
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-ink-faint whitespace-nowrap">
                  Month
                </Label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-ink outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                >
                  {monthOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <span className="text-xs text-ink-faint">
              Processed via Stripe
            </span>
          </div>
          <div className="p-1">
            <DataTable
              columns={columns}
              data={rows}
              searchable
              searchKeys={['tenantName', 'transactionId']}
              pageSize={10}
              onRowClick={(row) => {
                const payment = data.find((p) => p.id === row.id)
                if (payment) setDetailPayment(payment)
              }}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* Payment detail SlideOver */}
      {detailPayment && (
        <PaymentDetailSlideOver
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Payment detail slide-over (faux Stripe invoice)
// ═══════════════════════════════════════════════
function PaymentDetailSlideOver({
  payment,
  onClose,
}: {
  payment: Payment
  onClose: () => void
}) {
  return (
    <SlideOver
      open
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title="Payment Details"
      description={payment.transactionId}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            variant="outline"
            onClick={() => toast.info('Invoice PDF coming soon')}
          >
            <Download className="h-4 w-4" data-icon="inline-start" />
            Download Invoice
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={payment.status} />
          <span className="text-sm text-ink-soft">
            {formatDate(payment.date)}
          </span>
        </div>

        {/* Invoice summary */}
        <div className="rounded-lg border border-line">
          <div className="border-b border-line-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-ink-faint" />
              <span className="text-sm font-semibold text-ink">
                Invoice Summary
              </span>
            </div>
          </div>
          <div className="divide-y divide-line-soft">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-ink-soft">Tenant</span>
              <span className="font-medium text-ink">
                {payment.tenantName}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-ink-soft">Plan</span>
              <span className="font-medium text-ink">{payment.plan}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-ink-soft">Billing period</span>
              <span className="text-ink-soft">
                {formatDate(payment.date)} — 1 month
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="text-ink">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-ink-soft">Tax</span>
              <span className="text-ink-soft">$0.00</span>
            </div>
            <div className="flex items-center justify-between bg-line-soft/30 px-4 py-3 text-sm">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-lg font-bold text-ink">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="rounded-lg border border-line-soft bg-line-soft/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-line">
              <CreditCard className="h-4 w-4 text-ink-faint" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-ink">
                {payment.status === 'paid' || payment.status === 'refunded'
                  ? 'Paid via'
                  : 'Card on file'}
              </p>
              <p className="text-ink-soft">Visa ending in •••• 4242</p>
            </div>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="text-xs text-ink-faint">
          <p>
            Transaction ID:{' '}
            <span className="font-mono">{payment.transactionId}</span>
          </p>
          <p>
            Internal ID:{' '}
            <span className="font-mono">{payment.id}</span>
          </p>
        </div>
      </div>
    </SlideOver>
  )
}
