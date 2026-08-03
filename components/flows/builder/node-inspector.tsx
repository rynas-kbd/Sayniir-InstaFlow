'use client'

import { useId, isValidElement, cloneElement, type ReactElement } from 'react'
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
} from 'lucide-react'
import type { FlowNodeType, CardButton } from '../types'
import type { Tag as ContactTag } from '@/components/contacts/types'
import type { FlowSummary } from '../types'
import { CardFieldsEditor } from '@/components/shared/card-fields-editor'

// ── Node metadata ──────────────────────────────────────────────────────────
const NODE_META: Record<FlowNodeType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  trigger:          { label: 'Déclencheur',         icon: Zap,                  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  send_message:     { label: 'Envoyer un message',  icon: MessageSquare,        color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  ai_reply:         { label: 'Réponse IA',           icon: Sparkles,             color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  condition:        { label: 'Condition',            icon: GitBranch,            color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  delay:            { label: 'Délai',                icon: Clock,                color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'  },
  set_tag:          { label: 'Ajouter un tag',       icon: Tag,                  color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  remove_tag:       { label: 'Retirer un tag',       icon: Tag,                  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  jump:             { label: 'Aller vers un flow',   icon: ArrowRightCircle,     color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  capture_input:    { label: 'Capturer une réponse', icon: ListPlus,             color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  external_request: { label: 'Requête externe',      icon: Globe,                color: '#64748b', bg: 'rgba(100,116,139,0.1)'},
  split_test:       { label: 'Split A/B',            icon: SplitSquareHorizontal,color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
}

// ── Shared sub-components ─────────────────────────────────────────────────

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
      {title && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{title}</p>
      )}
      {children}
    </div>
  )
}

/**
 * Auto-wires htmlFor/id when the field's single child is a plain Input or
 * Textarea, so clicking the label focuses the control and screen readers
 * announce the association — 15 of the ~18 Field call sites in this file
 * previously had a decorative-only Label. Left unwired for Select and
 * multi-element children (several call sites wrap an Input in a flex div,
 * or use Select's own trigger button) rather than mis-cloning an id onto a
 * compound component that wouldn't forward it to the right DOM node.
 */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const generatedId = useId()
  const canWireId = isValidElement(children) && (children.type === Input || children.type === Textarea)
  const existingId = canWireId ? (children as ReactElement<{ id?: string }>).props.id : undefined
  const fieldId = canWireId ? existingId ?? generatedId : undefined
  const child = canWireId && !existingId ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId }) : children

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-xs font-semibold text-foreground/80">{label}</Label>
      {child}
      {hint && <p className="text-[11px] leading-relaxed text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
      <Info className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
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
}: {
  nodeType: FlowNodeType
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  tags: ContactTag[]
  flows: FlowSummary[]
}) {
  const meta = NODE_META[nodeType] ?? NODE_META.send_message
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
        const postIds = ((config.target_post_ids as string[] | null) ?? []).join(', ')
        const isComment = triggerType === 'any_comment' || triggerType === 'comment_keyword'

        function commitKeywords(raw: string) {
          const arr = raw ? raw.split(',').map((k) => k.trim()).filter(Boolean) : null
          onChange({ ...config, trigger_keywords: arr })
        }
        function commitPostIds(raw: string) {
          const arr = raw ? raw.split(',').map((k) => k.trim()).filter(Boolean) : null
          onChange({ ...config, target_post_ids: arr })
        }

        return (
          <>
            <Section title="Événement déclencheur">
              <Field label="Type de déclencheur">
                <Select value={triggerType} onValueChange={(v) => v && onChange({ ...config, trigger_type: v, trigger_keywords: null, target_post_ids: null })}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any_message">💬 Tout message DM</SelectItem>
                    <SelectItem value="keyword">🔑 Mot-clé dans DM</SelectItem>
                    <SelectItem value="any_comment">💬 Tout commentaire</SelectItem>
                    <SelectItem value="comment_keyword">🔑 Mot-clé dans commentaire</SelectItem>
                    <SelectItem value="story_reply">📖 Réponse à une story</SelectItem>
                    <SelectItem value="story_mention">📣 Mention dans une story</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {(triggerType === 'keyword' || triggerType === 'comment_keyword') && (
                <Field label="Mots-clés" hint="Séparez les mots-clés par des virgules. Le flow se déclenche si le message contient l'un d'eux.">
                  <Input
                    defaultValue={keywords}
                    onBlur={(e) => commitKeywords(e.target.value)}
                    placeholder="promo, commande, prix…"
                    className="bg-background"
                  />
                </Field>
              )}

              {isComment && (
                <Field label="IDs de posts ciblés" hint="Laissez vide pour tous les posts.">
                  <Input
                    defaultValue={postIds}
                    onBlur={(e) => commitPostIds(e.target.value)}
                    placeholder="123456789, 987654321…"
                    className="bg-background"
                  />
                </Field>
              )}
            </Section>
            <InfoBox>Modifications sauvegardées automatiquement à chaque changement.</InfoBox>
          </>
        )
      }

      // ── Send message ─────────────────────────────────────────────────────
      case 'send_message': {
        const messageType = (config.message_type as string) ?? 'text'
        const buttons = (config.card_buttons as CardButton[]) ?? []

        return (
          <Section title="Contenu du message">
            <Field label="Type de message">
              <Select value={messageType} onValueChange={(v) => v && set('message_type', v)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">📝 Texte standard</SelectItem>
                  <SelectItem value="card">🖼️ Carte / Image</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {messageType === 'text' ? (
              <Field label="Texte du message" hint="Utilisez {{nom}}, {{prenom}} pour personnaliser.">
                <Textarea
                  value={(config.text as string) ?? ''}
                  onChange={(e) => set('text', e.target.value)}
                  placeholder="Bonjour ! 👋"
                  rows={4}
                  className="resize-none bg-background font-sans text-sm"
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
          <Section title="Instructions pour l'IA">
            <Field label="Prompt / Instructions" hint="L'IA répondra en suivant ces instructions dans le contexte de la conversation.">
              <Textarea
                value={(config.instructions as string) ?? ''}
                onChange={(e) => set('instructions', e.target.value)}
                placeholder="Réponds aux questions sur nos horaires d'ouverture. Reste toujours courtois."
                rows={5}
                className="resize-none bg-background text-sm"
              />
            </Field>
            <InfoBox>L'IA a accès au contexte de la conversation et aux données du contact.</InfoBox>
          </Section>
        )

      // ── Condition ─────────────────────────────────────────────────────────
      case 'condition':
        return (
          <Section title="Règle de condition">
            <Field label="Champ à évaluer" hint="Ex: phone, email, custom_fields.budget">
              <Input
                value={(config.field as string) ?? ''}
                onChange={(e) => set('field', e.target.value)}
                placeholder="phone, email, custom_fields.budget…"
                className="bg-background font-mono text-sm"
              />
            </Field>
            <Field label="Opérateur">
              <Select value={(config.operator as string) ?? 'equals'} onValueChange={(v) => v && set('operator', v)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">= Égal à</SelectItem>
                  <SelectItem value="contains">⊂ Contient</SelectItem>
                  <SelectItem value="exists">✓ Existe (non vide)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {config.operator !== 'exists' && (
              <Field label="Valeur">
                <Input
                  value={(config.value as string) ?? ''}
                  onChange={(e) => set('value', e.target.value)}
                  placeholder="valeur attendue…"
                  className="bg-background"
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
          <Section title="Durée d'attente">
            <Field label="Durée en secondes" hint="Minimum : 60s (1 minute). Le flow reprend automatiquement après ce délai.">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={60}
                  step={60}
                  value={seconds}
                  onChange={(e) => set('seconds', Number(e.target.value))}
                  className="bg-background"
                />
                <span className="shrink-0 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                  ≈ {minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}min`}
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
          <Section title={nodeType === 'set_tag' ? 'Tag à ajouter' : 'Tag à retirer'}>
            <Field label="Sélectionner un tag" hint={nodeType === 'set_tag' ? 'Le tag sera ajouté au contact quand ce nœud est atteint.' : 'Le tag sera retiré du contact quand ce nœud est atteint.'}>
              <Select value={(config.tag_id as string) ?? ''} onValueChange={(v) => v && set('tag_id', v)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Choisir un tag…" />
                </SelectTrigger>
                <SelectContent>
                  {tags.length === 0 ? (
                    <SelectItem value="__empty__" disabled>Aucun tag disponible</SelectItem>
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
          <Section title="Répartition A/B">
            <Field label="Branche A (%)">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={pctA}
                  onChange={(e) => set('percentage_a', Number(e.target.value))}
                  className="bg-background"
                />
                <span className="shrink-0 text-xs text-muted-foreground">→ B : {100 - pctA}%</span>
              </div>
            </Field>
            {/* Visual split indicator */}
            <div className="overflow-hidden rounded-full bg-muted/50 h-2.5">
              <div className="h-full rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${pctA}%` }} />
            </div>
            <InfoBox>Chaque contact est assigné aléatoirement à une branche, une seule fois.</InfoBox>
          </Section>
        )
      }

      // ── External request ─────────────────────────────────────────────────
      case 'external_request':
        return (
          <>
            <Section title="Requête HTTP">
              <Field label="URL cible">
                <Input
                  value={(config.url as string) ?? ''}
                  onChange={(e) => set('url', e.target.value)}
                  placeholder="https://hooks.zapier.com/…"
                  className="bg-background font-mono text-xs"
                />
              </Field>
              <Field label="Méthode">
                <Select value={(config.method as string) ?? 'POST'} onValueChange={(v) => v && set('method', v)}>
                  <SelectTrigger className="w-full bg-background">
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
                <Field label="Corps (JSON)" hint='Utilisez {"clé": "{{variable}}"} pour injecter des données du contact.'>
                  <Textarea
                    value={(config.body as string) ?? ''}
                    onChange={(e) => set('body', e.target.value)}
                    placeholder={'{"nom": "{{nom}}", "email": "{{email}}"}'}
                    rows={4}
                    className="resize-none bg-background font-mono text-xs"
                  />
                </Field>
              )}
              <Field label="Enregistrer la réponse sous" hint="Optionnel. Réutilisable ensuite dans une condition.">
                <Input
                  value={(config.save_response_as as string) ?? ''}
                  onChange={(e) => set('save_response_as', e.target.value)}
                  placeholder="ex: crm_response"
                  className="bg-background font-mono text-xs"
                />
              </Field>
            </Section>
            <InfoBox>En cas d'échec de la requête, le flow continue normalement sans s'arrêter.</InfoBox>
          </>
        )

      // ── Capture input ─────────────────────────────────────────────────────
      case 'capture_input': {
        const varName = (config.variable_name as string) || 'variable'
        return (
          <>
            <Section title="Capture de réponse">
              <Field label="Nom de la variable" hint={`Le prochain message du contact sera sauvegardé sous custom_fields.${varName}.`}>
                <Input
                  value={(config.variable_name as string) ?? ''}
                  onChange={(e) => set('variable_name', e.target.value)}
                  placeholder="email, budget, taille…"
                  className="bg-background font-mono text-sm"
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/50 bg-background p-3">
                <input
                  type="checkbox"
                  checked={!!config.save_to_custom_field}
                  onChange={(e) => set('save_to_custom_field', e.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-primary"
                />
                <span className="text-[12px] leading-relaxed text-muted-foreground">
                  Enregistrer dans les champs personnalisés du contact — réutilisable avec{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{`{{champ.${varName}}}`}</code>
                </span>
              </label>
            </Section>
            <InfoBox>Placez un nœud « Envoyer un message » juste avant pour poser la question. Ce nœud met le flow en attente de la réponse.</InfoBox>
          </>
        )
      }

      // ── Jump ──────────────────────────────────────────────────────────────
      case 'jump':
        return (
          <Section title="Redirection vers un autre flow">
            <Field label="Flow cible" hint="Le contact sera transféré vers le début du flow sélectionné.">
              <Select value={(config.target_flow_id as string) ?? ''} onValueChange={(v) => v && set('target_flow_id', v)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Choisir un flow…" />
                </SelectTrigger>
                <SelectContent>
                  {flows.length === 0 ? (
                    <SelectItem value="__empty__" disabled>Aucun autre flow disponible</SelectItem>
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
    <div className="space-y-4">
      {/* Node type header */}
      <div className="flex items-center gap-3 rounded-xl border border-border/40 p-3" style={{ background: meta.bg }}>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}
        >
          <Icon className="size-4" style={{ color: meta.color }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">{meta.label}</p>
          <p className="text-[10.5px] text-muted-foreground/70">Configurer ce nœud</p>
        </div>
      </div>

      {/* Fields */}
      {renderFields()}
    </div>
  )
}
