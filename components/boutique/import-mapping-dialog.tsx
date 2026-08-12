'use client'

import { useState, useEffect } from 'react'
import { Check, AlertCircle, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
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

const CONFIDENCE_LABELS = {
  high: { label: 'Haute confiance', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Confiance moyenne', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: 'Faible confiance', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
}

function getConfidenceLevel(confidence: number): keyof typeof CONFIDENCE_LABELS {
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.75) return 'medium'
  return 'low'
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

  // Réinitialiser le mapping quand la détection change
  useEffect(() => {
    const initial: Record<string, ProductField> = {}
    for (const match of detectionResult.matches) {
      initial[match.columnName] = match.field
    }
    setMapping(initial)
  }, [detectionResult])

  const mappedFields = new Set(Object.values(mapping))
  const requiredFields = (Object.keys(FIELD_REQUIRED) as ProductField[]).filter(
    f => FIELD_REQUIRED[f]
  )
  const missingRequired = requiredFields.filter(f => !mappedFields.has(f))
  const canConfirm = missingRequired.length === 0

  const handleFieldChange = (columnName: string, field: ProductField | 'none') => {
    setMapping(prev => {
      const next = { ...prev }
      if (field === 'none') {
        delete next[columnName]
      } else {
        // Supprimer toute ancienne colonne mappée à ce champ
        for (const [col, f] of Object.entries(next)) {
          if (f === field && col !== columnName) {
            delete next[col]
          }
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

  const handleConfirm = () => {
    onConfirm(mapping)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Vérification du mapping des colonnes</span>
          </DialogTitle>
          <DialogDescription>
            Nous avons détecté automatiquement les correspondances entre vos colonnes et les champs produits.
            Vérifiez et ajustez si nécessaire avant d&apos;importer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Statut de validation */}
          {missingRequired.length > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-destructive">Champs requis manquants</p>
                <p className="mt-1 text-muted-foreground">
                  Les champs suivants sont obligatoires : {missingRequired.map(f => FIELD_LABELS[f]).join(', ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <Check className="size-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-green-700 dark:text-green-400">Mapping valide</p>
                <p className="mt-1 text-muted-foreground">
                  Tous les champs requis sont mappés. Vous pouvez procéder à l&apos;import.
                </p>
              </div>
            </div>
          )}

          {/* Aperçu des données */}
          {sampleData.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <h3 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
                <HelpCircle className="size-4" />
                Aperçu des données (premières lignes)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60">
                      {columns.map(col => (
                        <th key={col} className="px-2 py-1.5 text-left font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="border-b border-border/40 last:border-0">
                        {columns.map(col => (
                          <td key={col} className="px-2 py-1.5 text-muted-foreground truncate max-w-[150px]">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mapping des colonnes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Correspondances des colonnes</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs"
              >
                <RefreshCw className="size-3 mr-1" />
                Réinitialiser
              </Button>
            </div>

            {columns.map(columnName => {
              const currentField = mapping[columnName]
              const match = detectionResult.matches.find(m => m.columnName === columnName)
              const suggestion = detectionResult.suggestions.find(s => s.columnName === columnName)
              
              const confidenceLevel = match ? getConfidenceLevel(match.confidence) : undefined
              const confidenceInfo = confidenceLevel ? CONFIDENCE_LABELS[confidenceLevel] : undefined

              return (
                <div
                  key={columnName}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    currentField
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/60 bg-card'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Label className="text-sm font-semibold truncate">
                          {columnName}
                        </Label>
                        {match && confidenceInfo && (
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] px-1.5 py-0', confidenceInfo.className)}
                          >
                            {Math.round(match.confidence * 100)}%
                          </Badge>
                        )}
                      </div>

                      {/* Échantillon de données */}
                      {sampleData.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          Ex: {String(sampleData[0][columnName] ?? '—')}
                        </p>
                      )}

                      {/* Suggestions */}
                      {!currentField && suggestion && suggestion.possibleFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[10px] text-muted-foreground">Suggestions:</span>
                          {suggestion.possibleFields.map(({ field, confidence }) => (
                            <button
                              key={field}
                              onClick={() => handleFieldChange(columnName, field)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                            >
                              {FIELD_LABELS[field]} ({Math.round(confidence * 100)}%)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <Select
                        value={currentField ?? 'none'}
                        onValueChange={(value) => handleFieldChange(columnName, value as ProductField | 'none')}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Non mappé" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">
                            <span className="text-muted-foreground">— Non mappé —</span>
                          </SelectItem>
                          {(Object.keys(FIELD_LABELS) as ProductField[]).map(field => {
                            const isUsed = mappedFields.has(field) && currentField !== field
                            return (
                              <SelectItem
                                key={field}
                                value={field}
                                disabled={isUsed}
                                className="text-xs"
                              >
                                <span className="flex items-center gap-1.5">
                                  {FIELD_LABELS[field]}
                                  {FIELD_REQUIRED[field] && (
                                    <Badge variant="destructive" className="text-[9px] px-1 py-0">
                                      Requis
                                    </Badge>
                                  )}
                                  {isUsed && (
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                      Déjà mappé
                                    </Badge>
                                  )}
                                </span>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1"
          >
            <Check className="size-4 mr-1.5" />
            Confirmer et importer ({Object.keys(mapping).length} colonnes)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
