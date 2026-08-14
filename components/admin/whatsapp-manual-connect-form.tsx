'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2, AlertTriangle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { connectWhatsAppManually, type ConnectWhatsAppManuallyResult } from '@/app/admin/(dashboard)/clients/[id]/actions'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'

interface Props {
  userId: string
  /** e.g. `${NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp` — computed server-side, shown here for copy-paste into the client's own Meta App Dashboard. */
  webhookUrl: string
  verifyToken: string
}

function CopyField({ label, value, t }: { label: string; value: string; t: Translator }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-foreground">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value)
          toast.success(t('admin.clients.detail.whatsappForm.copiedToast'))
        }}
        className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
        aria-label={t('admin.clients.detail.whatsappForm.copyAria', { label })}
      >
        <Copy className="size-3" />
      </button>
    </div>
  )
}

/**
 * Manual WhatsApp connect: the client creates their OWN Meta app (ours is
 * still in Development mode and can't add every future client as a
 * tester), points its webhook at `webhookUrl`/`verifyToken` below, and
 * sends us the four values pasted here. See
 * app/admin/(dashboard)/clients/[id]/actions.ts::connectWhatsAppManually
 * for why the app secret matters (per-account webhook signature
 * verification, not just today's global one).
 */
export function WhatsAppManualConnectForm({ userId, webhookUrl, verifyToken }: Props) {
  const t = useT()
  const [wabaId, setWabaId] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [result, setResult] = useState<ConnectWhatsAppManuallyResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      try {
        const res = await connectWhatsAppManually(userId, { wabaId, phoneNumberId, accessToken, appSecret })
        setResult(res)
        setAccessToken('')
        setAppSecret('')
        toast.success(t('admin.clients.detail.whatsappForm.connectedToast', { phone: res.displayPhoneNumber ?? phoneNumberId }))
      } catch (err) {
        // NOTE: err.message may come from actions.ts (untranslated French,
        // see TODO(i18n) there); only the fallback string is translated here.
        toast.error(err instanceof Error ? err.message : t('admin.clients.detail.whatsappForm.errorToastFallback'))
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {t('admin.clients.detail.whatsappForm.instructionText')}
        </p>
        <CopyField label={t('admin.clients.detail.whatsappForm.webhookUrlLabel')} value={webhookUrl} t={t} />
        <CopyField label={t('admin.clients.detail.whatsappForm.verifyTokenLabel')} value={verifyToken} t={t} />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="waba_id">WABA ID</Label>
          <Input id="waba_id" value={wabaId} onChange={(e) => setWabaId(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone_number_id">Phone Number ID</Label>
          <Input id="phone_number_id" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="access_token">Access Token</Label>
          <Input id="access_token" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="app_secret">App Secret</Label>
          <Input id="app_secret" type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} required />
        </div>
        <Button type="submit" disabled={isPending} className="gap-2 sm:col-span-2 sm:self-start">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t('admin.clients.detail.whatsappForm.submitButton')}
        </Button>
      </form>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            result.webhookSubscribed ? 'border-success/25 bg-success/5 text-success' : 'border-destructive/25 bg-destructive/5 text-destructive'
          }`}
        >
          {result.webhookSubscribed ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />}
          <span>
            {result.webhookSubscribed
              ? t('admin.clients.detail.whatsappForm.successResult', { name: result.verifiedName ?? result.displayPhoneNumber ?? '' })
              : t('admin.clients.detail.whatsappForm.failureResult', {
                  reason: result.webhookSubscribeError ?? t('admin.clients.detail.whatsappForm.unknownReason'),
                })}
          </span>
        </div>
      )}
    </div>
  )
}
