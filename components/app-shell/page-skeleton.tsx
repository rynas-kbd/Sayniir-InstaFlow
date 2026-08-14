import { Skeleton } from '@/components/ui/skeleton'

/** Header placeholder matching PageHeader's dimensions to avoid layout shift. */
export function HeaderSkeleton({ hasActions = false }: { hasActions?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-6">
      <div className="min-w-0">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1.5 h-4 w-56" />
      </div>
      {hasActions && (
        <Skeleton className="h-9 w-28 rounded-lg" />
      )}
    </div>
  )
}

/** Original generic list-row container skeleton to avoid breaking any other routes. */
function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-1.5 h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Original generic stat cards grid. */
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card px-4 py-3.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-6 w-14" />
        </div>
      ))}
    </div>
  )
}

/** Default full-page skeleton: header + optional stats + list. */
export function PageSkeleton({ stats = false, rows = 5 }: { stats?: boolean; rows?: number }) {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="space-y-4 p-4 md:p-6">
        {stats && <StatsSkeleton />}
        <ListSkeleton rows={rows} />
      </div>
    </div>
  )
}

/** 1. Dashboard specific skeleton loader */
export function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton hasActions />
      <div className="flex-1 space-y-6 p-4 md:p-6 overflow-y-auto">
        {/* Welcome Premium Banner */}
        <div className="glass-banner rounded-2xl p-6 sm:p-8 h-[140px] flex flex-col justify-center relative overflow-hidden">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-3 h-6 w-80 max-w-full" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-4.5 rounded" />
              </div>
              <Skeleton className="mt-3.5 h-7 w-16" />
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column: Activity feed */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border/40 p-4 flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1.5 h-3 w-48" />
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <div className="divide-y divide-border/40">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
                  <Skeleton className="size-9 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-40 max-w-full" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Connected accounts */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border/40 p-4 flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-1.5 h-3 w-36" />
                </div>
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <div className="p-4 space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="size-6 rounded-lg shrink-0" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Active rules summary */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border/40 p-4 flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1.5 h-3 w-36" />
                </div>
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <div className="p-4 space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/50 bg-muted/10 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="size-2 rounded-full" />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <Skeleton className="h-8 w-3/4 rounded-[14px] rounded-es-[2px]" />
                      <Skeleton className="h-8 w-2/3 self-end rounded-[14px] rounded-ee-[2px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 2. Analytics specific skeleton loader */
