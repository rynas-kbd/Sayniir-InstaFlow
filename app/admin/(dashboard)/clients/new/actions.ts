'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// SECURITY: uses the service-role client (bypasses RLS) and is reachable
// directly via a `Next-Action` POST — proxy.ts's /admin role gate only
// protects page renders, not Server Action invocations. requireAdmin() is
// the only thing standing between a logged-in free-tier user and creating
// arbitrary accounts (including admin ones). Do not remove it as
// "redundant" with proxy.ts — it is not redundant.
export async function createUser(data: {
  full_name: string
  email: string
  password: string
  role: 'client' | 'admin'
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  })

  if (error || !user) {
    // TODO(i18n): server action error string, needs code-based translation
    // ('use server' files can't call useT()/getT() bound to the caller's
    // locale in a way that's safe to thread through a throw). Leaving the
    // literal French message as-is to avoid changing error-handling behavior.
    throw new Error(error?.message ?? 'Erreur lors de la création du compte.')
  }

  // Upsert profile — a DB trigger may already insert one, so we upsert to be safe.
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    // Don't block: user was created in Auth, just log the profile issue
    console.error('Profile upsert error:', profileError.message)
  }

  revalidatePath('/admin/clients')
  redirect(`/admin/clients/${user.id}`)
}
