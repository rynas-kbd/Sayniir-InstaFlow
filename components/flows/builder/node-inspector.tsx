import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { FlowNodeType } from '../types'
import type { Tag } from '@/components/contacts/types'
import type { FlowSummary } from '../types'

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
    case 'trigger':
      return <p className="text-sm text-muted-foreground">Point de départ du flow. Le déclencheur se configure dans la liste des flows.</p>

    case 'send_message': {
      const messageType = (config.message_type as string) ?? 'text'
      const buttons = (config.card_buttons as Array<{ title: string; url: string }>) ?? []

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
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label>Titre de la carte</Label>
                <Input
                  value={(config.card_title as string) ?? ''}
                  onChange={(e) => set('card_title', e.target.value)}
                  placeholder="ex: Super promotion !"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description / Sous-titre</Label>
                <Input
                  value={(config.card_subtitle as string) ?? ''}
                  onChange={(e) => set('card_subtitle', e.target.value)}
                  placeholder="ex: Profitez de 20% aujourd'hui."
                />
              </div>

              <div className="space-y-1.5">
                <Label>URL de l'image (optionnel)</Label>
                <Input
                  value={(config.card_image_url as string) ?? ''}
                  onChange={(e) => set('card_image_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-semibold">Boutons (max 3)</Label>
                  {buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={() => set('card_buttons', [...buttons, { title: 'Acheter', url: 'https://' }])}
                      className="text-xs text-primary font-medium hover:underline cursor-pointer"
                    >
                      + Ajouter
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {buttons.map((btn, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 rounded-md border border-border p-2 bg-muted/20">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground">Bouton {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...buttons]
                            copy.splice(idx, 1)
                            set('card_buttons', copy)
                          }}
                          className="text-[10px] text-destructive hover:underline cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                      <Input
                        value={btn.title}
                        onChange={(e) => {
                          const copy = [...buttons]
                          copy[idx] = { ...copy[idx], title: e.target.value }
                          set('card_buttons', copy)
                        }}
                        placeholder="Texte du bouton"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={btn.url}
                        onChange={(e) => {
                          const copy = [...buttons]
                          copy[idx] = { ...copy[idx], url: e.target.value }
                          set('card_buttons', copy)
                        }}
                        placeholder="Lien URL (https://...)"
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                  {buttons.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">Aucun bouton. L'utilisateur cliquera sur la carte.</p>
                  )}
                </div>
              </div>
            </div>
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
              placeholder="phone, email, context.xyz…"
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
