'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createUser(data: {
  full_name: string
  email: string
  password: string
  role: 'client' | 'admin'
}) {
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
