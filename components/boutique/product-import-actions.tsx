'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet } from 'lucide-react'
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
import type { Product } from './types'

/**
 * Surfaces two already-built, previously unreachable import paths — no UI
 * anywhere called /api/products/import (CSV/JSON, 5 Mo/5000 lignes) or
 * /api/products/sync-sheet (public Google Sheet). Both existed fully wired
 * server-side with nothing to trigger them.
 */
export function ProductImportActions({
  channelAccountId,
  onImported,
}: {
  channelAccountId: string
  onImported: (products: Product[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [syncing, setSyncing] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('accountId', channelAccountId)
      const res = await fetch('/api/products/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import impossible')
      onImported(data.products ?? [])
      toast.success(`${data.imported} produit(s) importé(s)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible d’importer le fichier')
    } finally {
      setImporting(false)
    }
  }

  async function handleSheetSync() {
    if (!sheetUrl.trim()) return
    setSyncing(true)
    try {
      const res = await fetch('/api/products/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: channelAccountId, sheetUrl: sheetUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Synchronisation impossible')
      onImported(data.products ?? [])
      toast.success(`${data.synced} produit(s) synchronisé(s) depuis le Google Sheet`)
      setSheetOpen(false)
      setSheetUrl('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de synchroniser le Google Sheet')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
        <Upload className="size-3.5" /> {importing ? 'Import…' : 'Importer CSV/JSON'}
      </Button>
      <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
          <FileSpreadsheet className="size-3.5" /> Synchroniser un Google Sheet
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Synchroniser depuis Google Sheets</DialogTitle>
            <DialogDescription>
              Le Sheet doit être partagé en public (« Tous les utilisateurs disposant du lien : lecteur ») et contenir au
              moins les colonnes <code>name</code>/<code>nom</code> et <code>price</code>/<code>prix</code>. Un produit dont
              le nom correspond déjà est mis à jour ; les autres sont ajoutés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-url">URL du Google Sheet</Label>
            <Input
              id="sheet-url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSheetSync} disabled={syncing || !sheetUrl.trim()}>
              {syncing ? 'Synchronisation…' : 'Synchroniser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
