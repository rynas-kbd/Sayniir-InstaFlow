import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Link2, Unlink, Store, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ShopifyConnection {
  shop_domain: string
  connected_at: string
  last_synced_at: string | null
}

export function ShopifyIntegrationPanel({ channelAccountId }: { channelAccountId: string }) {
  const [connection, setConnection] = useState<ShopifyConnection | null>(null)
  const [loadingConnection, setLoadingConnection] = useState(true)
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const loadConnection = useCallback(async () => {
    setLoadingConnection(true)
    try {
      const res = await fetch(`/api/shopify?accountId=${channelAccountId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setConnection(data.connection)
    } catch {
      toast.error('Impossible de charger le statut de la connexion Shopify.')
    } finally {
      setLoadingConnection(false)
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
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-content-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Store className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold tracking-tight">Intégration Shopify</CardTitle>
              <CardDescription className="text-xs">Synchronisez votre catalogue produit Shopify automatiquement avec l&apos;IA.</CardDescription>
            </div>
          </div>
          {connection && (
            <Badge variant="outline" className="gap-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Connecté
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {loadingConnection ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span>Chargement du statut Shopify…</span>
          </div>
        ) : connection ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Boutique liée : {connection.shop_domain}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {connection.last_synced_at
                  ? `Dernière synchronisation effectuée le ${new Date(connection.last_synced_at).toLocaleString('fr-FR')}`
                  : 'Aucune synchronisation n’a encore été exécutée'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button type="button" size="sm" onClick={handleSync} disabled={syncing} className="font-bold gap-1.5">
                <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Synchronisation…' : 'Synchroniser le catalogue'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleDisconnect} className="text-destructive hover:text-destructive gap-1.5 font-semibold">
                <Unlink className="size-3.5" /> Déconnecter la boutique
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Domaine Myshopify</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="ma-boutique.myshopify.com"
                className="text-xs font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Token d&apos;accès Admin API</label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                type="password"
                className="text-xs font-mono"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleConnect}
              disabled={loading || !domain.trim() || !token.trim()}
              className="font-bold gap-1.5"
            >
              <Link2 className="size-3.5" />
              {loading ? 'Connexion…' : 'Connecter à Shopify'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
