'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ImageUploadField } from '@/components/shared/image-upload-field'
import { useT } from '@/components/i18n-provider'
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
  channelAccountId,
  folder,
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
  /** Optional — when provided (with `folder`), the image field gains an upload button via
   * ImageUploadField instead of a bare URL input. Left undefined by node-inspector.tsx, which
   * keeps the plain input; making this required would break that caller. */
  channelAccountId?: string
  folder?: string
}) {
  const t = useT()

  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <Label>{t('shared.cardFields.cardTitleLabel')}</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder={t('shared.cardFields.cardTitlePlaceholder')} />
      </div>

      <div className="space-y-1.5">
        <Label>{t('shared.cardFields.subtitleLabel')}</Label>
        <Input
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder={t('shared.cardFields.subtitlePlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('shared.cardFields.imageLabel')}</Label>
        {channelAccountId && folder ? (
          <ImageUploadField value={imageUrl} onChange={onImageUrlChange} channelAccountId={channelAccountId} folder={folder} />
        ) : (
          <Input value={imageUrl} onChange={(e) => onImageUrlChange(e.target.value)} placeholder="https://..." />
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs font-semibold">{t('shared.cardFields.buttonsLabel')}</Label>
          {buttons.length < 3 && (
            <button
              type="button"
              onClick={() => onButtonsChange([...buttons, { type: 'web_url', title: 'Acheter', url: 'https://' }])}
              className="-m-1.5 cursor-pointer p-1.5 text-xs font-medium text-primary hover:underline"
            >
              {t('shared.cardFields.addButton')}
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {buttons.map((btn, idx) => {
            const btnType = btn.type ?? 'web_url'
            return (
              <div key={idx} className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/20 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {t('shared.cardFields.buttonN', { index: idx + 1 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...buttons]
                      copy.splice(idx, 1)
                      onButtonsChange(copy)
                    }}
                    className="-m-1.5 cursor-pointer p-1.5 text-[10px] text-destructive hover:underline"
                  >
                    {t('shared.cardFields.removeButton')}
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
                    <SelectTrigger className="h-8 sm:h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web_url">{t('shared.cardFields.buttonTypeLink')}</SelectItem>
                      <SelectItem value="postback">{t('shared.cardFields.buttonTypePostback')}</SelectItem>
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
                  placeholder={t('shared.cardFields.buttonTitlePlaceholder')}
                  className="h-8 sm:h-7 text-xs"
                />

                {btnType === 'web_url' && (
                  <Input
                    value={btn.url ?? ''}
                    onChange={(e) => {
                      const copy = [...buttons]
                      copy[idx] = { ...copy[idx], url: e.target.value }
                      onButtonsChange(copy)
                    }}
                    placeholder={t('shared.cardFields.buttonUrlPlaceholder')}
                    className="h-8 sm:h-7 text-xs"
                  />
                )}

                {btnType === 'postback' && allowPostbackButtons && (
                  <p className="text-[10px] text-muted-foreground">
                    {t('shared.cardFields.postbackHint')}
                  </p>
                )}
              </div>
            )
          })}
          {buttons.length === 0 && (
            <p className="py-2 text-center text-xs italic text-muted-foreground">
              {t('shared.cardFields.noButtons')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