export function AnalyticsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        {/* Intro banner */}
        <div className="glass-banner rounded-2xl p-5 flex items-center justify-between gap-4 h-[72px] relative overflow-hidden">
          <div className="flex items-center gap-3.5 min-w-0">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="hidden sm:block h-6.5 w-32 rounded-full shrink-0" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-4.5 rounded" />
              </div>
              <Skeleton className="mt-3.5 h-7 w-16" />
            </div>
          ))}
        </div>

        {/* Large chart card */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border/40 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-3 w-64" />
          </div>
          <div className="p-6">
            <div className="h-[300px] flex items-end justify-between gap-4 pt-10 px-4">
              {Array.from({ length: 14 }).map((_, i) => {
                const heights = [40, 65, 30, 85, 55, 75, 45, 90, 60, 40, 80, 50, 70, 35]
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end">
                    <div className="w-full rounded-t bg-muted/50 animate-pulse" style={{ height: `${heights[i]}%` }} />
                    <Skeleton className="h-2 w-6" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 3. Inbox split-screen skeleton loader — matches organic redesign */
export function InboxSkeleton() {
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ─── Left sidebar skeleton ─── */}
      <div
        className="hidden w-[300px] shrink-0 flex-col overflow-hidden border-e md:flex"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg, var(--background)) 55%, transparent)',
          borderColor: 'color-mix(in srgb, var(--organic-terracotta, var(--border)) 10%, transparent)',
        }}
      >
        {/* Sidebar header */}
        <div
          className="shrink-0 px-4 pt-5 pb-3"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 40%, transparent)' }}
        >
          {/* Title row */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Accent bar */}
              <Skeleton className="h-5 w-[3px] rounded-full" />
              <div>
                <Skeleton className="h-4.5 w-14" />
                <Skeleton className="mt-1 h-3 w-28" />
              </div>
            </div>
            <Skeleton className="size-5 rounded-full" />
          </div>

          {/* Filter pill bar */}
          <div
            className="flex gap-1 rounded-xl p-1 h-9"
            style={{ background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="mx-1.5 my-0.5 flex items-center gap-3 rounded-xl px-3 py-3">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right thread panel skeleton ─── */}
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: 'color-mix(in srgb, var(--background) 45%, transparent)' }}
      >
        {/* Thread header */}
        <div
          className="flex h-14 shrink-0 items-center justify-between gap-3 px-4"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 40%, transparent)' }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-[34px] rounded-full shrink-0" />
            <div>
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="mt-1 h-2.5 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-4">
          {/* Date separator */}
          <div className="flex items-center gap-3 my-6">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* Incoming bubble */}
          <div className="flex justify-start">
            <div className="flex max-w-[60%] flex-col gap-1 items-start">
              <Skeleton className="h-11 w-[220px] rounded-2xl rounded-ss-[4px]" />
              <Skeleton className="h-2.5 w-10" />
            </div>
          </div>

          {/* Outgoing bubble — terracotta tinted */}
          <div className="flex justify-end mt-1">
            <div className="flex max-w-[60%] flex-col gap-1 items-end">
              <Skeleton
                className="h-9 w-[180px] rounded-2xl rounded-se-[4px]"
                style={{ opacity: 0.7 }}
              />
              <Skeleton className="h-2.5 w-10" />
            </div>
          </div>

          {/* Auto-reply label + bubble */}
          <div className="flex justify-end mt-4">
            <div className="flex max-w-[60%] flex-col gap-1 items-end">
              <Skeleton className="h-3 w-28 mb-0.5" />
              <Skeleton className="h-16 w-[260px] rounded-2xl rounded-se-[4px]" style={{ opacity: 0.6 }} />
              <Skeleton className="h-2.5 w-10" />
            </div>
          </div>

          {/* Another incoming bubble */}
          <div className="flex justify-start mt-4">
            <div className="flex max-w-[60%] flex-col gap-1 items-start">
              <Skeleton className="h-14 w-[280px] rounded-2xl rounded-ss-[4px]" />
              <Skeleton className="h-2.5 w-10" />
            </div>
          </div>
        </div>

        {/* Composer */}
        <div
          className="flex shrink-0 items-end gap-2 p-3"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 40%, transparent)' }}
        >
          <Skeleton className="size-9 rounded-xl shrink-0" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="size-9 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  )
}


