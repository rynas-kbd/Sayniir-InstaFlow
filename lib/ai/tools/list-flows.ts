import { listByAccountTool } from './list-by-account'

export const listFlowsTool = listByAccountTool({
  name: 'list_flows',
  description: 'Liste les flows du compte avec leur statut (draft, active, paused).',
  table: 'flows',
  columns: 'id, name, status',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'flows',
})
