'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, ExternalLink, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'
import { getAvatarColor } from '@/lib/avatar-color'
import { WidgetSnippetPopover } from './widget-snippet-popover'
import { useT, useLocale } from '@/components/i18n-provider'
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

const DATE_LOCALE: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar' }

export function AccountCard({ account }: { account: ChannelAccount }) {
  const t = useT()
  const locale = useLocale()
  const dateLocale = DATE_LOCALE[locale] ?? 'fr-FR'
  const PLATFORM_LABEL: Record<string, string> = {
    instagram: t('accounts.platformLabels.instagram'),
    messenger: t('accounts.platformLabels.messenger'),
    whatsapp: t('accounts.platformLabels.whatsapp'),
  }
  const router = useRouter()
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / 86400000) : null
  const isExpired = daysLeft !== null && daysLeft <= 0
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && !isExpired

  const tone: StatusTone = !account.is_active || isExpired ? 'destructive' : isExpiringSoon ? 'warning' : 'success'
  const tokenLabel = !account.is_active
    ? t('accounts.card.statusInactive')
    : isExpired
      ? t('accounts.card.statusExpired')
      : isExpiringSoon
        ? t('accounts.card.statusDaysLeft', { count: daysLeft })
        : t('accounts.card.statusActive')

  const accountLabel = account.instagram_username
    ? `@${account.instagram_username}`
    : (account.page_name ?? account.phone_number ?? t('accounts.card.fallbackLabel'))

  const displayName = account.page_name ?? PLATFORM_LABEL[account.platform]

  async function handleToggle() {
    setLoading('toggle')
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !account.is_active }),
      })
      if (!res.ok) throw new Error('Toggle request failed')
      toast.success(account.is_active ? t('accounts.card.toastDeactivated') : t('accounts.card.toastActivated'))
      router.refresh()
    } catch {
      toast.error(t('accounts.card.toastToggleError'))
    } finally {
      setLoading(null)
    }
  }

  async function handleDisconnect() {
    setLoading('delete')
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete request failed')
      toast.success(t('accounts.card.toastDisconnected'))
      setConfirmOpen(false)
      router.refresh()
    } catch {
      toast.error(t('accounts.card.toastDisconnectError'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div
        className={`glass-stat group relative flex flex-col rounded-2xl transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 ${account.is_active ? '' : 'opacity-60'}`}
      >
        {account.is_active && !isExpired && (
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {PLATFORM_LABEL[account.platform]}
            </span>
            <StatusDot tone={tone} label={tokenLabel} />
          </div>

          <div className="flex items-center gap-3">
            {account.page_picture_url ? (
              <Image
                src={account.page_picture_url}
                alt={displayName}
                className="block size-10 shrink-0 rounded-full border border-border object-cover"
                width={40}
                height={40}
                unoptimized
              />
            ) : (
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${getAvatarColor(account.id)}`}>
                <Camera className="size-4" strokeWidth={1.75} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-semibold text-foreground">{displayName}</h3>
                {account.platform === 'instagram' && account.instagram_username && (
                  <a
                    href={`https://www.instagram.com/${account.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={t('accounts.card.openOnInstagram')}
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {account.platform === 'whatsapp'
                  ? (account.phone_number ?? t('accounts.card.phoneUnavailable'))
                  : account.instagram_username
                    ? `@${account.instagram_username}`
                    : t('accounts.card.idLabel', { id: account.page_id ?? '' })}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            {t('accounts.card.connectedOn', { date: new Date(account.connected_at).toLocaleDateString(dateLocale) })}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('accounts.card.disconnect')}
          >
            <Trash2 className="size-3.5" />
            {t('accounts.card.disconnect')}
          </button>

          <div className="flex items-center gap-1">
            <WidgetSnippetPopover
              platform={account.platform}
              target={account.platform === 'whatsapp' ? (account.phone_number ?? '') : (account.instagram_username ?? account.page_id ?? '')}
            />
            <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading !== null} className="h-7 gap-1.5 text-xs">
              <Power className="size-3.5" />
              {account.is_active ? t('accounts.card.deactivate') : t('accounts.card.activate')}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('accounts.card.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accounts.card.confirmDescription', { account: accountLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === 'delete'}>{t('accounts.card.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={loading === 'delete'}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('accounts.card.disconnect')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
