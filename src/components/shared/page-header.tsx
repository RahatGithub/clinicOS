interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-[28px] font-semibold text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {actions && (
        <div className="mt-3 flex items-center gap-2 sm:mt-0">{actions}</div>
      )}
    </div>
  )
}
