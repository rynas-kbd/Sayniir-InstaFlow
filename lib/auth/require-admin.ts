import { createClient } from '@/lib/supabase/server'

/**
 * Authorization check for admin-only Server Actions and route handlers.
 *
 * This exists because `proxy.ts` (the admin role gate) only protects *page
 * renders* under /admin/**. Server Actions execute on POST before any layout
 * or page renders — a `Next-Action` header can invoke an exported action
 * directly against any route the caller is otherwise allowed to hit (e.g.
 * /dashboard), bypassing proxy.ts entirely. Every admin-only Server Action
 * MUST call this as its first statement. Do not assume proxy.ts covers it.
 *
 * Mirrors the exact check in proxy.ts and app/admin/(dashboard)/layout.tsx,
 * using the caller's own cookie-scoped session (never the service-role
 * client) so RLS applies to the role lookup itself.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden — admin role required')
  }

  return user.id
}
