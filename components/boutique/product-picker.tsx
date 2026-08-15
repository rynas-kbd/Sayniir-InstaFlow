'use client'

import { useState } from 'react'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useT } from '@/components/i18n-provider'
import type { Product } from './types'

export function ProductPicker({ products, onPick }: { products: Product[]; onPick: (product: Product) => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg font-bold" />
        }
      >
        <Plus className="me-1.5 size-3.5" />
        {t('boutique.orderTable.editor.addItem')}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1.5" align="end">
        <Command>
          <CommandInput placeholder={t('boutique.orderTable.editor.searchProduct')} />
          <CommandList>
            <CommandEmpty>{t('boutique.orderTable.editor.noProducts')}</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.category ?? ''}`}
                  onSelect={() => {
                    onPick(product)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Package className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{product.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{product.price} {product.currency}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
