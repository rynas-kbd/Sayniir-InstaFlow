import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { CardButton } from '@/components/flows/types'

export function CardFieldsEditor({
  title,
  subtitle,
  imageUrl,
  buttons,
  onTitleChange,
  onSubtitleChange,
  onImageUrlChange,
  onButtonsChange,
  allowPostbackButtons = false,
}: {
  title: string
  subtitle: string
  imageUrl: string
  buttons: CardButton[]
  onTitleChange: (v: string) => void
  onSubtitleChange: (v: string) => void
  onImageUrlChange: (v: string) => void
  onButtonsChange: (v: CardButton[]) => void
  allowPostbackButtons?: boolean
}) {
  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <Label>Titre de la carte</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="ex: Super promotion !" />
      </div>

      <div className="space-y-1.5">
        <Label>Description / Sous-titre</Label>
        <Input
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="ex: Profitez de 20% aujourd'hui."
        />
      </div>

      <div className="space-y-1.5">
        <Label>URL de l&apos;image (optionnel)</Label>
        <Input value={imageUrl} onChange={(e) => onImageUrlChange(e.target.value)} placeholder="https://..." />
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs font-semibold">Boutons (max 3)</Label>
          {buttons.length < 3 && (
            <button
              type="button"
              onClick={() => onButtonsChange([...buttons, { type: 'web_url', title: 'Acheter', url: 'https://' }])}
              className="cursor-pointer text-xs font-medium text-primary hover:underline"
            >
              + Ajouter
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {buttons.map((btn, idx) => {
            const btnType = btn.type ?? 'web_url'
            return (
              <div key={idx} className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/20 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground">Bouton {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...buttons]
                      copy.splice(idx, 1)
                      onButtonsChange(copy)
                    }}
                    className="cursor-pointer text-[10px] text-destructive hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                {allowPostbackButtons && (
                  <Select
                    value={btnType}
                    onValueChange={(v) => {
                      if (!v) return
                      const copy = [...buttons]
                      copy[idx] =
                        v === 'postback'
                          ? { type: 'postback', title: btn.title }
                          : { type: 'web_url', title: btn.title, url: btn.url ?? 'https://' }
                      onButtonsChange(copy)
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web_url">Lien (URL)</SelectItem>
                      <SelectItem value="postback">Bouton d&apos;action (continue le flow)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Input
                  value={btn.title}
                  onChange={(e) => {
                    const copy = [...buttons]
                    copy[idx] = { ...copy[idx], title: e.target.value }
                    onButtonsChange(copy)
                  }}
                  placeholder="Texte du bouton"
                  className="h-7 text-xs"
                />

                {btnType === 'web_url' && (
                  <Input
                    value={btn.url ?? ''}
                    onChange={(e) => {
                      const copy = [...buttons]
                      copy[idx] = { ...copy[idx], url: e.target.value }
                      onButtonsChange(copy)
                    }}
                    placeholder="Lien URL (https://...)"
                    className="h-7 text-xs"
                  />
                )}

                {btnType === 'postback' && allowPostbackButtons && (
                  <p className="text-[10px] text-muted-foreground">
                    Reliez ce bouton à un nœud suivant sur le canvas pour définir ce qui se passe au clic.
                  </p>
                )}
              </div>
            )
          })}
          {buttons.length === 0 && (
            <p className="py-2 text-center text-xs italic text-muted-foreground">
              Aucun bouton. L&apos;utilisateur cliquera sur la carte.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
