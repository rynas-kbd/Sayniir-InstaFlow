'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

/**
 * Workspace-wide "keep every account's boutique in sync" toggle — see
 * lib/boutique/sync.ts for the propagation logic this drives (agent_settings
 * + products, mirrored to every other account the workspace owner connected).
 * Same standalone-card idiom as components/flows/flows-enabled-toggle.tsx.
 * Only rendered when the active account's owner has ≥2 accounts in their
 * own workspace — see app/(app)/boutique/page.tsx.
 */
export function BoutiqueSyncToggle({ sourceAccountId, initialEnabled }: { sourceAccountId: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [syncingNow, setSyncingNow] = useState(false)

  async function toggle(checked: boolean) {
    setEnabled(checked)
    setSaving(true)
    try {
      const res = await fetch('/api/workspace/sync-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      })
      if (!res.ok) throw new Error()
      toast.success(checked ? '🔄 Synchronisation multi-comptes activée' : 'Synchronisation multi-comptes désactivée')
    } catch {
      setEnabled(!checked)
      toast.error('Impossible de mettre à jour le réglage')
    } finally {
      setSaving(false)
    }
  }

  async function syncNow() {
    setSyncingNow(true)
    try {
      const res = await fetch('/api/boutique/sync-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceAccountId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`Synchronisé vers ${data.targets} compte(s) — ${data.products} produit(s).`)
    } catch {
      toast.error('La synchronisation a échoué')
    } finally {
      setSyncingNow(false)
    }
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-all ${enabled ? 'border-primary/25 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <RefreshCw className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{enabled ? 'Synchronisation multi-comptes activée' : 'Synchronisation multi-comptes désactivée'}</p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? "Config IA et catalogue produits (avec la clé API) restent alignés sur tous vos comptes."
              : 'Active la config IA et le catalogue produits identiques sur tous vos comptes connectés.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={syncNow} disabled={!enabled || syncingNow}>
          {syncingNow ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Synchroniser maintenant
        </Button>
        <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} aria-label="Activer la synchronisation multi-comptes" />
      </div>
    </div>
  )
}
