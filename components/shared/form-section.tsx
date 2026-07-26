import { AlertCircle, Info } from 'lucide-react'
import { DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
  description,
  action,
  className,
  children,
}: {
  icon: React.ElementType
  label: string
  /** Optional one-liner shown under the label. */
  description?: string
  /** Optional right-aligned slot in the header row. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2.5 rounded-xl border border-border bg-card/50 p-3.5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          </div>
          {description && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Labeled field wrapper with hint/error support (error replaces hint when present). */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-foreground/80">
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            {' '}
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={htmlFor && `${htmlFor}-error`} role="alert" className="flex items-center gap-1 text-[11px] font-medium text-destructive">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor && `${htmlFor}-hint`} className="text-[11px] leading-relaxed text-muted-foreground/70">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Wires aria-invalid/aria-describedby for a field's control. Usage: `<Input {...fieldA11y('p-name', { hint, error })} />`. */
export function fieldA11y(id: string, o: { hint?: string; error?: string }) {
  return {
    id,
    'aria-invalid': o.error ? true : undefined,
    'aria-describedby': o.error ? `${id}-error` : o.hint ? `${id}-hint` : undefined,
  } as const
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
      <Info className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}
