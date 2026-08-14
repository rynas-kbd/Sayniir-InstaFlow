'use client'

import React, { useId, isValidElement, cloneElement, type ReactElement } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  MessageSquare,
  Zap,
  GitBranch,
  Clock,
  Tag,
  Sparkles,
  ArrowRightCircle,
  Globe,
  SplitSquareHorizontal,
  ListPlus,
  Info,
  Lightbulb,
} from 'lucide-react'
import type { FlowNodeType, CardButton } from '../types'
import type { Tag as ContactTag } from '@/components/contacts/types'
import type { FlowSummary } from '../types'
import { CardFieldsEditor } from '@/components/shared/card-fields-editor'
import { PostTargetField } from '@/components/shared/post-target-field'
import { useT } from '@/components/i18n-provider'

// ── Node metadata ──────────────────────────────────────────────────────────
const NODE_META: Record<FlowNodeType, { icon: React.ElementType; color: string; glow: string; gradient: string }> = {
  trigger:          { icon: Zap,                   color: '#f59e0b', glow: 'rgba(245,158,11,0.18)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.04))' },
  send_message:     { icon: MessageSquare,         color: 'var(--organic-terracotta)', glow: 'color-mix(in srgb, var(--organic-terracotta) 18%, transparent)', gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--organic-terracotta) 15%, transparent), color-mix(in srgb, var(--organic-terracotta) 4%, transparent))' },
  ai_reply:         { icon: Sparkles,              color: '#8b5cf6', glow: 'rgba(139,92,246,0.18)', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.04))' },
  condition:        { icon: GitBranch,             color: '#ec4899', glow: 'rgba(236,72,153,0.18)', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.04))' },
  delay:            { icon: Clock,                 color: '#06b6d4', glow: 'rgba(6,182,212,0.18)',  gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.04))' },
  set_tag:          { icon: Tag,                   color: '#22c55e', glow: 'rgba(34,197,94,0.18)',  gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.04))' },
  remove_tag:       { icon: Tag,                   color: '#ef4444', glow: 'rgba(239,68,68,0.18)',  gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.04))' },
  jump:             { icon: ArrowRightCircle,      color: '#f97316', glow: 'rgba(249,115,22,0.18)', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.04))' },
  capture_input:    { icon: ListPlus,              color: '#0ea5e9', glow: 'rgba(14,165,233,0.18)', gradient: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.04))' },
  external_request: { icon: Globe,                 color: '#64748b', glow: 'rgba(100,116,139,0.18)',gradient: 'linear-gradient(135deg, rgba(100,116,139,0.15), rgba(100,116,139,0.04))' },
  split_test:       { icon: SplitSquareHorizontal, color: '#a855f7', glow: 'rgba(168,85,247,0.18)', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.04))' },
}

// ── Shared sub-components ─────────────────────────────────────────────────

