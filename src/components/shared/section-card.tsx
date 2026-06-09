import { cn } from '@/lib/utils'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  noPadding?: boolean
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  noPadding = false,
}: SectionCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white">
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
          <div>
            {title && (
              <h3 className="font-display text-base font-semibold text-ink">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-5')}>{children}</div>
    </div>
  )
}
