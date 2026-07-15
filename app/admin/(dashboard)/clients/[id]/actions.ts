'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { AdminUserAttributes } from '@supabase/supabase-js'

/**
 * Mettre à jour l'abonnement d'un client (dates, montant, notes).
 */
export async function updateSubscription(
  userId: string,
  data: {
    status: 'active' | 'inactive' | 'expired'
    expires_at: string | null
    amount_paid: number | null
    payment_notes: string | null
  }
) {
  const supabase = createAdminClient()

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  let error
  if (existingSub) {
    const res = await supabase
      .from('subscriptions')
      .update({
        status: data.status,
        expires_at: data.expires_at,
        amount_paid: data.amount_paid,
        payment_notes: data.payment_notes,
        started_at: data.status === 'active' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    error = res.error
  } else {
    const res = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: data.status,
        expires_at: data.expires_at,
        amount_paid: data.amount_paid,
        payment_notes: data.payment_notes,
        started_at: data.status === 'active' ? new Date().toISOString() : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    error = res.error
  }

  if (error) throw new Error(error.message)

  // Sync is_active on the instagram_account
  await supabase
    .from('channel_accounts')
    .update({ is_active: data.status === 'active' })
    .eq('user_id', userId)

  revalidatePath(`/admin/clients/${userId}`)
  revalidatePath('/admin/clients')
}

/**
 * Ajouter un mot-clé / règle d'automatisation pour le compte d'un client.
 */
export async function addKeyword(
  accountId: string,
  userId: string,
  keyword: string,
  replyText: string
) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('automation_rules').insert({
    channel_account_id: accountId,
    name: `Mot-clé: ${keyword.trim().toLowerCase()}`,
    trigger_type: 'keyword',
    trigger_keywords: [keyword.trim().toLowerCase()],
    response_text: replyText.trim(),
    is_active: true,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${userId}`)
}

/**
 * Supprimer une règle d'automatisation.
 */
export async function deleteKeyword(ruleId: string, userId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', ruleId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${userId}`)
}

/**
 * Basculer l'état actif/inactif d'une règle.
 */
export async function toggleKeyword(ruleId: string, isActive: boolean, userId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('automation_rules')
    .update({ is_active: isActive })
    .eq('id', ruleId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${userId}`)
}

/**
 * Mettre à jour le profil (Nom, Email, Mot de passe)
 */
export async function updateProfile(userId: string, data: { full_name: string; email: string; new_password?: string }) {
  const supabase = createAdminClient()
  
  if (data.email || data.new_password) {
    const updateData: AdminUserAttributes = {}
    if (data.email) updateData.email = data.email
    if (data.new_password) updateData.password = data.new_password
    
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, updateData)
    if (authError) throw new Error("Erreur mise à jour authentification: " + authError.message)
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: data.full_name,
      ...(data.email ? { email: data.email } : {})
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/admin/clients/${userId}`)
  revalidatePath('/admin/clients')
}

/**
 * Changer le rôle d'un utilisateur (client ↔ admin).
 */
export async function changeRole(userId: string, role: 'client' | 'admin') {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/clients/${userId}`)
  revalidatePath('/admin/clients')
}

/**
 * Sauvegarder les notes privées de l'admin sur un profil.
 */
export async function saveAdminNotes(userId: string, notes: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/clients/${userId}`)
}

/**
 * Supprimer complètement un client
 */
export async function deleteClient(userId: string) {
  const supabase = createAdminClient()
  
  // Deleting user from Auth usually cascades, but we can be explicit if needed.
  // Using auth.admin.deleteUser is the correct way to completely remove a user.
  const { error } = await supabase.auth.admin.deleteUser(userId)
  
  if (error) {
    throw new Error("Impossible de supprimer l'utilisateur: " + error.message)
  }
  
  redirect('/admin/clients')
}
