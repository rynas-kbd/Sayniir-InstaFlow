import { listByAccountTool } from './list-by-account'

export const listTagsTool = listByAccountTool({
  name: 'list_tags',
  description: 'Liste les tags du compte.',
  table: 'tags',
  columns: 'id, name',
  orderBy: { column: 'name', ascending: true },
  resultKey: 'tags',
})
