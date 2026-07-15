'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, ExternalLink, Trash2, Power } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  instagram: 'Compte Instagram',
  messenger: 'Page Messenger',
  whatsapp: 'Compte WhatsApp',
}

export function AccountCard({ account }: { account: ChannelAccount }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / 86400000) : null
  const isExpired = daysLeft !== null && daysLeft <= 0
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && !isExpired

  const tokenVariant = !account.is_active || isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'default'
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
      className={`flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center ${account.is_active ? '' : 'opacity-60'}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative shrink-0">
          {account.page_picture_url ? (
            <Image
              src={account.page_picture_url}
              alt={account.page_name ?? ''}
              className="block size-12 rounded-full border border-border object-cover"
              width={48}
              height={48}
              unoptimized
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary">
              <Camera className="size-5 text-primary-foreground" />
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card ${
              account.is_active && !isExpired ? 'bg-success' : 'bg-destructive'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-[15px] font-bold text-foreground">
              {account.page_name ?? PLATFORM_LABEL[account.platform]}
            </span>
            {account.platform === 'instagram' && account.instagram_username && (
              <a
                href={`https://www.instagram.com/${account.instagram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
              >
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
          <p className="mb-2 truncate text-[13px] text-muted-foreground">
            {account.platform === 'whatsapp'
              ? (account.phone_number ?? 'Numéro non disponible')
              : account.instagram_username
                ? `@${account.instagram_username}`
                : `ID: ${account.page_id}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={tokenVariant}>{tokenLabel}</Badge>
            <span className="text-[11px] text-muted-foreground">
              Connecté le {new Date(account.connected_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={loading !== null}
          className={account.is_active ? 'text-primary' : ''}
        >
          <Power className="size-3.5" />
          {account.is_active ? 'Actif' : 'Inactif'}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)} disabled={loading !== null}>
          <Trash2 className="size-3.5" />
          Déconnecter
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
