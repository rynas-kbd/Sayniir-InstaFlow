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

    case 'send_message':
      return (
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea
            value={(config.text as string) ?? ''}
            onChange={(e) => set('text', e.target.value)}
            placeholder="Bonjour ! 👋"
            rows={4}
          />
        </div>
      )

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
