import { listByAccountTool } from './list-by-account'

export const listAutomationRulesTool = listByAccountTool({
  name: 'list_automation_rules',
  description:
    "Liste les règles d'automatisation classiques (mot-clé → réponse) du compte — distinctes des flows visuels, voir create_automation_rule.",
  table: 'automation_rules',
  columns: 'id, name, trigger_type, trigger_keywords, is_active',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'rules',
})
