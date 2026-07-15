'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, ExternalLink, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/ui/status-dot'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ChannelAccount {
  id: string
  platform: 'instagram' | 'messenger' | 'whatsapp'
  page_id: string | null
  page_name: string | null
  page_picture_url: string | null
  instagram_username: string | null
  phone_number: string | null
  is_active: boolean
  token_expires_at: string | null
  connected_at: string
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  messenger: 'Messenger',
  whatsapp: 'WhatsApp',
}

export function AccountCard({ account }: { account: ChannelAccount }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / 86400000) : null
  const isExpired = daysLeft !== null && daysLeft <= 0
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && !isExpired

  const tone = !account.is_active || isExpired ? 'destructive' : isExpiringSoon ? 'warning' : 'success'
  const tokenLabel = !account.is_active
    ? 'Inactif'
    : isExpired
      ? 'Expiré'
      : isExpiringSoon
        ? `${daysLeft}j restants`
        : 'Actif'

  const accountLabel = account.instagram_username
    ? `@${account.instagram_username}`
    : (account.page_name ?? account.phone_number ?? 'ce compte')

  async function handleToggle() {
    setLoading('toggle')
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !account.is_active }),
      })
      if (!res.ok) throw new Error('Toggle request failed')
      toast.success(account.is_active ? 'Compte désactivé' : 'Compte activé')
      router.refresh()
    } catch {
      toast.error('Impossible de modifier le statut du compte')
    } finally {
      setLoading(null)
    }
  }

  async function handleDisconnect() {
    setLoading('delete')
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete request failed')
      toast.success('Compte déconnecté')
      setConfirmOpen(false)
      router.refresh()
    } catch {
      toast.error('Impossible de déconnecter le compte')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-muted/40 ${account.is_active ? '' : 'opacity-55'}`}
    >
      {account.page_picture_url ? (
        <Image
          src={account.page_picture_url}
          alt={account.page_name ?? ''}
          className="block size-8 shrink-0 rounded-full border border-border object-cover"
          width={32}
          height={32}
          unoptimized
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Camera className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">
            {account.page_name ?? PLATFORM_LABEL[account.platform]}
          </span>
          {account.platform === 'instagram' && account.instagram_username && (
            <a
              href={`https://www.instagram.com/${account.instagram_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Ouvrir sur Instagram"
            >
              <ExternalLink className="size-3" />
            </a>
          )}
          <StatusDot tone={tone} label={tokenLabel} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {PLATFORM_LABEL[account.platform]} ·{' '}
          {account.platform === 'whatsapp'
            ? (account.phone_number ?? 'Numéro non disponible')
            : account.instagram_username
              ? `@${account.instagram_username}`
              : `ID: ${account.page_id}`}{' '}
          · connecté le {new Date(account.connected_at).toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading !== null}>
          <Power className="size-3.5" />
          {account.is_active ? 'Désactiver' : 'Activer'}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          disabled={loading !== null}
          aria-label="Déconnecter"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Déconnecter {accountLabel} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === 'delete'}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={loading === 'delete'}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
