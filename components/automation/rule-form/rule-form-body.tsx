'use client'

import { useState } from 'react'
import { Send, Zap, LayoutTemplate } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { OptionPicker } from '@/components/shared/option-picker'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { TagInput } from '@/components/shared/tag-input'
import { CardFieldsEditor } from '@/components/shared/card-fields-editor'
import { PostSelector } from '@/components/shared/post-selector'
import { PostTargetField } from '@/components/shared/post-target-field'
import { AccountChipPicker } from '@/components/shared/account-chip-picker'
import { TriggerPicker } from './trigger-picker'
import { ReplyMethodPicker } from './reply-method-picker'
import type { RuleFormApi } from './types'

export function RuleFormBody({
  api,
  autoFocusName,
  onPostSelectorToggle,
}: {
  api: RuleFormApi
  autoFocusName?: boolean
  /** Lets a Dialog host hide its chrome (title) while the post selector takes over the view. */
  onPostSelectorToggle?: (active: boolean) => void
}) {
  const { form, errors, setField, selectableAccounts, isDmCapable, isCard, defaultTab } = api
  const [showPostSelector, setShowPostSelectorState] = useState(false)

  function setShowPostSelector(active: boolean) {
    setShowPostSelectorState(active)
    onPostSelectorToggle?.(active)
  }

  if (showPostSelector) {
    return (
      <PostSelector
        accountId={form.channel_account_id}
        selectedIds={form.target_post_ids}
        onSelect={(ids) => setField('target_post_ids', ids)}
        onClose={() => setShowPostSelector(false)}
      />
    )
  }

  // Mutually exclusive by construction (see rule-form-schema.ts's deriveFlags): exactly one of
  // showsCommentText/showsDmText is ever true for a given trigger/reply combination, so both share
  // the single `response_text` field without ever rendering twice.
  const showsCommentText = !isDmCapable || (defaultTab === 'comment' && form.reply_method === 'both')
  const showsDmText = isDmCapable && !isCard && (defaultTab === 'dm' || form.reply_method === 'dm')
  const showsDmFallback = !isCard && defaultTab === 'comment' && form.reply_method === 'both'

  return (
    <div className="flex flex-col gap-4">
      <FormSection icon={Send} label="Compte & nom">
        {selectableAccounts.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            L&apos;automatisation de commentaires est réservée aux comptes Instagram — connectez-en un pour créer cette règle.
          </p>
        ) : (
          <Field label="Compte" htmlFor="r-account" error={errors.channel_account_id}>
            <Select value={form.channel_account_id} onValueChange={(v) => setField('channel_account_id', v ?? '')}>
              <SelectTrigger id="r-account" className="w-full" aria-invalid={errors.channel_account_id ? true : undefined}>
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
          </Field>
        )}
        {selectableAccounts.length > 1 && (
          <Field label="Comptes additionnels" htmlFor="r-target-accounts" hint="Cette règle se déclenchera aussi sur les comptes sélectionnés.">
            <AccountChipPicker
              accounts={selectableAccounts
                .filter((a) => a.id !== form.channel_account_id)
                .map((a) => ({
                  id: a.id,
                  platform: a.platform ?? 'instagram',
                  page_name: a.page_name ?? null,
                  instagram_username: a.instagram_username ?? null,
                  phone_number: a.phone_number ?? null,
                }))}
              selectedIds={form.target_account_ids}
              onToggle={(accountId) =>
                setField(
                  'target_account_ids',
                  form.target_account_ids.includes(accountId)
                    ? form.target_account_ids.filter((id) => id !== accountId)
                    : [...form.target_account_ids, accountId]
                )
              }
            />
          </Field>
        )}
        <Field label="Nom" htmlFor="r-name" required error={errors.name}>
          <Input
            {...fieldA11y('r-name', { error: errors.name })}
            autoFocus={autoFocusName}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Nom de la règle — ex : Réponse de bienvenue"
          />
        </Field>
      </FormSection>

      <FormSection icon={Zap} label="Déclencheur">
        <TriggerPicker api={api} />

        {(form.trigger_type === 'keyword' || form.trigger_type === 'comment_keyword') && (
          <Field label="Mots-clés" htmlFor="r-keywords" error={errors.trigger_keywords} hint="Entrée ou virgule pour ajouter">
            <TagInput
              id="r-keywords"
              value={form.trigger_keywords}
              onChange={(v) => setField('trigger_keywords', v)}
              placeholder="bonjour, prix, tarif…"
              invalid={Boolean(errors.trigger_keywords)}
            />
          </Field>
        )}

        {(form.trigger_type === 'any_comment' || form.trigger_type === 'comment_keyword') && (
          <div className="flex flex-wrap gap-3.5 border-t border-border/60 pt-2.5">
            <div className="min-w-[180px] flex-1">
              <Field label="Post(s) cible(s)" htmlFor="r-target-posts">
                <PostTargetField
                  accountId={form.channel_account_id}
                  selectedIds={form.target_post_ids}
                  onOpen={() => setShowPostSelector(true)}
                />
              </Field>
            </div>
            <div className="min-w-[180px] flex-1">
              <Field label="Action" htmlFor="r-reply-method">
                <ReplyMethodPicker api={api} />
              </Field>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection icon={LayoutTemplate} label="Réponse">
        {isDmCapable && (
          <OptionPicker
            name="Type de réponse"
            compact
            value={form.response_type}
            onChange={(v) => setField('response_type', v)}
            options={[
              { value: 'text', label: 'Texte' },
              { value: 'card', label: 'Carte' },
            ]}
          />
        )}

        {(showsCommentText || showsDmText) && (
          <Field
            label={showsCommentText && form.reply_method === 'both' ? 'Message de réponse (Commentaire)' : 'Message de réponse'}
            htmlFor="r-response"
            error={errors.response_text}
          >
            <Textarea
              {...fieldA11y('r-response', { error: errors.response_text })}
              value={form.response_text}
              onChange={(e) => setField('response_text', e.target.value)}
              placeholder="Bonjour ! Merci pour votre message. Nous vous répondrons bientôt."
            />
          </Field>
        )}

        {isCard && (
          <CardFieldsEditor
            title={form.card_title}
            subtitle={form.card_subtitle}
            imageUrl={form.card_image_url}
            buttons={form.card_buttons}
            onTitleChange={(v) => setField('card_title', v)}
            onSubtitleChange={(v) => setField('card_subtitle', v)}
            onImageUrlChange={(v) => setField('card_image_url', v)}
            onButtonsChange={(v) => setField('card_buttons', v)}
            channelAccountId={form.channel_account_id}
            folder="rules"
          />
        )}

        {showsDmFallback && (
          <Field label="Message de réponse (DM)" htmlFor="r-response-dm" hint="S'il est laissé vide, le message du commentaire sera utilisé pour le DM.">
            <Textarea id="r-response-dm" value={form.response_text_dm} onChange={(e) => setField('response_text_dm', e.target.value)} />
          </Field>
        )}
      </FormSection>
    </div>
  )
}
