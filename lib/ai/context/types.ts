/** Client publishes only these addressing keys — the server resolves and re-verifies ownership. See docs/AI_NATIVE_DESIGN.md §1.3. */
export type AiContext =
  | { kind: 'none' }
  | { kind: 'flow'; flowId: string }
  | { kind: 'analytics' }
  | { kind: 'inbox'; contactId: string }
  | { kind: 'contacts' }
  | { kind: 'campaigns' }
  | { kind: 'dashboard' }
  | { kind: 'automation' }
  | { kind: 'boutique' }
  | { kind: 'settings' }
