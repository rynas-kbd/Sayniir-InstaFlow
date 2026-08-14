/**
 * Strings for the subscription renewal banner (components/billing/renewal-banner.tsx).
 * Chargily has no recurring/auto-charge billing, so renewal is always the
 * customer manually relaunching a checkout — this banner stands in for a
 * dunning email flow, shown from J-7 through expiry.
 */
export const billingBanner = {
  expired: 'Votre abonnement a expiré.',
  expiresToday: "Votre abonnement expire aujourd'hui.",
  expiresInDays: {
    one: 'Votre abonnement expire dans {count} jour.',
    other: 'Votre abonnement expire dans {count} jours.',
  },
  genericError: 'Erreur',
  openCheckoutError: "Impossible d'ouvrir le paiement",
  renewButton: 'Renouveler',
}
