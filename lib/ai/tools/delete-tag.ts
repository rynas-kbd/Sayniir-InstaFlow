import { deleteByIdTool } from './delete-by-id'

export const deleteTagTool = deleteByIdTool({
  name: 'delete_tag',
  description: 'Supprime un tag (le retire de tous les contacts qui le portaient). Irréversible.',
  table: 'tags',
  idField: 'tagId',
  resultKey: 'deleted',
  notFoundMessage: 'Tag introuvable',
})
