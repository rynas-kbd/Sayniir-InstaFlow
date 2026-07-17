'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

interface ShopifyConnection {
  shop_domain: string
  connected_at: string
  last_synced_at: string | null
}

// Fully functional Shopify catalog sync panel. Not currently linked from the
// Boutique tab navigation — see ShopifyComingSoon, which is what renders there.
export function ShopifyIntegrationPanel({ channelAccountId }: { channelAccountId: string }) {
  const [connection, setConnection] = useState<ShopifyConnection | null>(null)
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const loadConnection = useCallback(async () => {
    const res = await fetch(`/api/shopify?accountId=${channelAccountId}`)
    if (res.ok) {
      const data = await res.json()
      setConnection(data.connection)
    }
  }, [channelAccountId])

  useEffect(() => {
    loadConnection()
  }, [loadConnection])

  async function handleConnect() {
    if (!domain.trim() || !token.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: channelAccountId, shopDomain: domain, accessToken: token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Boutique Shopify connectée')
      setToken('')
      await loadConnection()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    const res = await fetch(`/api/shopify?accountId=${channelAccountId}`, { method: 'DELETE' })
    if (res.ok) {
      setConnection(null)
      toast.success('Boutique déconnectée')
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: channelAccountId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.synced} produit(s) synchronisé(s)`)
      await loadConnection()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronisation impossible')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Shopify</CardTitle>
        <CardDescription>Synchronisez votre catalogue Shopify avec Sayniir.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connection ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Connecté à <span className="font-medium text-foreground">{connection.shop_domain}</span>
              {connection.last_synced_at && ` · dernière sync ${new Date(connection.last_synced_at).toLocaleString('fr-FR')}`}
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw className="mr-1.5 size-3.5" /> Synchroniser
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleDisconnect}>
                <Unlink className="mr-1.5 size-3.5" /> Déconnecter
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ma-boutique.myshopify.com" className="text-xs" />
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token API Admin (app personnalisée)" type="password" className="text-xs" />
            <Button type="button" size="sm" onClick={handleConnect} disabled={loading || !domain.trim() || !token.trim()}>
              <Link2 className="mr-1.5 size-3.5" /> Connecter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
