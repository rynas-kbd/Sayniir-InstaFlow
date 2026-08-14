'use client'

import { Megaphone } from 'lucide-react'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
} from '@/components/ui/responsive-dialog'
import { FormDialogHeader } from '@/components/shared/form-section'
import { FormFooter } from '@/components/shared/form-footer'
import { useCampaignForm } from './campaign-form/use-campaign-form'
import { CampaignFormBody } from './campaign-form/campaign-form-body'
import type { Tag } from '@/components/contacts/types'
import type { Campaign, Segment } from './types'
import { useT } from '@/components/i18n-provider'

export function CampaignFormDialog({
  open,
  channelAccountId,
  campaign,
  tags,
  segments,
  onSegmentsChange,
  onSave,
  onClose,
}: {
  open: boolean
  channelAccountId: string
  campaign?: Campaign
  tags: Tag[]
  segments: Segment[]
  onSegmentsChange: (segments: Segment[]) => void
  onSave: (data: Partial<Campaign> & { channel_account_id: string }) => Promise<void>
  onClose: () => void
}) {
  const t = useT()
  const api = useCampaignForm({ channelAccountId, campaign, onSave, onSaved: onClose })

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <ResponsiveDialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <ResponsiveDialogHeader className="shrink-0 border-b border-border bg-card/60 px-5 py-4 pe-12 backdrop-blur-sm">
          <FormDialogHeader
            icon={Megaphone}
            title={campaign ? t('campaigns.formDialog.editTitle') : t('campaigns.formDialog.createTitle')}
            description={t('campaigns.formDialog.description')}
          />
        </ResponsiveDialogHeader>

        <form onSubmit={api.submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <CampaignFormBody api={api} tags={tags} segments={segments} onSegmentsChange={onSegmentsChange} />
          </div>
          <FormFooter
            saving={api.saving}
            submitLabel={campaign ? t('campaigns.formDialog.save') : t('campaigns.formDialog.create')}
            onCancel={onClose}
            className="shrink-0 justify-end border-t border-border bg-muted/40 px-5 py-3"
          />
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
