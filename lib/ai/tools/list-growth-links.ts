import { listByAccountTool } from './list-by-account'

export const listGrowthLinksTool = listByAccountTool({
  name: 'list_growth_links',
  description: 'Liste les liens de croissance (deep links qui déclenchent un flow) du compte.',
  table: 'growth_links',
  columns: 'id, name, code, flow_id, clicks',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'links',
})
