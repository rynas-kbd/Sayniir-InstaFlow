import { listByAccountTool } from './list-by-account'

export const listSnippetsTool = listByAccountTool({
  name: 'list_snippets',
  description: "Liste les réponses enregistrées (raccourci → texte) de l'inbox.",
  table: 'snippets',
  columns: 'id, shortcut, text',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'snippets',
})
