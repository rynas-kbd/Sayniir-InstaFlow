'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { useProductForm } from './product-form/use-product-form'
import { ProductFormBody } from './product-form/product-form-body'
import { FormFooter } from '@/components/shared/form-footer'
import { ProductLivePreview } from './product-form/product-live-preview'
import { useT } from '@/components/i18n-provider'
import type { Product } from './types'

export function CreateProductPageForm({ channelAccountId }: { channelAccountId: string }) {
  const router = useRouter()
  const t = useT()

  async function handleCreate(data: Partial<Product> & { channel_account_id: string }) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
  }

  const api = useProductForm({ channelAccountId, onSave: handleCreate, onSaved: () => router.push('/boutique') })

  return (
    <form onSubmit={api.submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-2xl">
        <Card>
          <CardContent className="pt-2">
            <ProductFormBody api={api} autoFocusName />
          </CardContent>
        </Card>
        <FormFooter saving={api.saving} submitLabel={t('boutique.createPage.submitLabel')} onCancel={() => router.push('/boutique')} className="justify-end" />
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ProductLivePreview form={api.form} />
      </aside>
    </form>
  )
}
