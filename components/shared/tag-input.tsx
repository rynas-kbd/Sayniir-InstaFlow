'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'

/** Splits raw input on commas/newlines/semicolons, trims, drops empties, and dedupes
 * case-insensitively against `existing` (and within the new batch). Pure — testable without DOM. */
export function normalizeTags(raw: string, existing: string[], maxTags?: number): string[] {
  const existingLower = new Set(existing.map((t) => t.toLowerCase()))
  const fresh: string[] = []
  for (const piece of raw.split(/[,;\n]/)) {
    const tag = piece.trim()
    if (!tag) continue
    const lower = tag.toLowerCase()
    if (existingLower.has(lower)) continue
    existingLower.add(lower)
    fresh.push(tag)
    if (maxTags !== undefined && existing.length + fresh.length >= maxTags) break
  }
  return fresh
}

export interface TagInputProps {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  maxTags?: number
  invalid?: boolean
  describedBy?: string
}

/** Chip editor for string[] fields (sizes, colors, …). Raw elements throughout — no `data-slot` —
 * because globals.css forces `border-radius: 999px` on any `data-slot="input"|"badge"` via an
 * unlayered rule that beats every `rounded-*` utility. */
export function TagInput({ id, value, onChange, placeholder, maxTags, invalid, describedBy }: TagInputProps) {
  const t = useT()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const atLimit = maxTags !== undefined && value.length >= maxTags

  function commit(raw: string) {
    if (!raw.trim()) {
      setDraft('')
      return
    }
    const fresh = normalizeTags(raw, value, maxTags)
    if (fresh.length > 0) onChange([...value, ...fresh])
    setDraft('')
  }

  function removeLast() {
    if (value.length === 0) return
    onChange(value.slice(0, -1))
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault() // critical — Enter must never submit the surrounding form
      commit(draft)
    } else if (e.key === 'Backspace' && draft === '') {
      removeLast()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // must not bubble to a Dialog and close it mid-edit
      setDraft('')
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (/[,;\n]/.test(text)) {
      e.preventDefault()
      commit(text)
    }
  }

  return (
    <div
      role="group"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }}
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-2xl border border-input bg-transparent px-2 py-1.5 transition-colors',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        invalid && 'border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40',
      )}
    >
      {value.map((tag) => (
        <TagChip key={tag} tag={tag} onRemove={() => remove(tag)} />
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        onPaste={handlePaste}
        disabled={atLimit}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      <span className="sr-only" aria-live="polite">
        {t('shared.tagInput.itemCount', { count: value.length })}
      </span>
    </div>
  )
}

function TagChip({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  const t = useT()
  return (
    <span className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 py-0.5 pl-2.5 pr-1 text-[11px] font-medium">
      {tag}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('shared.tagInput.remove', { tag })}
        className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
