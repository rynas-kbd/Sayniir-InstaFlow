import { DialogTitle } from '@/components/ui/dialog'

// Shared visual primitives for form dialogs and inline configuration cards
// across the app — icon-chip header + grouped, labeled sections. Extracted
// from the pattern first established in automation/rule-form-dialog.tsx.

export function FormDialogHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <DialogTitle className="text-base">{title}</DialogTitle>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

export function FormSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card/50 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary" strokeWidth={1.75} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  )
}
