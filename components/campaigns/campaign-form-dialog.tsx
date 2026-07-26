'use client'

import { Megaphone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { FormDialogHeader } from '@/components/shared/form-section'
import { FormFooter } from '@/components/shared/form-footer'
import { useCampaignForm } from './campaign-form/use-campaign-form'
import { CampaignFormBody } from './campaign-form/campaign-form-body'
import type { Tag } from '@/components/contacts/types'
import type { Campaign, Segment } from './types'

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
  const api = useCampaignForm({ channelAccountId, campaign, onSave, onSaved: onClose })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border bg-card/60 px-5 py-4 pr-12 backdrop-blur-sm">
          <FormDialogHeader
            icon={Megaphone}
            title={campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
            description="Diffusez un message à une audience ciblée."
          />
        </DialogHeader>

        <form onSubmit={api.submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <CampaignFormBody api={api} tags={tags} segments={segments} onSegmentsChange={onSegmentsChange} />
          </div>
          <FormFooter
            saving={api.saving}
            submitLabel={campaign ? 'Sauvegarder' : 'Créer'}
            onCancel={onClose}
            className="shrink-0 justify-end border-t border-border bg-muted/40 px-5 py-3"
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
