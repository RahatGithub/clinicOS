import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' }
  accent?: boolean
}

const trendConfig = {
  up: { Icon: TrendingUp, color: 'text-ok' },
  down: { Icon: TrendingDown, color: 'text-danger' },
  neutral: { Icon: Minus, color: 'text-ink-faint' },
}

export function StatCard({ label, value, icon: Icon, trend, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
            {label}
          </p>
          <p className="font-display text-2xl font-semibold text-ink">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              accent ? 'bg-brand-gradient text-white' : 'bg-brand-tint text-brand'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', trendConfig[trend.direction].color)}>
          {(() => {
            const TrendIcon = trendConfig[trend.direction].Icon
            return <TrendIcon className="h-3.5 w-3.5" />
          })()}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  )
}