function Section({ title, accent, children }: { title?: string; accent?: string; children: React.ReactNode }) {
  return (
    <div
      className="space-y-3.5 rounded-2xl p-4"
      style={{
        background: 'color-mix(in srgb, var(--organic-bg) 60%, transparent)',
        backdropFilter: 'blur(12px)',
        border: `1px solid color-mix(in srgb, ${accent ?? 'var(--organic-sand-400)'} 22%, transparent)`,
        boxShadow: `0 1px 0 color-mix(in srgb, white 30%, transparent) inset, 0 4px 16px color-mix(in srgb, ${accent ?? 'var(--organic-terracotta)'} 5%, transparent)`,
      }}
    >
      {title && (
        <div className="flex items-center gap-2">
          <div
            className="h-px flex-1"
            style={{ background: `color-mix(in srgb, ${accent ?? 'var(--organic-sand-400)'} 30%, transparent)` }}
          />
          <p
            className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
            style={{ color: accent ?? 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}
          >
            {title}
          </p>
          <div
            className="h-px flex-1"
            style={{ background: `color-mix(in srgb, ${accent ?? 'var(--organic-sand-400)'} 30%, transparent)` }}
          />
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * Auto-wires htmlFor/id when the field's single child is a plain Input or
 * Textarea, so clicking the label focuses the control and screen readers
 * announce the association.
 */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const generatedId = useId()
  const canWireId = isValidElement(children) && (children.type === Input || children.type === Textarea)
  const existingId = canWireId ? (children as ReactElement<{ id?: string }>).props.id : undefined
  const fieldId = canWireId ? existingId ?? generatedId : undefined
  const child = canWireId && !existingId ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId }) : children

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}
      >
        {label}
      </Label>
      {child}
      {hint && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'color-mix(in srgb, var(--organic-text) 42%, transparent)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
      style={{
        background: 'color-mix(in srgb, var(--organic-terracotta) 8%, transparent)',
        border: '1px solid color-mix(in srgb, var(--organic-terracotta) 18%, transparent)',
      }}
    >
      <Lightbulb
        className="mt-0.5 size-3.5 shrink-0"
        style={{ color: 'color-mix(in srgb, var(--organic-terracotta) 80%, transparent)' }}
      />
      <p
        className="text-[11px] leading-relaxed"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
      >
        {children}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function NodeInspector({
  nodeType,
  config,
  onChange,
  tags,
  flows,
  channelAccountId,
  onOpenPostPicker,
}: {
  nodeType: FlowNodeType
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  tags: ContactTag[]
  flows: FlowSummary[]
  channelAccountId?: string
  onOpenPostPicker?: () => void
}) {
  const t = useT()
  const meta = NODE_META[nodeType] ?? NODE_META.send_message
  const metaKey: FlowNodeType = NODE_META[nodeType] ? nodeType : 'send_message'
  const metaLabel = t(`flows.nodeTypes.${metaKey}.label`)
  const metaShort = t(`flows.nodeTypes.${metaKey}.short`)
  const Icon = meta.icon

  function set(key: string, value: unknown) {
    onChange({ ...config, [key]: value })
  }

  function renderFields() {
    switch (nodeType) {
      // ── Trigger ──────────────────────────────────────────────────────────
      case 'trigger': {
        const triggerType = (config.trigger_type as string) ?? 'any_message'
        const keywords = ((config.trigger_keywords as string[] | null) ?? []).join(', ')
        const postIds = (config.target_post_ids as string[] | null) ?? []
        const isComment = triggerType === 'any_comment' || triggerType === 'comment_keyword'

        function commitKeywords(raw: string) {
          const arr = raw ? raw.split(',').map((k) => k.trim()).filter(Boolean) : null
          onChange({ ...config, trigger_keywords: arr })
        }

        return (
          <>
            <Section title={t('flows.builder.nodeInspector.trigger.sectionTitle')} accent={meta.color}>
              <Field label={t('flows.builder.nodeInspector.trigger.typeLabel')}>
                <Select value={triggerType} onValueChange={(v) => v && onChange({ ...config, trigger_type: v, trigger_keywords: null, target_post_ids: null })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any_message">{t('flows.builder.nodeInspector.trigger.options.anyMessage')}</SelectItem>
                    <SelectItem value="keyword">{t('flows.builder.nodeInspector.trigger.options.keyword')}</SelectItem>
                    <SelectItem value="any_comment">{t('flows.builder.nodeInspector.trigger.options.anyComment')}</SelectItem>
                    <SelectItem value="comment_keyword">{t('flows.builder.nodeInspector.trigger.options.commentKeyword')}</SelectItem>
                    <SelectItem value="story_reply">{t('flows.builder.nodeInspector.trigger.options.storyReply')}</SelectItem>
                    <SelectItem value="story_mention">{t('flows.builder.nodeInspector.trigger.options.storyMention')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {(triggerType === 'keyword' || triggerType === 'comment_keyword') && (
                <Field label={t('flows.builder.nodeInspector.trigger.keywordsLabel')} hint={t('flows.builder.nodeInspector.trigger.keywordsHint')}>
                  <Input
                    defaultValue={keywords}
                    onBlur={(e) => commitKeywords(e.target.value)}
                    placeholder={t('flows.builder.nodeInspector.trigger.keywordsPlaceholder')}
                  />
                </Field>
              )}

              {isComment && channelAccountId && onOpenPostPicker && (
                <Field label={t('flows.builder.nodeInspector.trigger.targetPostsLabel')}>
                  <PostTargetField
                    accountId={channelAccountId}
                    selectedIds={postIds}
                    onOpen={onOpenPostPicker}
                  />
                </Field>
              )}
            </Section>
            <InfoBox>{t('flows.builder.nodeInspector.trigger.infoBox')}</InfoBox>
          </>
        )
      }

      // ── Send message ─────────────────────────────────────────────────────
      case 'send_message': {
        const messageType = (config.message_type as string) ?? 'text'
        const buttons = (config.card_buttons as CardButton[]) ?? []

        return (
          <Section title={t('flows.builder.nodeInspector.sendMessage.sectionTitle')} accent={meta.color}>
            <Field label={t('flows.builder.nodeInspector.sendMessage.typeLabel')}>
              <Select value={messageType} onValueChange={(v) => v && set('message_type', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('flows.builder.nodeInspector.sendMessage.options.text')}</SelectItem>
                  <SelectItem value="card">{t('flows.builder.nodeInspector.sendMessage.options.card')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {messageType === 'text' ? (
              <Field label={t('flows.builder.nodeInspector.sendMessage.textLabel')} hint={t('flows.builder.nodeInspector.sendMessage.textHint')}>
                <Textarea
                  value={(config.text as string) ?? ''}
                  onChange={(e) => set('text', e.target.value)}
                  placeholder={t('flows.builder.nodeInspector.sendMessage.textPlaceholder')}
                  rows={4}
                  className="resize-none font-sans text-sm"
                />
              </Field>
            ) : (
              <CardFieldsEditor
                title={(config.card_title as string) ?? ''}
                subtitle={(config.card_subtitle as string) ?? ''}
                imageUrl={(config.card_image_url as string) ?? ''}
                buttons={buttons}
                onTitleChange={(v) => set('card_title', v)}
                onSubtitleChange={(v) => set('card_subtitle', v)}
                onImageUrlChange={(v) => set('card_image_url', v)}
                onButtonsChange={(v) => set('card_buttons', v)}
                allowPostbackButtons
              />
            )}
          </Section>
        )
      }

      // ── AI reply ─────────────────────────────────────────────────────────
      case 'ai_reply':
        return (
          <>
            <Section title={t('flows.builder.nodeInspector.aiReply.sectionTitle')} accent={meta.color}>
              <Field label={t('flows.builder.nodeInspector.aiReply.promptLabel')} hint={t('flows.builder.nodeInspector.aiReply.promptHint')}>
                <Textarea
                  value={(config.instructions as string) ?? ''}
                  onChange={(e) => set('instructions', e.target.value)}
                  placeholder={t('flows.builder.nodeInspector.aiReply.promptPlaceholder')}
                  rows={5}
                  className="resize-none text-sm"
                />
              </Field>
            </Section>
            <InfoBox>{t('flows.builder.nodeInspector.aiReply.infoBox')}</InfoBox>
          </>
        )

      // ── Condition ─────────────────────────────────────────────────────────
      case 'condition':
        return (
          <Section title={t('flows.builder.nodeInspector.condition.sectionTitle')} accent={meta.color}>
            <Field label={t('flows.builder.nodeInspector.condition.fieldLabel')} hint={t('flows.builder.nodeInspector.condition.fieldHint')}>
              <Input
                value={(config.field as string) ?? ''}
                onChange={(e) => set('field', e.target.value)}
                placeholder={t('flows.builder.nodeInspector.condition.fieldPlaceholder')}
                className="font-mono text-sm"
              />
            </Field>
            <Field label={t('flows.builder.nodeInspector.condition.operatorLabel')}>
              <Select value={(config.operator as string) ?? 'equals'} onValueChange={(v) => v && set('operator', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">{t('flows.builder.nodeInspector.condition.options.equals')}</SelectItem>
                  <SelectItem value="contains">{t('flows.builder.nodeInspector.condition.options.contains')}</SelectItem>
                  <SelectItem value="exists">{t('flows.builder.nodeInspector.condition.options.exists')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {config.operator !== 'exists' && (
              <Field label={t('flows.builder.nodeInspector.condition.valueLabel')}>
                <Input
                  value={(config.value as string) ?? ''}
                  onChange={(e) => set('value', e.target.value)}
                  placeholder={t('flows.builder.nodeInspector.condition.valuePlaceholder')}
                />
              </Field>
            )}
          </Section>
        )

      // ── Delay ─────────────────────────────────────────────────────────────
      case 'delay': {
        const seconds = (config.seconds as number) ?? 60
        const minutes = Math.round(seconds / 60)
        return (
          <Section title={t('flows.builder.nodeInspector.delay.sectionTitle')} accent={meta.color}>
            <Field label={t('flows.builder.nodeInspector.delay.secondsLabel')} hint={t('flows.builder.nodeInspector.delay.secondsHint')}>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={60}
                  step={60}
                  value={seconds}
                  onChange={(e) => set('seconds', Number(e.target.value))}
                />
                <span
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap tabular-nums"
                  style={{
                    background: 'color-mix(in srgb, var(--organic-sand-300) 35%, transparent)',
                    color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
                  }}
                >
                  {minutes >= 60
                    ? t('flows.builder.nodeInspector.delay.approxHours', { value: Math.round(minutes / 60) })
                    : t('flows.builder.nodeInspector.delay.approxMinutes', { value: minutes })}
                </span>
              </div>
            </Field>
          </Section>
        )
      }

      // ── Set / Remove tag ──────────────────────────────────────────────────
      case 'set_tag':
      case 'remove_tag':
        return (
          <Section title={nodeType === 'set_tag' ? t('flows.builder.nodeInspector.tag.addSectionTitle') : t('flows.builder.nodeInspector.tag.removeSectionTitle')} accent={meta.color}>
            <Field
              label={t('flows.builder.nodeInspector.tag.selectLabel')}
              hint={nodeType === 'set_tag' ? t('flows.builder.nodeInspector.tag.addHint') : t('flows.builder.nodeInspector.tag.removeHint')}
            >
              <Select value={(config.tag_id as string) ?? ''} onValueChange={(v) => v && set('tag_id', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('flows.builder.nodeInspector.tag.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {tags.length === 0 ? (
                    <SelectItem value="__empty__" disabled>{t('flows.builder.nodeInspector.tag.noTags')}</SelectItem>
                  ) : (
                    tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          </Section>
        )

      // ── Split test ────────────────────────────────────────────────────────
      case 'split_test': {
        const pctA = (config.percentage_a as number) ?? 50
        return (
          <>
            <Section title={t('flows.builder.nodeInspector.splitTest.sectionTitle')} accent={meta.color}>
              <Field label={t('flows.builder.nodeInspector.splitTest.branchALabel')}>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={pctA}
                    onChange={(e) => set('percentage_a', Number(e.target.value))}
                  />
                  <span
                    className="shrink-0 text-xs font-semibold"
                    style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                  >
                    {t('flows.builder.nodeInspector.splitTest.branchB', { value: 100 - pctA })}
                  </span>
                </div>
              </Field>
              {/* Visual split bar */}
              <div className="overflow-hidden rounded-full h-2" style={{ background: 'color-mix(in srgb, var(--organic-sand-300) 40%, transparent)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pctA}%`,
                    background: `linear-gradient(90deg, ${meta.color}, color-mix(in srgb, ${meta.color} 70%, transparent))`,
                  }}
                />
              </div>
            </Section>
            <InfoBox>{t('flows.builder.nodeInspector.splitTest.infoBox')}</InfoBox>
          </>
        )
      }

      // ── External request ─────────────────────────────────────────────────
      case 'external_request':
        return (
          <>
            <Section title={t('flows.builder.nodeInspector.externalRequest.sectionTitle')} accent={meta.color}>
              <Field label={t('flows.builder.nodeInspector.externalRequest.urlLabel')}>
                <Input
                  value={(config.url as string) ?? ''}
                  onChange={(e) => set('url', e.target.value)}
                  placeholder={t('flows.builder.nodeInspector.externalRequest.urlPlaceholder')}
                  className="font-mono text-xs"
                />
              </Field>
              <Field label={t('flows.builder.nodeInspector.externalRequest.methodLabel')}>
                <Select value={(config.method as string) ?? 'POST'} onValueChange={(v) => v && set('method', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {(config.method ?? 'POST') !== 'GET' && (
                <Field label={t('flows.builder.nodeInspector.externalRequest.bodyLabel')} hint={t('flows.builder.nodeInspector.externalRequest.bodyHint')}>
                  <Textarea
                    value={(config.body as string) ?? ''}
                    onChange={(e) => set('body', e.target.value)}
                    placeholder={'{"nom": "{{nom}}", "email": "{{email}}"}'}
                    rows={4}
                    className="resize-none font-mono text-xs"
                  />
                </Field>
              )}
              <Field label={t('flows.builder.nodeInspector.externalRequest.saveResponseLabel')} hint={t('flows.builder.nodeInspector.externalRequest.saveResponseHint')}>
                <Input
                  value={(config.save_response_as as string) ?? ''}
                  onChange={(e) => set('save_response_as', e.target.value)}
                  placeholder={t('flows.builder.nodeInspector.externalRequest.saveResponsePlaceholder')}
                  className="font-mono text-xs"
                />
              </Field>
            </Section>
            <InfoBox>{t('flows.builder.nodeInspector.externalRequest.infoBox')}</InfoBox>
          </>
        )

      // ── Capture input ─────────────────────────────────────────────────────
      case 'capture_input': {
        const varName = (config.variable_name as string) || 'variable'
        return (
          <>
            <Section title={t('flows.builder.nodeInspector.captureInput.sectionTitle')} accent={meta.color}>
              <Field
                label={t('flows.builder.nodeInspector.captureInput.variableNameLabel')}
                hint={t('flows.builder.nodeInspector.captureInput.variableNameHint', { variable: varName })}
              >
                <Input
                  value={(config.variable_name as string) ?? ''}
                  onChange={(e) => set('variable_name', e.target.value)}
                  placeholder={t('flows.builder.nodeInspector.captureInput.variableNamePlaceholder')}
                  className="font-mono text-sm"
                />
              </Field>

              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors"
                style={{
                  background: 'color-mix(in srgb, var(--organic-sand-300) 20%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--organic-sand-400) 25%, transparent)',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!config.save_to_custom_field}
                  onChange={(e) => set('save_to_custom_field', e.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-primary"
                />
                <span className="text-[12px] leading-relaxed" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  {t('flows.builder.nodeInspector.captureInput.saveToCustomFieldPrefix')}{' '}
                  <code
                    className="rounded-md px-1.5 py-0.5 font-mono text-[10px]"
                    style={{
                      background: 'color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
                      color: 'var(--organic-terracotta)',
                    }}
                  >
                    {`{{champ.${varName}}}`}
                  </code>
                </span>
              </label>
            </Section>
            <InfoBox>{t('flows.builder.nodeInspector.captureInput.infoBox')}</InfoBox>
          </>
        )
      }

      // ── Jump ──────────────────────────────────────────────────────────────
      case 'jump':
        return (
          <Section title={t('flows.builder.nodeInspector.jump.sectionTitle')} accent={meta.color}>
            <Field label={t('flows.builder.nodeInspector.jump.targetFlowLabel')} hint={t('flows.builder.nodeInspector.jump.targetFlowHint')}>
              <Select value={(config.target_flow_id as string) ?? ''} onValueChange={(v) => v && set('target_flow_id', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('flows.builder.nodeInspector.jump.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {flows.length === 0 ? (
                    <SelectItem value="__empty__" disabled>{t('flows.builder.nodeInspector.jump.noFlows')}</SelectItem>
                  ) : (
                    flows.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          </Section>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-3.5">
      {/* ── Node type header ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-4"
        style={{ background: meta.gradient }}
      >
        {/* Glow orb */}
        <div
          className="pointer-events-none absolute -top-6 -end-6 size-24 rounded-full opacity-60"
          style={{ background: `radial-gradient(circle, ${meta.glow}, transparent 70%)` }}
        />

        <div className="relative flex items-center gap-3.5">
          {/* Icon badge */}
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
              border: `1.5px solid color-mix(in srgb, ${meta.color} 35%, transparent)`,
              boxShadow: `0 4px 12px ${meta.glow}`,
            }}
          >
            <Icon className="size-5" style={{ color: meta.color }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight text-foreground">{metaLabel}</p>
            <p
              className="mt-0.5 text-[10.5px] font-medium"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}
            >
              {t('flows.builder.nodeInspector.configureThisNode')}
            </p>
          </div>

          {/* Type badge */}
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
              color: meta.color,
              border: `1px solid color-mix(in srgb, ${meta.color} 25%, transparent)`,
            }}
          >
            {metaShort}
          </span>
        </div>
      </div>

      {/* ── Fields ───────────────────────────────────────────────────── */}
      {renderFields()}
    </div>
  )
}
