import { deleteByIdTool } from './delete-by-id.ts'

export const deleteGrowthLinkTool = deleteByIdTool({
  name: 'delete_growth_link',
  description: 'Supprime un lien de croissance. Irréversible — un lien déjà partagé cessera de fonctionner.',
  table: 'growth_links',
  idField: 'linkId',
  resultKey: 'deleted',
  notFoundMessage: 'Lien introuvable',
})
