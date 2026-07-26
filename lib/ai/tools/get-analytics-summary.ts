import { getAnalyticsSummary, type AnalyticsSummary } from '../../analytics/queries'
import type { AiTool } from './types'

const WINDOW_DAYS = 14

export const getAnalyticsSummaryTool: AiTool<Record<string, never>, AnalyticsSummary> = {
  name: 'get_analytics_summary',
  description: `Résumé analytics des ${WINDOW_DAYS} derniers jours : messages reçus, réponses auto, taux de réponse, nouveaux contacts.`,
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const to = new Date()
    const from = new Date(to.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
    return await getAnalyticsSummary(ctx.userId, from, to)
  },
}
