import { deleteByIdTool } from './delete-by-id.ts'

export const removeTeamMemberTool = deleteByIdTool({
  name: 'remove_team_member',
  description: "Retire un membre de l'annuaire d'équipe. Irréversible.",
  table: 'team_members',
  idField: 'memberId',
  resultKey: 'removed',
  notFoundMessage: 'Membre introuvable',
})
