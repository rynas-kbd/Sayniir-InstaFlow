'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => (row[h] = values[i] ?? ''))
    return row
  })
}

export function ContactsCsvActions({ channelAccountId }: { channelAccountId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, rows }),
      })
      if (!res.ok) throw new Error()
      const { updated, skipped } = await res.json()
      toast.success(`${updated} contact(s) mis à jour, ${skipped} ignoré(s) (aucune correspondance téléphone/email)`)
      router.refresh()
    } catch {
      toast.error("Impossible d'importer le fichier")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/contacts/export?accountId=${channelAccountId}`} />}>
        <Download className="size-3.5" /> Exporter CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
        <Upload className="size-3.5" /> {importing ? 'Import…' : 'Importer CSV'}
      </Button>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
    </div>
  )
}
