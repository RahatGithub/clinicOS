import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'green' | 'amber' | 'red' | 'orange' | 'gray'
  className?: string
}

const statusMap: Record<string, StatusBadgeProps['variant']> = {
  active: 'green',
  confirmed: 'green',
  completed: 'green',
  paid: 'green',
  done: 'green',
  pending: 'amber',
  waiting: 'amber',
  trial: 'amber',
  on_leave: 'amber',
  not_arrived: 'amber',
  overdue: 'red',
  cancelled: 'red',
  failed: 'red',
  suspended: 'red',
  inactive: 'red',
  refunded: 'red',
  in_progress: 'orange',
  with_doctor: 'orange',
}

const variantStyles: Record<string, string> = {
  green: 'bg-ok/10 text-ok',
  amber: 'bg-warn/10 text-warn',
  red: 'bg-danger/10 text-danger',
  orange: 'bg-brand/10 text-brand-deep',
  gray: 'bg-ink-faint/10 text-ink-faint',
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolved = variant ?? statusMap[status] ?? 'gray'
  const label = status.replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        variantStyles[resolved],
        className
      )}
    >
      {label}
    </span>
  )
}
