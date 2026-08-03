import { deleteByIdTool } from './delete-by-id'

export const deleteSegmentTool = deleteByIdTool({
  name: 'delete_segment',
  description: 'Supprime un segment de contacts. Irréversible.',
  table: 'segments',
  idField: 'segmentId',
  resultKey: 'deleted',
  notFoundMessage: 'Segment introuvable',
})
