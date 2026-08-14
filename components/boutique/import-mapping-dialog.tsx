'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, AlertCircle, ArrowRight, RefreshCw,
  Sparkles, Table2, Columns3, CircleAlert,
  FileSpreadsheet, Zap, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useLocale, useT } from '@/components/i18n-provider'
import { getDir } from '@/lib/i18n/config'
import type { DetectionResult, FieldMatch, ProductField } from '@/lib/import/column-detector'

interface ImportMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: string[]
  sampleData: Record<string, unknown>[]
  detectionResult: DetectionResult
  onConfirm: (mapping: Record<string, ProductField>) => void
  onCancel: () => void
}

const FIELD_LABEL_KEYS: Record<ProductField, string> = {
  name: 'boutique.importMappingDialog.fields.name',
  description: 'boutique.importMappingDialog.fields.description',
  price: 'boutique.importMappingDialog.fields.price',
  sizes: 'boutique.importMappingDialog.fields.sizes',
  colors: 'boutique.importMappingDialog.fields.colors',
  stock_quantity: 'boutique.importMappingDialog.fields.stockQuantity',
  image_url: 'boutique.importMappingDialog.fields.imageUrl',
  category: 'boutique.importMappingDialog.fields.category',
  kind: 'boutique.importMappingDialog.fields.kind',
  currency: 'boutique.importMappingDialog.fields.currency',
}

const FIELD_ICONS: Record<ProductField, string> = {
  name: '🏷️',
  description: '📝',
  price: '💰',
  sizes: '📐',
  colors: '🎨',
  stock_quantity: '📦',
  image_url: '🖼️',
  category: '🗂️',
  kind: '🔖',
  currency: '💱',
}

const FIELD_REQUIRED: Record<ProductField, boolean> = {
  name: true,
  price: true,
  description: false,
  sizes: false,
  colors: false,
  stock_quantity: false,
  image_url: false,
  category: false,
  kind: false,
  currency: false,
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.9) return 'high' as const
  if (confidence >= 0.75) return 'medium' as const
  return 'low' as const
}

const CONFIDENCE_STYLES = {
  high: {
    labelKey: 'boutique.importMappingDialog.confidence.high',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: <Sparkles className="size-3" />,
  },
  medium: {
    labelKey: 'boutique.importMappingDialog.confidence.medium',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: <Zap className="size-3" />,
  },
  low: {
    labelKey: 'boutique.importMappingDialog.confidence.low',
    dot: 'bg-orange-500',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    icon: <CircleAlert className="size-3" />,
  },
}