/** 4. Contacts page table skeleton */
export function ContactsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton hasActions />
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-muted/40 border-b border-border/60 px-5 py-4 grid grid-cols-4 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="hidden sm:block h-4 w-28" />
            <Skeleton className="h-4 w-16 justify-self-end" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="size-9 rounded-xl shrink-0" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
                <div className="hidden sm:block">
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <div className="flex items-center gap-1.5 justify-self-end">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** 5. RDV Calendar Slots skeleton */
export function RdvSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="flex-1 space-y-5 p-4 md:p-6 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="size-4 rounded" />
              </div>
              <Skeleton className="mt-3 h-6 w-14" />
            </div>
          ))}
        </div>

        {/* Appointments Grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3.5 rounded" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3.5 rounded" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 6. Leads Pipeline skeleton */
export function LeadsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="flex-1 space-y-5 p-4 md:p-6 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="size-4 rounded" />
              </div>
              <Skeleton className="mt-3 h-6 w-14" />
            </div>
          ))}
        </div>

        {/* Leads Grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20 mt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4.5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 7. Boutique page skeleton loader */
export function BoutiqueSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Hero Banner */}
        <div className="rounded-2xl bg-muted/40 px-6 py-7 h-[120px] flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="hidden sm:flex flex-col gap-2 shrink-0">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 h-[46px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-full rounded-lg" />
          ))}
        </div>

        {/* Product Table placeholder */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-muted/40 border-b border-border/60 px-5 py-4 grid grid-cols-4 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16 justify-self-end" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg shrink-0" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-16 rounded-lg justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** 8. Flows page visual list skeleton */
export function FlowsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header glass banner */}
      <div className="glass-banner border-b border-border/40 px-6 py-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
        </div>

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-32 rounded-full" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
        {/* Toggle Banner */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between h-[64px]">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6.5 w-11 rounded-full" />
        </div>

        {/* Grid of FlowCards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="space-y-2.5 border-t border-border/40 pt-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-5 rounded" />
              </div>
            </div>
          ))}
          {/* Dashed Create Card */}
          <div className="h-[154px] rounded-xl border border-dashed border-border bg-transparent flex flex-col items-center justify-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** 9. Flow Builder canvas skeleton */
export function FlowBuilderSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Top toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 h-[49px]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <div className="h-4 w-px bg-border shrink-0" />
          <Skeleton className="h-4.5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      {/* Canvas area grid */}
      <div className="flex-1 bg-muted/5 relative overflow-hidden" 
        style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 w-full max-w-sm p-6">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-40" />
              <div className="h-px bg-border/60" />
              <div className="flex justify-end">
                <Skeleton className="h-7 w-12 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 10. Campaigns page skeleton loader */
export function CampaignsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton hasActions />
      <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-4.5 rounded" />
              </div>
              <Skeleton className="mt-3.5 h-7 w-16" />
            </div>
          ))}
        </div>

        {/* Campaigns grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4.5 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="space-y-2 border-t border-border/40 pt-3.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
          {/* Dashed Create Card Button */}
          <div className="h-[188px] rounded-xl border border-dashed border-border bg-transparent flex flex-col items-center justify-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** 11. Automation rules page skeleton loader */
export function AutomationSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-4.5 rounded" />
              </div>
              <Skeleton className="mt-3.5 h-7 w-16" />
            </div>
          ))}
        </div>

        {/* Tabs line */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg bg-muted p-0.5 h-[34px] w-48">
            <Skeleton className="flex-1 h-full rounded" />
            <Skeleton className="flex-1 h-full rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* Automation cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <div className="space-y-2 border-t border-border/40 pt-3.5">
                <Skeleton className="h-8 w-5/6 rounded-[14px] rounded-es-[2px]" />
                <Skeleton className="h-8 w-2/3 self-end rounded-[14px] rounded-ee-[2px]" />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/20">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-4 rounded" />
              </div>
            </div>
          ))}
          {/* Dashed Create Card */}
          <div className="h-[220px] rounded-xl border border-dashed border-border bg-transparent flex flex-col items-center justify-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** 12. Accounts/Channels integration skeleton loader */
export function AccountsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton hasActions />
      <div className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="size-4 rounded" />
              </div>
              <Skeleton className="mt-3 h-6 w-14" />
            </div>
          ))}
        </div>

        {/* Account cards grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-full shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 13. Settings page skeleton loader */
export function SettingsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-w-2xl mx-auto w-full">
        {/* Profile Glass Banner */}
        <div className="glass-banner rounded-2xl p-5 flex items-center gap-4 h-[94px] relative overflow-hidden">
          <Skeleton className="size-14 rounded-full shrink-0" />
          <div className="space-y-1.5 min-w-0">
            <Skeleton className="h-4.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Account Info Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border/40 p-4">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="size-3.5 shrink-0" />
                <Skeleton className="w-36 shrink-0 h-3.5" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>

        {/* Billing Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>

        {/* Team Members Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <Skeleton className="h-4.5 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-7 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
