'use client'

import { useState } from 'react'
import { MessageSquare, Hash, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PostSelector } from './post-selector'
import type { AutomationRule, ChannelAccountLite, RuleFormPayload } from './types'

export function RuleFormDialog({
  open,
  accounts,
  rule,
  defaultTab,
  onSave,
  onClose,
}: {
  open: boolean
  accounts: ChannelAccountLite[]
  rule?: AutomationRule
  defaultTab: 'dm' | 'comment'
  onSave: (data: RuleFormPayload) => Promise<void>
  onClose: () => void
}) {
  const selectableAccounts =
    defaultTab === 'comment' ? accounts.filter((a) => (a.platform ?? 'instagram') === 'instagram') : accounts

  const [form, setForm] = useState({
    channel_account_id: rule?.channel_account_id ?? selectableAccounts[0]?.id ?? '',
    name: rule?.name ?? '',
    trigger_type: rule?.trigger_type ?? (defaultTab === 'dm' ? 'any_message' : 'any_comment'),
    trigger_keywords: rule?.trigger_keywords?.join(', ') ?? '',
    target_post_ids: rule?.target_post_ids?.join(', ') ?? '',
    reply_method: (rule?.reply_method as 'comment' | 'dm' | 'both') ?? 'comment',
    response_text: rule?.response_text ?? '',
    response_text_dm: rule?.response_text_dm ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [showPostSelector, setShowPostSelector] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: RuleFormPayload = {
        ...form,
        trigger_keywords:
          form.trigger_type === 'keyword' || form.trigger_type === 'comment_keyword'
            ? form.trigger_keywords.split(',').map((k) => k.trim()).filter(Boolean)
            : null,
        target_post_ids: form.target_post_ids
          ? form.target_post_ids.split(',').map((id) => id.trim()).filter(Boolean)
          : null,
      }
      await onSave(payload)
      toast.success(rule ? 'Règle mise à jour' : 'Règle créée')
      onClose()
    } catch {
      toast.error("Erreur lors de l'enregistrement de la règle")
    } finally {
      setSaving(false)
    }
  }

  const triggerOptions =
    defaultTab === 'dm'
      ? [
          { value: 'any_message', label: 'Tout DM', icon: MessageSquare },
          { value: 'keyword', label: 'Mot-clé (DM)', icon: Hash },
        ]
      : [
          { value: 'any_comment', label: 'Tout commentaire', icon: MessageSquare },
          { value: 'comment_keyword', label: 'Mot-clé (Commentaire)', icon: Hash },
        ]

  const selectedPostCount = form.target_post_ids ? form.target_post_ids.split(',').filter(Boolean).length : 0

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        {showPostSelector ? (
          <PostSelector
            accountId={form.channel_account_id}
            selectedIds={form.target_post_ids ? form.target_post_ids.split(',').map((s) => s.trim()).filter(Boolean) : []}
            onSelect={(ids) => setForm({ ...form, target_post_ids: ids.join(', ') })}
            onClose={() => setShowPostSelector(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{rule ? 'Modifier la règle' : 'Nouvelle règle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {selectableAccounts.length === 0 ? (
                <div>
                  <Label className="mb-1.5">Compte</Label>
                  <p className="text-[13px] text-muted-foreground">
                    L&apos;automatisation de commentaires est réservée aux comptes Instagram — connectez-en
                    un pour créer cette règle.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Compte</Label>
                  <Select
                    value={form.channel_account_id}
                    onValueChange={(v) => setForm({ ...form, channel_account_id: v ?? '' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.platform === 'whatsapp' ? a.phone_number : `@${a.instagram_username ?? a.page_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="rule-name">Nom de la règle</Label>
                <Input
                  id="rule-name"
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex : Réponse de bienvenue"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Déclencheur</Label>
                <div className="flex flex-wrap gap-2">
                  {triggerOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, trigger_type: value })}
                      className={`flex min-w-[130px] flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        form.trigger_type === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="size-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {(form.trigger_type === 'keyword' || form.trigger_type === 'comment_keyword') && (
                <div className="space-y-1.5">
                  <Label htmlFor="rule-keywords">Mots-clés (séparés par des virgules)</Label>
                  <Input
                    id="rule-keywords"
                    value={form.trigger_keywords}
                    onChange={(e) => setForm({ ...form, trigger_keywords: e.target.value })}
                    placeholder="bonjour, prix, tarif, info"
                  />
                </div>
              )}

              {(form.trigger_type === 'any_comment' || form.trigger_type === 'comment_keyword') && (
                <div className="flex flex-wrap gap-3.5">
                  <div className="min-w-[180px] flex-1 space-y-1.5">
                    <Label>Post(s) cible(s)</Label>
                    {form.target_post_ids ? (
                      <div className="flex h-9 items-center gap-2">
                        <span className="text-[13px] font-semibold text-primary">
                          {selectedPostCount} post(s) sélectionné(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPostSelector(true)}
                          className="text-[13px] text-muted-foreground underline hover:text-foreground"
                        >
                          Modifier
                        </button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full" onClick={() => setShowPostSelector(true)}>
                        <ImageIcon className="size-3.5" /> Sélectionner des posts
                      </Button>
                    )}
                  </div>
                  <div className="min-w-[180px] flex-1 space-y-1.5">
                    <Label>Action</Label>
                    <Select
                      value={form.reply_method}
                      onValueChange={(v) => setForm({ ...form, reply_method: v as 'comment' | 'dm' | 'both' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comment">Répondre en commentaire</SelectItem>
                        <SelectItem value="dm">Envoyer un DM privé</SelectItem>
                        <SelectItem value="both">Les deux (Commentaire + DM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="rule-response">
                  {form.reply_method === 'both' ? 'Message de réponse (Commentaire)' : 'Message de réponse'}
                </Label>
                <Textarea
                  id="rule-response"
                  value={form.response_text}
                  onChange={(e) => setForm({ ...form, response_text: e.target.value })}
                  placeholder="Bonjour ! Merci pour votre message. Nous vous répondrons bientôt."
                  required
                />
              </div>

              {form.reply_method === 'both' && (
                <div className="space-y-1.5">
                  <Label htmlFor="rule-response-dm">Message de réponse (DM)</Label>
                  <Textarea
                    id="rule-response-dm"
                    value={form.response_text_dm}
                    onChange={(e) => setForm({ ...form, response_text_dm: e.target.value })}
                    placeholder="S'il est laissé vide, le message du commentaire sera utilisé pour le DM."
                  />
                </div>
              )}

              <div className="mt-1 flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={saving || selectableAccounts.length === 0}>
                  {saving ? 'Enregistrement…' : rule ? 'Sauvegarder' : 'Créer la règle'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
