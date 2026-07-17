import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { FlowNodeType, CardButton } from '../types'
import type { Tag } from '@/components/contacts/types'
import type { FlowSummary } from '../types'
import { CardFieldsEditor } from '@/components/shared/card-fields-editor'

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
  tags: Tag[]
  flows: FlowSummary[]
}) {
  function set(key: string, value: unknown) {
    onChange({ ...config, [key]: value })
  }

  switch (nodeType) {
    case 'trigger': {
      const triggerType = (config.trigger_type as string) ?? 'any_message'
      // Use local raw string state so we don't PATCH on every keystroke
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
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type de déclencheur</Label>
            <Select value={triggerType} onValueChange={(v) => v && onChange({ ...config, trigger_type: v, trigger_keywords: null, target_post_ids: null })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any_message">Tout message DM</SelectItem>
                <SelectItem value="keyword">Mot-clé dans DM</SelectItem>
                <SelectItem value="any_comment">Tout commentaire</SelectItem>
                <SelectItem value="comment_keyword">Mot-clé dans commentaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(triggerType === 'keyword' || triggerType === 'comment_keyword') && (
            <div className="space-y-1.5">
              <Label>Mots-clés (séparés par virgule)</Label>
              <Input
                defaultValue={keywords}
                onBlur={(e) => commitKeywords(e.target.value)}
                placeholder="promo, commande, prix…"
              />
              <p className="text-xs text-muted-foreground">Le flow se déclenche si le message contient l&apos;un de ces mots.</p>
            </div>
          )}

          {isComment && (
            <div className="space-y-1.5">
              <Label>IDs de posts ciblés (optionnel)</Label>
              <Input
                defaultValue={postIds}
                onBlur={(e) => commitPostIds(e.target.value)}
                placeholder="123456789, 987654321…"
              />
              <p className="text-xs text-muted-foreground">Laissez vide pour tous les posts.</p>
            </div>
          )}

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">
              💡 Modifications sauvegardées automatiquement.
            </p>
          </div>
        </div>
      )
    }

    case 'send_message': {
      const messageType = (config.message_type as string) ?? 'text'
      const buttons = (config.card_buttons as CardButton[]) ?? []

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type de message</Label>
            <Select value={messageType} onValueChange={(v) => v && set('message_type', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texte standard</SelectItem>
                <SelectItem value="card">Carte / Image (ManyChat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {messageType === 'text' ? (
            <div className="space-y-1.5">
              <Label>Texte du message</Label>
              <Textarea
                value={(config.text as string) ?? ''}
                onChange={(e) => set('text', e.target.value)}
                placeholder="Bonjour ! 👋"
                rows={4}
              />
            </div>
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
        </div>
      )
    }

    case 'ai_reply':
      return (
        <div className="space-y-1.5">
          <Label>Instructions pour l&apos;IA</Label>
          <Textarea
            value={(config.instructions as string) ?? ''}
            onChange={(e) => set('instructions', e.target.value)}
            placeholder="Réponds aux questions sur nos horaires d'ouverture."
            rows={4}
          />
        </div>
      )

    case 'condition':
      return (
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label>Champ</Label>
            <Input
              value={(config.field as string) ?? ''}
              onChange={(e) => set('field', e.target.value)}
              placeholder="phone, email, custom_fields.budget, context.xyz…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Opérateur</Label>
            <Select value={(config.operator as string) ?? 'equals'} onValueChange={(v) => v && set('operator', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Égal à</SelectItem>
                <SelectItem value="contains">Contient</SelectItem>
                <SelectItem value="exists">Existe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.operator !== 'exists' && (
            <div className="space-y-1.5">
              <Label>Valeur</Label>
              <Input value={(config.value as string) ?? ''} onChange={(e) => set('value', e.target.value)} />
            </div>
          )}
        </div>
      )

    case 'delay':
      return (
        <div className="space-y-1.5">
          <Label>Durée (secondes)</Label>
          <Input
            type="number"
            min={60}
            value={(config.seconds as number) ?? 60}
            onChange={(e) => set('seconds', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Granularité minimale : 1 minute.</p>
        </div>
      )

    case 'set_tag':
    case 'remove_tag':
      return (
        <div className="space-y-1.5">
          <Label>Tag</Label>
          <Select value={(config.tag_id as string) ?? ''} onValueChange={(v) => v && set('tag_id', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un tag" />
            </SelectTrigger>
            <SelectContent>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'jump':
      return (
        <div className="space-y-1.5">
          <Label>Flow cible</Label>
          <Select value={(config.target_flow_id as string) ?? ''} onValueChange={(v) => v && set('target_flow_id', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un flow" />
            </SelectTrigger>
            <SelectContent>
              {flows.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    default:
      return null
  }
}
