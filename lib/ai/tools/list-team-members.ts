import { listByAccountTool } from './list-by-account'

export const listTeamMembersTool = listByAccountTool({
  name: 'list_team_members',
  description: "Liste l'annuaire d'équipe du compte (nom + email, pas un accès de connexion partagé).",
  table: 'team_members',
  columns: 'id, name, email',
  orderBy: { column: 'created_at', ascending: false },
  resultKey: 'members',
})
