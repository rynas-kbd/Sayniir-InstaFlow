/**
 * Builds a human-readable confirmation preview from a write_live tool's
 * actual input, instead of the tool's static registry description (which
 * says nothing about which contact, which flow, or what text is involved —
 * see lib/ai/loop.ts and docs/AI_NATIVE_DESIGN.md §6.2). Kept synchronous
 * and DB-free by design: it renders straight from `block.input`, so ids
 * that aren't already human-readable (contactId, flowId, campaignId) show
 * as-is rather than requiring a round-trip before the confirm card can
 * render. Still a large improvement over the previous static text, and for
 * send_message_to_contact — the tool where this matters most — the actual
 * message body is shown in full.
 */
export function renderConfirmPreview(toolName: string, input: unknown): string {
  const i = (input ?? {}) as Record<string, unknown>

  switch (toolName) {
    case 'delete_contact':
      return `Supprimer définitivement le contact ${i.contactId} et tout son historique CRM. Cette action est irréversible.`
    case 'set_contact_bot_paused':
      return i.paused
        ? `Mettre en pause les réponses automatiques du bot pour le contact ${i.contactId}.`
        : `Réactiver les réponses automatiques du bot pour le contact ${i.contactId}.`
    case 'delete_flow_node':
      return `Supprimer le nœud "${i.nodeKey}" (et ses connexions) du flow ${i.flowId}. Cette action est irréversible.`
    case 'update_agent_settings': {
      const changed = Object.keys(i).filter((k) => i[k] !== undefined)
      return changed.length > 0
        ? `Modifier les réglages du compte : ${changed.join(', ')}.`
        : 'Modifier les réglages du compte.'
    }
    case 'cancel_campaign':
      return `Annuler la campagne ${i.campaignId} (planifiée ou en cours d'envoi).`
    case 'schedule_campaign':
      return i.scheduledAt
        ? `Planifier l'envoi de la campagne ${i.campaignId} pour le ${i.scheduledAt}.`
        : `Envoyer la campagne ${i.campaignId} immédiatement.`
    case 'send_message_to_contact':
      return `Envoyer au contact ${i.contactId} le message : « ${i.text} »`
    case 'set_flow_status':
      return i.status === 'active'
        ? `Activer le flow ${i.flowId} — il deviendra immédiatement opérationnel sur les messages entrants réels.`
        : `Changer le statut du flow ${i.flowId} vers "${i.status}".`
    case 'set_automation_rule_active':
      return i.isActive
        ? `Activer la règle ${i.ruleId} — elle répondra immédiatement aux messages/commentaires entrants réels.`
        : `Désactiver la règle ${i.ruleId}.`
    case 'delete_campaign':
      return `Supprimer définitivement la campagne ${i.campaignId}. Cette action est irréversible.`
    case 'delete_product':
      return `Supprimer définitivement le produit ${i.productId}. Cette action est irréversible.`
    case 'delete_segment':
      return `Supprimer définitivement le segment ${i.segmentId}. Cette action est irréversible.`
    case 'delete_snippet':
      return `Supprimer définitivement le snippet ${i.snippetId}. Cette action est irréversible.`
    case 'delete_tag':
      return `Supprimer définitivement le tag ${i.tagId} de tous les contacts qui le portent. Cette action est irréversible.`
    case 'delete_growth_link':
      return `Supprimer définitivement le lien de croissance ${i.linkId}. Un lien déjà partagé cessera de fonctionner.`
    case 'delete_automation_rule':
      return `Supprimer définitivement la règle d'automatisation ${i.ruleId}. Cette action est irréversible.`
    case 'remove_team_member':
      return `Retirer définitivement le membre ${i.memberId} de l'équipe.`
    default:
      return `Exécuter ${toolName} avec : ${JSON.stringify(i)}`
  }
}
