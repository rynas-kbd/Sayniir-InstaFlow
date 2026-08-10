import { deleteByIdTool } from './delete-by-id.ts'

export const deleteAutomationRuleTool = deleteByIdTool({
  name: 'delete_automation_rule',
  description: "Supprime une règle d'automatisation. Irréversible.",
  table: 'automation_rules',
  idField: 'ruleId',
  resultKey: 'deleted',
  notFoundMessage: 'Règle introuvable',
})
