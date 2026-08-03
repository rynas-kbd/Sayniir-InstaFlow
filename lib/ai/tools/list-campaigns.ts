import { listByAccountTool } from './list-by-account'

export const listCampaignsTool = listByAccountTool({
  name: 'list_campaigns',
  description: 'Liste les campagnes du compte avec leur statut (draft, scheduled, sending, sent, cancelled, failed).',
  table: 'campaigns',
  columns: 'id, name, status, scheduled_at',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'campaigns',
})
