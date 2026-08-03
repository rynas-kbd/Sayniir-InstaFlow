import { deleteByIdTool } from './delete-by-id'

export const deleteCampaignTool = deleteByIdTool({
  name: 'delete_campaign',
  description: 'Supprime une campagne (brouillon ou déjà terminée). Pour arrêter un envoi en cours, utilise cancel_campaign. Irréversible.',
  table: 'campaigns',
  idField: 'campaignId',
  resultKey: 'deleted',
  notFoundMessage: 'Campagne introuvable',
})
