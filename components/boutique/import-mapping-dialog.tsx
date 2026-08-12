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

const FIELD_LABELS: Record<ProductField, string> = {
  name: 'Nom du produit',
  description: 'Description',
  price: 'Prix',
  sizes: 'Tailles',
  colors: 'Couleurs',
  stock_quantity: 'Stock',
  image_url: 'URL image',
  category: 'Catégorie',
  kind: 'Type',
  currency: 'Devise',
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

const CONFIDENCE_CONFIG = {
  high: {
    label: 'Détection automatique',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: <Sparkles className="size-3" />,
  },
  medium: {
    label: 'Confiance moyenne',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: <Zap className="size-3" />,
  },
  low: {
    label: 'Faible confiance',
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
                    Mapping des colonnes
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Vérifiez les correspondances détectées automatiquement
                  </DialogDescription>
                </div>
              </div>

              {/* Stats pills */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {autoDetectedCount} auto-détectées
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1">
                  <Columns3 className="size-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {columns.length} colonnes
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
                    {tab === 'mapping' ? 'Correspondances' : 'Aperçu données'}
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
                <p className="text-xs font-bold text-destructive leading-tight">Champs requis manquants</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Obligatoires : {missingRequired.map(f => FIELD_LABELS[f]).join(', ')}
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
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-tight">Mapping valide</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mappedCount} colonne(s) mappée(s) — prêt à importer.
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {columns.length} colonne(s) à mapper
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-7 gap-1.5 text-xs">
                    <RefreshCw className="size-3" /> Réinitialiser
                  </Button>
                </div>

                {/* Column cards grid */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {columns.map((columnName, i) => {
                    const currentField = mapping[columnName]
                    const match = detectionResult.matches.find(m => m.columnName === columnName)
                    const suggestion = detectionResult.suggestions.find(s => s.columnName === columnName)
                    const confidenceLevel = match ? getConfidenceLevel(match.confidence) : undefined
                    const conf = confidenceLevel ? CONFIDENCE_CONFIG[confidenceLevel] : undefined
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
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5 pl-3">
                                ex: <span className="font-medium">{String(sampleVal)}</span>
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
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                          <Select
                            value={currentField ?? 'none'}
                            onValueChange={(value) => handleFieldChange(columnName, value as ProductField | 'none')}
                          >
                            <SelectTrigger className={cn(
                              'flex-1 h-8 text-xs rounded-lg border-border/70 bg-muted/20 font-medium',
                              currentField && 'border-primary/30 bg-primary/5 text-foreground'
                            )}>
                              <SelectValue placeholder="Non mappé" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">
                                <span className="text-muted-foreground italic">— Non mappé —</span>
                              </SelectItem>
                              {(Object.keys(FIELD_LABELS) as ProductField[]).map(field => {
                                const isUsed = mappedFields.has(field) && currentField !== field
                                return (
                                  <SelectItem key={field} value={field} disabled={isUsed} className="text-xs">
                                    <span className="flex items-center gap-1.5">
                                      <span>{FIELD_ICONS[field]}</span>
                                      {FIELD_LABELS[field]}
                                      {FIELD_REQUIRED[field] && (
                                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 rounded px-1 py-0.5">
                                          requis
                                        </span>
                                      )}
                                      {isUsed && (
                                        <span className="ml-auto text-[9px] font-semibold text-muted-foreground">
                                          déjà mappé
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
                            <span className="text-[10px] text-muted-foreground mr-0.5 self-center">Suggestions :</span>
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
                              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                ✓ requis
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
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {sampleData.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Table2 className="size-10 text-muted-foreground/30 stroke-[1.25]" />
                    <p className="text-sm text-muted-foreground">Aucune donnée disponible pour l&apos;aperçu</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/60">
                            {columns.map(col => (
                              <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
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
                        Affichage de {Math.min(5, sampleData.length)} ligne(s) sur {sampleData.length}
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
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(mapping)}
              disabled={!canConfirm}
              className="flex-1 h-10 rounded-xl font-bold gap-2"
            >
              <Check className="size-4" />
              Confirmer et importer
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold">
                {mappedCount} col.
              </span>
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
