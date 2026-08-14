'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ImportMappingDialog } from './import-mapping-dialog'
import { detectColumnMapping, createMappingDictionary, type ProductField, type DetectionResult } from '@/lib/import/column-detector'
import { useT } from '@/components/i18n-provider'
import type { Product } from './types'

/**
 * Composant d'import intelligent avec détection automatique des colonnes.
 * Supporte CSV, JSON et Google Sheets avec reconnaissance flexible des noms de colonnes.
 */
export function ProductImportActions({
  channelAccountId,
  onImported,
}: {
  channelAccountId: string
  onImported: (products: Product[]) => void
}) {
  const t = useT()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [syncing, setSyncing] = useState(false)

  // État pour le dialogue de mapping
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [pendingImportData, setPendingImportData] = useState<{
    type: 'file' | 'sheet'
    file?: File
    columns: string[]
    sampleData: Record<string, unknown>[]
    detectionResult: DetectionResult
  } | null>(null)

  async function parseFilePreview(file: File): Promise<{
    columns: string[]
    sampleData: Record<string, unknown>[]
  }> {
    const text = await file.text()
    const fileName = file.name.toLowerCase()

    let rows: Record<string, unknown>[] = []

    if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(text)
      rows = Array.isArray(parsed) ? parsed : [parsed]
    } else if (fileName.endsWith('.csv')) {
      rows = parseCSV(text)
    } else {
      throw new Error(t('boutique.productImportActions.errors.unsupportedFormat'))
    }

    if (rows.length === 0) {
      throw new Error(t('boutique.productImportActions.errors.noDataFound'))
    }

    const columns = Object.keys(rows[0])
    const sampleData = rows.slice(0, 5) // Prendre les 5 premières lignes comme échantillon

    return { columns, sampleData }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      // Analyser le fichier pour détecter les colonnes
      const { columns, sampleData } = await parseFilePreview(file)
      const detectionResult = detectColumnMapping(columns, sampleData[0])

      // Ouvrir le dialogue de mapping
      setPendingImportData({
        type: 'file',
        file,
        columns,
        sampleData,
        detectionResult,
      })
      setMappingDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('boutique.productImportActions.errors.parseFileFailed'))
    } finally {
      setImporting(false)
    }
  }

  async function handleSheetPreview() {
    if (!sheetUrl.trim()) return
    setSyncing(true)

    try {
      // Appeler l'API pour prévisualiser le Google Sheet
      const res = await fetch('/api/products/preview-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('boutique.productImportActions.errors.sheetReadFailed'))

      const { columns, sampleData } = data
      const detectionResult = detectColumnMapping(columns, sampleData[0])

      // Ouvrir le dialogue de mapping
      setPendingImportData({
        type: 'sheet',
        columns,
        sampleData,
        detectionResult,
      })
      setMappingDialogOpen(true)
      setSheetOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('boutique.productImportActions.errors.sheetParseFailed'))
    } finally {
      setSyncing(false)
    }
  }

  async function handleConfirmMapping(mapping: Record<string, ProductField>) {
    if (!pendingImportData) return

    try {
      if (pendingImportData.type === 'file' && pendingImportData.file) {
        // Import du fichier avec le mapping personnalisé
        const formData = new FormData()
        formData.append('file', pendingImportData.file)
        formData.append('accountId', channelAccountId)
        formData.append('mapping', JSON.stringify(mapping))

        const res = await fetch('/api/products/import', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? t('boutique.productImportActions.errors.importFailed'))

        onImported(data.products ?? [])
        toast.success(t.plural('boutique.productImportActions.toast.importSuccess', data.imported))
      } else if (pendingImportData.type === 'sheet') {
        // Synchronisation du Google Sheet avec le mapping personnalisé
        const res = await fetch('/api/products/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: channelAccountId,
            sheetUrl: sheetUrl.trim(),
            mapping,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? t('boutique.productImportActions.errors.syncFailed'))

        onImported(data.products ?? [])
        toast.success(t.plural('boutique.productImportActions.toast.syncSuccess', data.synced))
        setSheetUrl('')
      }

      setMappingDialogOpen(false)
      setPendingImportData(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('boutique.productImportActions.errors.genericImportError'))
    }
  }

  function handleCancelMapping() {
    setMappingDialogOpen(false)
    setPendingImportData(null)
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="relative"
        >
          <Upload className="size-3.5" />
          {importing
            ? t('boutique.productImportActions.buttons.analyzing')
            : t('boutique.productImportActions.buttons.importCsvJson')}
          <Sparkles className="absolute -end-1 -top-1 size-3 text-primary animate-pulse" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleFile}
        />

        <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
          <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="relative" />}>
            <FileSpreadsheet className="size-3.5" /> {t('boutique.productImportActions.buttons.syncGoogleSheet')}
            <Sparkles className="absolute -end-1 -top-1 size-3 text-primary animate-pulse" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                {t('boutique.productImportActions.sheetDialog.title')}
              </DialogTitle>
              <DialogDescription>
                {t('boutique.productImportActions.sheetDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="sheet-url">{t('boutique.productImportActions.sheetDialog.urlLabel')}</Label>
              <Input
                id="sheet-url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleSheetPreview}
                disabled={syncing || !sheetUrl.trim()}
              >
                {syncing
                  ? t('boutique.productImportActions.buttons.analyzing')
                  : t('boutique.productImportActions.buttons.analyzeAndContinue')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialogue de mapping intelligent */}
      {pendingImportData && (
        <ImportMappingDialog
          open={mappingDialogOpen}
          onOpenChange={setMappingDialogOpen}
          columns={pendingImportData.columns}
          sampleData={pendingImportData.sampleData}
          detectionResult={pendingImportData.detectionResult}
          onConfirm={handleConfirmMapping}
          onCancel={handleCancelMapping}
        />
      )}
    </>
  )
}

// --- Helpers ---

function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i])
    const row: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
    })
    rows.push(row)
  }
  return rows
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current)
  return result
}
