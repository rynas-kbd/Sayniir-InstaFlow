'use client'

import { toast } from 'sonner'
import { Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useT } from '@/components/i18n-provider'

export function WidgetSnippetPopover({ platform, target }: { platform: string; target: string }) {
  const t = useT()
  const snippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-platform="${platform === 'instagram' ? 'instagram' : platform === 'whatsapp' ? 'whatsapp' : 'messenger'}" data-target="${target}" async></script>`

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" className="size-7" aria-label={t('accounts.widgetSnippet.ariaLabel')} />}>
        <Code2 className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('accounts.widgetSnippet.title')}
        </p>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('accounts.widgetSnippet.description')}
        </p>
        <pre className="overflow-x-auto rounded-md bg-muted p-2 text-[10px] leading-relaxed break-all whitespace-pre-wrap">
          {snippet}
        </pre>
        <Button
          type="button"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            navigator.clipboard.writeText(snippet)
            toast.success(t('accounts.widgetSnippet.copiedToast'))
          }}
        >
          {t('accounts.widgetSnippet.copyButton')}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
