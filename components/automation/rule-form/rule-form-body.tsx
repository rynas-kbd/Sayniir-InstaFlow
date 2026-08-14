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
import { useT } from '@/components/i18n-provider'
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
  const t = useT()
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
      <FormSection icon={Send} label={t('automation.ruleFormBody.accountAndNameSection')}>
        {selectableAccounts.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">{t('automation.ruleFormBody.instagramOnlyNotice')}</p>
        ) : (
          <Field label={t('automation.ruleFormBody.accountLabel')} htmlFor="r-account" error={errors.channel_account_id}>
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
          <Field
            label={t('automation.ruleFormBody.additionalAccountsLabel')}
            htmlFor="r-target-accounts"
            hint={t('automation.ruleFormBody.additionalAccountsHint')}
          >
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
        <Field label={t('automation.ruleFormBody.nameLabel')} htmlFor="r-name" required error={errors.name}>
          <Input
            {...fieldA11y('r-name', { error: errors.name })}
            autoFocus={autoFocusName}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('automation.ruleFormBody.namePlaceholder')}
          />
        </Field>
      </FormSection>

      <FormSection icon={Zap} label={t('automation.ruleFormBody.triggerSection')}>
        <TriggerPicker api={api} />

        {(form.trigger_type === 'keyword' || form.trigger_type === 'comment_keyword') && (
          <Field
            label={t('automation.ruleFormBody.keywordsLabel')}
            htmlFor="r-keywords"
            error={errors.trigger_keywords}
            hint={t('automation.ruleFormBody.keywordsHint')}
          >
            <TagInput
              id="r-keywords"
              value={form.trigger_keywords}
              onChange={(v) => setField('trigger_keywords', v)}
              placeholder={t('automation.ruleFormBody.keywordsPlaceholder')}
              invalid={Boolean(errors.trigger_keywords)}
            />
          </Field>
        )}

        {(form.trigger_type === 'any_comment' || form.trigger_type === 'comment_keyword') && (
          <div className="flex flex-wrap gap-3.5 border-t border-border/60 pt-2.5">
            <div className="min-w-[180px] flex-1">
              <Field label={t('automation.ruleFormBody.targetPostsLabel')} htmlFor="r-target-posts">
                <PostTargetField
                  accountId={form.channel_account_id}
                  selectedIds={form.target_post_ids}
                  onOpen={() => setShowPostSelector(true)}
                />
              </Field>
            </div>
            <div className="min-w-[180px] flex-1">
              <Field label={t('automation.ruleFormBody.actionLabel')} htmlFor="r-reply-method">
                <ReplyMethodPicker api={api} />
              </Field>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection icon={LayoutTemplate} label={t('automation.ruleFormBody.responseSection')}>
        {isDmCapable && (
          <OptionPicker
            name={t('automation.ruleFormBody.responseTypeName')}
            compact
            value={form.response_type}
            onChange={(v) => setField('response_type', v)}
            options={[
              { value: 'text', label: t('automation.ruleFormBody.responseTypeText') },
              { value: 'card', label: t('automation.ruleFormBody.responseTypeCard') },
            ]}
          />
        )}

        {(showsCommentText || showsDmText) && (
          <Field
            label={
              showsCommentText && form.reply_method === 'both'
                ? t('automation.ruleFormBody.responseLabelComment')
                : t('automation.ruleFormBody.responseLabel')
            }
            htmlFor="r-response"
            error={errors.response_text}
          >
            <Textarea
              {...fieldA11y('r-response', { error: errors.response_text })}
              value={form.response_text}
              onChange={(e) => setField('response_text', e.target.value)}
              placeholder={t('automation.ruleFormBody.responsePlaceholder')}
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
          <Field
            label={t('automation.ruleFormBody.responseDmLabel')}
            htmlFor="r-response-dm"
            hint={t('automation.ruleFormBody.responseDmHint')}
          >
            <Textarea id="r-response-dm" value={form.response_text_dm} onChange={(e) => setField('response_text_dm', e.target.value)} />
          </Field>
        )}
      </FormSection>
    </div>
  )
}
