import { deleteByIdTool } from './delete-by-id'

export const deleteProductTool = deleteByIdTool({
  name: 'delete_product',
  description: 'Supprime un produit/offre de la Boutique. Irréversible.',
  table: 'products',
  idField: 'productId',
  resultKey: 'deleted',
  notFoundMessage: 'Produit introuvable',
})
