import { listByAccountTool } from './list-by-account'

export const listSegmentsTool = listByAccountTool({
  name: 'list_segments',
  description: 'Liste les segments de contacts réutilisables du compte.',
  table: 'segments',
  columns: 'id, name, tag_ids',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'segments',
})
