import { deleteByIdTool } from './delete-by-id'

export const deleteSnippetTool = deleteByIdTool({
  name: 'delete_snippet',
  description: 'Supprime une réponse enregistrée. Irréversible.',
  table: 'snippets',
  idField: 'snippetId',
  resultKey: 'deleted',
  notFoundMessage: 'Snippet introuvable',
})
