const EXPIRING_SOON_THRESHOLD_DAYS = 7

export interface SubscriptionNotice {
  kind: 'expiring_soon' | 'expired' | null
  daysLeft: number | null
}

/**
 * Drives the in-app renewal banner (components/billing/renewal-banner.tsx).
 * Chargily has no recurring/auto-charge billing — renewal is always a fresh
 * checkout the customer triggers manually, so this is the reminder system
 * standing in for a dunning email flow.
 */
export function getSubscriptionNotice(params: { status: string | null; expiresAt: string | null }): SubscriptionNotice {
  if (!params.expiresAt) return { kind: null, daysLeft: null }

  const expiresAt = new Date(params.expiresAt)
  if (Number.isNaN(expiresAt.getTime())) return { kind: null, daysLeft: null }

  const msLeft = expiresAt.getTime() - Date.now()
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000))

  if (params.status === 'expired' || daysLeft < 0) {
    return { kind: 'expired', daysLeft: Math.min(daysLeft, 0) }
  }
  if (params.status === 'active' && daysLeft <= EXPIRING_SOON_THRESHOLD_DAYS) {
    return { kind: 'expiring_soon', daysLeft }
  }
  return { kind: null, daysLeft }
}
