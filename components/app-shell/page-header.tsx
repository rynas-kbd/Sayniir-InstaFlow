import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="relative flex flex-col gap-3 border-b border-[color-mix(in_srgb,var(--organic-terracotta)_12%,transparent)] bg-[color-mix(in_srgb,var(--organic-bg)_50%,transparent)] px-4 py-4 backdrop-blur-md dark:bg-[color-mix(in_srgb,var(--organic-surface)_40%,transparent)] dark:border-[color-mix(in_srgb,var(--organic-terracotta)_10%,transparent)] sm:flex-row sm:items-center sm:justify-between md:px-6">
      {/* Subtle terracotta aurora — top right */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-48 opacity-[0.06]"
        style={{
          background: 'linear-gradient(to left, var(--organic-terracotta), transparent)',
        }}
      />

      <div className="relative min-w-0 flex items-center gap-3">
        {/* Left accent line */}
        <div
          className="shrink-0 w-[3px] self-stretch rounded-full"
          style={{ background: 'linear-gradient(to bottom, var(--organic-terracotta), color-mix(in srgb, var(--organic-sage) 80%, transparent))' }}
        />
        <div>
          <h1 className="text-[15px] font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p
              className="mt-0.5 text-[12.5px]"
              style={{ color: 'color-mix(in srgb, var(--organic-text, var(--foreground)) 55%, transparent)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="relative flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
