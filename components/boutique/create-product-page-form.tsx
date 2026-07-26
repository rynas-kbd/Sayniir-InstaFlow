'use client'

import { useRouter } from 'next/navigation'
import { ProductFormFields } from './product-form-fields'
import type { Product } from './types'

export function CreateProductPageForm({ channelAccountId }: { channelAccountId: string }) {
  const router = useRouter()

  async function handleCreate(data: Partial<Product> & { channel_account_id: string }) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
  }

  return <ProductFormFields channelAccountId={channelAccountId} onSave={handleCreate} onSaved={() => router.push('/boutique')} submitLabel="Créer" />
}
