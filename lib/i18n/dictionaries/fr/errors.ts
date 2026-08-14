/**
 * Translated messages for the stable error CODES returned by
 * lib/api/errors.ts and lib/api/validate.ts. Resolved via
 * translateErrorCode() (lib/api/error-messages.ts) — never index into this
 * object directly from a route handler, which must keep returning the code.
 *
 * Only codes actually emitted by lib/api/errors.ts, lib/api/validate.ts, and
 * their currently-migrated call sites are listed here — the remaining
 * `jsonError(status, 'French message')` call sites across app/api/** still
 * return inline French prose and are a separate, tracked follow-up (see the
 * i18n batch report). SERVER_ERROR doubles as the fallback for any code
 * without an entry, so it must never be removed.
 */
export const errors = {
  UNAUTHORIZED: 'Authentification requise',
  FORBIDDEN: 'Accès refusé',
  NOT_FOUND: 'Ressource introuvable',
  SERVER_ERROR: 'Une erreur est survenue',
  REQUIRED_FIELD: 'Ce champ est requis',
  FIELD_TOO_LONG: 'Ce champ dépasse la longueur maximale autorisée',
  FIELD_TOO_SHORT: 'Ce champ est trop court',

  INTENT_REQUIRED: 'Veuillez décrire votre intention',
  INTENT_LENGTH_INVALID: "L'intention doit faire entre 1 et 500 caractères",
  CHANNEL_ACCOUNT_ID_REQUIRED: 'Le compte est requis',
  RATE_LIMIT_SUGGESTIONS: 'Trop de suggestions, réessayez dans une minute',
  RULE_SUGGESTION_FAILED: 'Impossible de générer la suggestion de règle',

  ACCOUNT_ID_REQUIRED: 'Le compte est requis',
  DISCOUNT_CODE_FIELDS_REQUIRED: 'Le compte et le code sont requis',
  DISCOUNT_AMOUNT_REQUIRED: 'Un pourcentage ou un montant de réduction est requis',
  DISCOUNT_CODE_CREATE_FAILED: 'Impossible de créer le code promo (peut-être déjà utilisé)',

  INVALID_BODY: 'Corps de requête invalide',
  NODES_EDGES_MUST_BE_ARRAYS: 'Structure du flow invalide',
  TOO_MANY_NODES: 'Ce flow dépasse le nombre maximal de nœuds autorisé',
  TOO_MANY_EDGES: 'Ce flow dépasse le nombre maximal de connexions autorisé',
  TRIGGER_NODE_REQUIRED: 'Un flow doit avoir exactement un nœud de déclenchement',
  EXTERNAL_REQUEST_URL_INVALID: "L'URL fournie pour ce nœud est invalide",
  FLOW_SAVE_FAILED: "Impossible d'enregistrer le flow",

  INVALID_FROM_PARAM: 'Paramètre "from" invalide',
  INVALID_TO_PARAM: 'Paramètre "to" invalide',

  /** UI-facing strings for the React error boundary (app/(app)/error.tsx), kept separate from the API error codes above. */
  boundary: {
    title: 'Impossible de charger cette page',
    description: 'Une erreur est survenue en récupérant vos données. Réessayez dans quelques instants.',
    retry: 'Réessayer',
  },
}
