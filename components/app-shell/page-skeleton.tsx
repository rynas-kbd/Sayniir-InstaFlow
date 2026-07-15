import { Skeleton } from '@/components/ui/skeleton'

/** Header placeholder matching PageHeader's dimensions to avoid layout shift. */
function HeaderSkeleton() {
  return (
    <div className="border-b border-border px-4 py-4 md:px-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-1.5 h-4 w-56" />
    </div>
  )
}

/** Bordered list of row placeholders — matches the list-row containers. */
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

/** Stat tile placeholders matching StatCard. */
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