export function ImportMappingDialog({
  open,
  onOpenChange,
  columns,
  sampleData,
  detectionResult,
  onConfirm,
  onCancel,
}: ImportMappingDialogProps) {
  const t = useT()
  const locale = useLocale()
  // Tab-switch slide: "mapping" (first tab) enters from the reading-start
  // side, "preview" (second tab) from the reading-end side — physically
  // flips under RTL.
  const dirSign = getDir(locale) === 'rtl' ? -1 : 1
  const FIELD_LABELS = (Object.keys(FIELD_LABEL_KEYS) as ProductField[]).reduce((acc, field) => {
    acc[field] = t(FIELD_LABEL_KEYS[field])
    return acc
  }, {} as Record<ProductField, string>)
  const [mapping, setMapping] = useState<Record<string, ProductField>>(() => {
    const initial: Record<string, ProductField> = {}
    for (const match of detectionResult.matches) {
      initial[match.columnName] = match.field
    }
    return initial
  })
  const [activeTab, setActiveTab] = useState<'mapping' | 'preview'>('mapping')

  useEffect(() => {
    const initial: Record<string, ProductField> = {}
    for (const match of detectionResult.matches) {
      initial[match.columnName] = match.field
    }
    setMapping(initial)
  }, [detectionResult])

  const mappedFields = new Set(Object.values(mapping))
  const requiredFields = (Object.keys(FIELD_REQUIRED) as ProductField[]).filter(f => FIELD_REQUIRED[f])
  const missingRequired = requiredFields.filter(f => !mappedFields.has(f))
  const canConfirm = missingRequired.length === 0
  const mappedCount = Object.keys(mapping).length
  const autoDetectedCount = detectionResult.matches.length

  const handleFieldChange = (columnName: string, field: ProductField | 'none') => {
    setMapping(prev => {
      const next = { ...prev }
      if (field === 'none') {
        delete next[columnName]
      } else {
        for (const [col, f] of Object.entries(next)) {
          if (f === field && col !== columnName) delete next[col]
        }
        next[columnName] = field
      }
      return next
    })
  }

  const handleReset = () => {
    const initial: Record<string, ProductField> = {}
    for (const match of detectionResult.matches) {
      initial[match.columnName] = match.field
    }
    setMapping(initial)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] max-h-[860px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border/60">

        {/* ── HEADER ── */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/60 bg-card">
          <DialogHeader className="gap-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <FileSpreadsheet className="size-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold leading-tight">
                    {t('boutique.importMappingDialog.header.title')}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {t('boutique.importMappingDialog.header.description')}
                  </DialogDescription>
                </div>
              </div>

              {/* Stats pills */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t.plural('boutique.importMappingDialog.stats.autoDetected', autoDetectedCount)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1">
                  <Columns3 className="size-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t.plural('boutique.importMappingDialog.stats.columnsCount', columns.length)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 bg-muted/40 rounded-xl p-1 w-fit">
              {(['mapping', 'preview'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
                    activeTab === tab
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="importTabBg"
                      className="absolute inset-0 bg-card border border-border/60 rounded-lg shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {tab === 'mapping' ? <Columns3 className="size-3" /> : <Table2 className="size-3" />}
                    {tab === 'mapping'
                      ? t('boutique.importMappingDialog.tabs.mapping')
                      : t('boutique.importMappingDialog.tabs.preview')}
                  </span>
                </button>
              ))}
            </div>
          </DialogHeader>
        </div>

        {/* ── STATUS BANNER ── */}
        <AnimatePresence mode="wait">
          {missingRequired.length > 0 ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="shrink-0 mx-6 mt-3 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-destructive leading-tight">
                  {t('boutique.importMappingDialog.banner.errorTitle')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('boutique.importMappingDialog.banner.errorRequired', {
                    fields: missingRequired.map(f => FIELD_LABELS[f]).join(', '),
                  })}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="shrink-0 mx-6 mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3"
            >
              <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                  {t('boutique.importMappingDialog.banner.okTitle')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.plural('boutique.importMappingDialog.banner.okDescription', mappedCount)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CONTENT AREA ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            {activeTab === 'mapping' ? (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: -10 * dirSign }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 * dirSign }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {t.plural('boutique.importMappingDialog.mappingList.columnsToMap', columns.length)}
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-7 gap-1.5 text-xs">
                    <RefreshCw className="size-3" /> {t('boutique.importMappingDialog.mappingList.reset')}
                  </Button>
                </div>

                {/* Column cards grid */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {columns.map((columnName, i) => {
                    const currentField = mapping[columnName]
                    const match = detectionResult.matches.find(m => m.columnName === columnName)
                    const suggestion = detectionResult.suggestions.find(s => s.columnName === columnName)
                    const confidenceLevel = match ? getConfidenceLevel(match.confidence) : undefined
                    const conf = confidenceLevel
                      ? { ...CONFIDENCE_STYLES[confidenceLevel], label: t(CONFIDENCE_STYLES[confidenceLevel].labelKey) }
                      : undefined
                    const sampleVal = sampleData[0]?.[columnName]

                    return (
                      <motion.div
                        key={columnName}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035, duration: 0.25 }}
                        className={cn(
                          'group relative rounded-xl border p-3.5 transition-all duration-200',
                          currentField
                            ? 'border-primary/25 bg-primary/[0.03] shadow-sm'
                            : 'border-border/70 bg-card hover:border-border'
                        )}
                      >
                        {/* Top: column name + confidence badge */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                'size-1.5 shrink-0 rounded-full',
                                conf ? conf.dot : 'bg-muted-foreground/30'
                              )} />
                              <p className="text-sm font-bold text-foreground truncate leading-tight">
                                {columnName}
                              </p>
                            </div>
                            {sampleVal !== undefined && String(sampleVal) !== '' && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5 ps-3">
                                {t('boutique.importMappingDialog.card.samplePrefix')} <span className="font-medium">{String(sampleVal)}</span>
                              </p>
                            )}
                          </div>

                          {conf && match && (
                            <span className={cn(
                              'shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              conf.badge
                            )}>
                              {conf.icon}
                              {Math.round(match.confidence * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Confidence bar */}
                        {match && (
                          <div className="h-0.5 rounded-full bg-muted/60 mb-2.5 overflow-hidden">
                            <motion.div
                              className={cn('h-full rounded-full', conf?.bar ?? 'bg-primary')}
                              initial={{ width: 0 }}
                              animate={{ width: `${match.confidence * 100}%` }}
                              transition={{ delay: i * 0.035 + 0.15, duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        )}

                        {/* Mapping select */}
                        <div className="flex items-center gap-2">
                          <ArrowRight className="size-3.5 shrink-0 rtl:-scale-x-100 text-muted-foreground/60" />
                          <Select
                            value={currentField ?? 'none'}
                            onValueChange={(value) => handleFieldChange(columnName, value as ProductField | 'none')}
                          >
                            <SelectTrigger className={cn(
                              'flex-1 h-8 text-xs rounded-lg border-border/70 bg-muted/20 font-medium',
                              currentField && 'border-primary/30 bg-primary/5 text-foreground'
                            )}>
                              <SelectValue placeholder={t('boutique.importMappingDialog.card.unmappedPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">
                                <span className="text-muted-foreground italic">
                                  {t('boutique.importMappingDialog.card.unmappedOption')}
                                </span>
                              </SelectItem>
                              {(Object.keys(FIELD_LABELS) as ProductField[]).map(field => {
                                const isUsed = mappedFields.has(field) && currentField !== field
                                return (
                                  <SelectItem key={field} value={field} disabled={isUsed} className="text-xs">
                                    <span className="flex items-center gap-1.5">
                                      <span>{FIELD_ICONS[field]}</span>
                                      {FIELD_LABELS[field]}
                                      {FIELD_REQUIRED[field] && (
                                        <span className="ms-auto text-[9px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 rounded px-1 py-0.5">
                                          {t('boutique.importMappingDialog.card.requiredBadge')}
                                        </span>
                                      )}
                                      {isUsed && (
                                        <span className="ms-auto text-[9px] font-semibold text-muted-foreground">
                                          {t('boutique.importMappingDialog.card.alreadyMapped')}
                                        </span>
                                      )}
                                    </span>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Suggestion chips */}
                        {!currentField && suggestion && suggestion.possibleFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground me-0.5 self-center">
                              {t('boutique.importMappingDialog.card.suggestionsLabel')}
                            </span>
                            {suggestion.possibleFields.slice(0, 3).map(({ field, confidence }) => (
                              <button
                                key={field}
                                type="button"
                                onClick={() => handleFieldChange(columnName, field)}
                                className="flex items-center gap-1 rounded-full border border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-all duration-150"
                              >
                                {FIELD_ICONS[field]} {FIELD_LABELS[field]}
                                <span className="opacity-60">({Math.round(confidence * 100)}%)</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Mapped field indicator */}
                        {currentField && (
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-primary/15">
                            <Check className="size-3 text-primary" />
                            <span className="text-[11px] font-semibold text-primary">
                              {FIELD_ICONS[currentField]} {FIELD_LABELS[currentField]}
                            </span>
                            {FIELD_REQUIRED[currentField] && (
                              <span className="ms-auto text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                {t('boutique.importMappingDialog.card.requiredCheck')}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 10 * dirSign }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 * dirSign }}
                transition={{ duration: 0.2 }}
              >
                {sampleData.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Table2 className="size-10 text-muted-foreground/30 stroke-[1.25]" />
                    <p className="text-sm text-muted-foreground">{t('boutique.importMappingDialog.preview.empty')}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/60">
                            {columns.map(col => (
                              <th key={col} className="px-3 py-2.5 text-start font-semibold whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>{col}</span>
                                  {mapping[col] && (
                                    <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5 whitespace-nowrap">
                                      {FIELD_ICONS[mapping[col]]} {FIELD_LABELS[mapping[col]]}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                              {columns.map(col => (
                                <td key={col} className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                                  {String(row[col] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="border-t border-border/40 bg-muted/20 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">
                        {t.plural('boutique.importMappingDialog.preview.showingRows', Math.min(5, sampleData.length), {
                          total: sampleData.length,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 border-t border-border/60 bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl h-10">
              {t('boutique.importMappingDialog.footer.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(mapping)}
              disabled={!canConfirm}
              className="flex-1 h-10 rounded-xl font-bold gap-2"
            >
              <Check className="size-4" />
              {t('boutique.importMappingDialog.footer.confirm')}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold">
                {t('boutique.importMappingDialog.footer.columnsBadge', { count: mappedCount })}
              </span>
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
