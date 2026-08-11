'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PlanKey } from '@/lib/plans'
import type { AdminUserAttributes } from '@supabase/supabase-js'
import { sealAccessToken, sealWebhookSecret } from '@/lib/channels/shared/tokens'
import { fetchPhoneNumberInfo, subscribeWabaWebhooks } from '@/lib/meta/whatsapp'
import { checkChannelLimit } from '@/lib/plans/restrictions'

// SECURITY: every exported action in this file uses the service-role client
// (bypasses RLS) and is reachable directly via a `Next-Action` POST to any
// route the caller can hit — proxy.ts's /admin role gate only protects page
// renders, not Server Action invocations. requireAdmin() is the only thing
// standing between a logged-in free-tier user and full admin control. Do not
// remove it as "redundant" with proxy.ts — it is not redundant.

/**
 * Mettre à jour l'abonnement d'un client (plan, dates, montant, notes).
 */
export async function updateSubscription(
  userId: string,
  data: {
    plan: PlanKey
    status: 'active' | 'inactive' | 'expired'
    expires_at: string | null
    amount_paid: number | null
    payment_notes: string | null
  }
) {
  await requireAdmin()
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
        plan: data.plan,
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
        plan: data.plan,
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

  // Sync is_active on channel accounts
  await supabase
    .from('channel_accounts')
    .update({ is_active: data.status === 'active' })
    .eq('user_id', userId)

  revalidatePath(`/admin/clients/${userId}`)
  revalidatePath('/admin/clients')
  revalidatePath('/admin')
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
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  const supabase = createAdminClient()

  if (data.email || data.new_password) {
    const updateData: AdminUserAttributes = {}
    if (data.email) updateData.email = data.email
    if (data.new_password) updateData.password = data.new_password
    
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, updateData)
    if (authError) throw new Error('Erreur mise à jour authentification: ' + authError.message)
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
  await requireAdmin()
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
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/clients/${userId}`)
}

export interface ConnectWhatsAppManuallyInput {
  wabaId: string
  phoneNumberId: string
  accessToken: string
  appSecret: string
}

export interface ConnectWhatsAppManuallyResult {
  displayPhoneNumber: string | null
  verifiedName: string | null
  webhookSubscribed: boolean
  webhookSubscribeError?: string
}

/**
 * Connecte manuellement un numéro WhatsApp pour un client, à partir des
 * identifiants de SA PROPRE app Meta (WABA ID, Phone Number ID, token,
 * secret d'app) — contournement pendant que notre app est en mode
 * Développement et ne peut pas ajouter chaque client comme testeur
 * (app/api/accounts/whatsapp/route.ts reste le flux self-serve normal une
 * fois notre app validée). Le webhook_app_secret stocké ici est ce qui
 * permet à lib/channels/shared/handle-webhook.ts de vérifier les webhooks
 * de CE compte avec le bon secret plutôt que le secret global partagé.
 */
export async function connectWhatsAppManually(
  userId: string,
  input: ConnectWhatsAppManuallyInput
): Promise<ConnectWhatsAppManuallyResult> {
  await requireAdmin()

  const wabaId = input.wabaId.trim()
  const phoneNumberId = input.phoneNumberId.trim()
  const accessToken = input.accessToken.trim()
  const appSecret = input.appSecret.trim()
  if (!wabaId || !phoneNumberId || !accessToken || !appSecret) {
    throw new Error('WABA ID, Phone Number ID, token et secret d\'app sont tous requis')
  }

  const supabase = createAdminClient()

  // Valide le token contre l'API réelle avant toute écriture — même garde
  // que le flux self-serve et que app/api/shopify/connect/route.ts.
  const phoneInfo = await fetchPhoneNumberInfo(phoneNumberId, accessToken)

  // Même dédoublonnage manuel que la route self-serve : page_id reste NULL
  // pour WhatsApp, donc la contrainte unique (user_id, platform, page_id)
  // ne protège pas ici.
  const { data: existingAccount } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'whatsapp')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()

  if (!existingAccount) {
    const { allowed, limit } = await checkChannelLimit(userId)
    if (!allowed) {
      throw new Error(`Limite de ${limit} canal/canaux atteinte pour le plan de ce client.`)
    }
  }

  const row = {
    user_id: userId,
    platform: 'whatsapp' as const,
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    phone_number: phoneInfo.displayPhoneNumber,
    page_name: phoneInfo.verifiedName,
    access_token: await sealAccessToken(accessToken),
    webhook_app_secret: await sealWebhookSecret(appSecret),
    token_type: 'business',
    is_active: true,
    connected_at: new Date().toISOString(),
    last_token_refresh: new Date().toISOString(),
  }

  const { error: writeError } = existingAccount
    ? await supabase.from('channel_accounts').update(row).eq('id', existingAccount.id)
    : await supabase.from('channel_accounts').insert(row)

  if (writeError) throw new Error(writeError.message)

  // Contrairement à la route self-serve (qui avale l'échec en console.warn),
  // ici un humain regarde l'écran : l'échec remonte dans le résultat plutôt
  // que d'être silencieux, puisque sans souscription réussie aucun message
  // n'arrivera jamais pour ce compte.
  const subscribeResult = await subscribeWabaWebhooks(wabaId, accessToken)

  const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('user_id', userId).maybeSingle()
  if (!existingSub) {
    await supabase.from('subscriptions').insert({ user_id: userId, status: 'inactive' })
  }

  revalidatePath(`/admin/clients/${userId}`)

  return {
    displayPhoneNumber: phoneInfo.displayPhoneNumber,
    verifiedName: phoneInfo.verifiedName,
    webhookSubscribed: subscribeResult.ok,
    webhookSubscribeError: subscribeResult.error,
  }
}

/**
 * Supprimer complètement un client
 */
export async function deleteClient(userId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)
  
  if (error) {
    throw new Error("Impossible de supprimer l'utilisateur: " + error.message)
  }
  
  redirect('/admin/clients')
}
