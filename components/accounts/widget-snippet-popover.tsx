'use client'

import { toast } from 'sonner'
import { Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function WidgetSnippetPopover({ platform, target }: { platform: string; target: string }) {
  const snippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-platform="${platform === 'instagram' ? 'instagram' : platform === 'whatsapp' ? 'whatsapp' : 'messenger'}" data-target="${target}" async></script>`

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" className="size-7" aria-label="Widget site web" />}>
        <Code2 className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Widget de chat pour votre site
        </p>
        <p className="mb-2 text-xs text-muted-foreground">
          Collez ce code juste avant <code>&lt;/body&gt;</code> sur votre site — une bulle de chat apparaîtra en bas
          à droite.
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
            toast.success('Code copié')
          }}
        >
          Copier le code
        </Button>
      </PopoverContent>
    </Popover>
  )
}
