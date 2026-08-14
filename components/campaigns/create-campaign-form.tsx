'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { FormFooter } from '@/components/shared/form-footer'
import { useCampaignForm } from './campaign-form/use-campaign-form'
import { CampaignFormBody } from './campaign-form/campaign-form-body'
import { CampaignLivePreview } from './campaign-form/campaign-live-preview'
import type { Tag } from '@/components/contacts/types'
import type { Campaign, Segment } from './types'
import { useT } from '@/components/i18n-provider'

export function CreateCampaignForm({
  channelAccountId,
  tags,
  segments: initialSegments,
}: {
  channelAccountId: string
  tags: Tag[]
  segments: Segment[]
}) {
  const t = useT()
  const router = useRouter()
  const [segments, setSegments] = useState(initialSegments)

  async function handleCreate(data: Partial<Campaign> & { channel_account_id: string }) {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
  }

  const api = useCampaignForm({ channelAccountId, onSave: handleCreate, onSaved: () => router.push('/campaigns') })

  return (
    <form onSubmit={api.submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-2xl">
        <Card>
          <CardContent className="pt-2">
            <CampaignFormBody api={api} tags={tags} segments={segments} onSegmentsChange={setSegments} autoFocusName />
          </CardContent>
        </Card>
        <FormFooter saving={api.saving} submitLabel={t('campaigns.formDialog.create')} onCancel={() => router.push('/campaigns')} className="justify-end" />
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <CampaignLivePreview form={api.form} tags={tags} segments={segments} />
      </aside>
    </form>
  )
}
