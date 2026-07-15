import { createAdminClient } from '../supabase/admin'
import { TokenExpiredError } from './messaging'
import { resolveAccessToken } from '../channels/shared/tokens'

const GRAPH_API_VERSION = 'v21.0'

/**
 * Minimal shape of an `automation_rules` row, covering only the fields
 * this module reads/writes. See supabase/schema.sql for the full table.
 */
interface AutomationRule {
  trigger_type: string
  trigger_keywords?: string[] | null
  target_post_ids?: string[] | null
  response_text: string
  response_text_dm?: string | null
  reply_method?: string | null
}

/**
 * Send a reply to an Instagram comment publicly.
 */
export async function sendCommentReply(
  commentId: string,
  accessToken: string,
  messageText: string
): Promise<{ id: string } | null> {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${commentId}/replies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message: messageText }),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendCommentReply] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for comment ${commentId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendCommentReply] ✅ Replied to comment ${commentId}:`, messageText)
  return { id: data.id as string }
}

/**
 * Send a private message (DM) reply to an Instagram comment.
 */
export async function sendPrivateReplyToComment(
  pageId: string,
  commentId: string,
  accessToken: string,
  messageText: string
): Promise<{ message_id: string } | null> {
  const body = {
    recipient: { comment_id: commentId },
    message: { text: messageText },
  }

  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${pageId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendPrivateReplyToComment] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for page ${pageId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendPrivateReplyToComment] ✅ DM sent for comment ${commentId}:`, messageText)
  return { message_id: data.message_id as string }
}

export async function handleCommentAutoReply({
  pageId,
  commentId,
  commenterId,
  commenterUsername,
  messageText,
  mediaId,
}: {
  pageId: string
  commentId: string
  commenterId: string
  commenterUsername: string
  messageText: string
  mediaId?: string
}): Promise<void> {
  const supabase = createAdminClient()

  // 1. Look up the account by page_id
  const { data: account, error: accountError } = await supabase
    .from('channel_accounts')
    .select('id, access_token, is_active, user_id')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .single()

  if (accountError || !account) {
    console.warn(`[handleCommentAutoReply] No active account found for pageId: ${pageId}`)
    return
  }

  account.access_token = await resolveAccessToken(account.access_token)

  // 1b. Check subscription is active and not expired
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', account.user_id)
    .single()

  const now = new Date()
  const isSubscriptionValid =
    !subscription || // admin accounts have no subscription row
    (subscription.status === 'active' &&
      (!subscription.expires_at || new Date(subscription.expires_at) > now))

  if (!isSubscriptionValid) {
    console.warn(`[handleCommentAutoReply] Subscription inactive/expired for pageId: ${pageId} — skipping reply`)
    return
  }

  // 2. Log the incoming comment
  await supabase.from('comment_logs').upsert(
    {
      channel_account_id: account.id,
      comment_id: commentId,
      commenter_id: commenterId,
      commenter_username: commenterUsername,
      comment_text: messageText,
      media_id: mediaId || null,
      auto_reply_sent: false,
    },
    { onConflict: 'comment_id' }
  )

  // 3. Fetch active automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // 4. Match a rule
  // Filter rules that apply to this specific post or all posts
  const applicableRules = rules?.filter((rule) => {
    if (!['any_comment', 'comment_keyword'].includes(rule.trigger_type)) return false
    if (rule.target_post_ids && rule.target_post_ids.length > 0 && mediaId) {
      if (!rule.target_post_ids.includes(mediaId)) return false
    }
    return true
  }) || []

  // Prioritize rules that match this specific post over global rules
  applicableRules.sort((a, b) => {
    const aHasTarget = a.target_post_ids && a.target_post_ids.length > 0
    const bHasTarget = b.target_post_ids && b.target_post_ids.length > 0
    if (aHasTarget && !bHasTarget) return -1
    if (!aHasTarget && bHasTarget) return 1
    return 0
  })

  let matchedRule: AutomationRule | null = null

  if (applicableRules.length > 0) {
    const lowerText = messageText.toLowerCase()
    
    // Try keyword match first among applicable rules
    matchedRule = applicableRules.find(
      (rule) =>
        rule.trigger_type === 'comment_keyword' &&
        rule.trigger_keywords?.some((kw: string) =>
          lowerText.includes(kw.toLowerCase())
        )
    )

    // Fallback to "any_comment" rule among applicable rules
    if (!matchedRule) {
      matchedRule = applicableRules.find(
        (rule) => rule.trigger_type === 'any_comment'
      )
    }
  }

  if (!matchedRule) {
    console.log(`[handleCommentAutoReply] No matching rule for comment ${commentId}`)
    return
  }

  const replyText = matchedRule.response_text
  const replyMethod = matchedRule.reply_method || 'comment'

  // 5. Send the reply
  try {
    let result = null
    if (replyMethod === 'both') {
      result = await sendCommentReply(commentId, account.access_token, replyText)
      const dmText = matchedRule.response_text_dm || replyText
      await sendPrivateReplyToComment(pageId, commentId, account.access_token, dmText)
    } else if (replyMethod === 'dm') {
      result = await sendPrivateReplyToComment(pageId, commentId, account.access_token, replyText)
    } else {
      result = await sendCommentReply(commentId, account.access_token, replyText)
    }

    if (result) {
      // 6. Update the log entry with reply info
      await supabase
        .from('comment_logs')
        .update({
          auto_reply_sent: true,
          reply_text: replyText,
          replied_at: new Date().toISOString(),
        })
        .eq('comment_id', commentId)

      console.log(
        `[handleCommentAutoReply] Replied to ${commenterUsername} on page ${pageId}: "${replyText}"`
      )
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      // Mark account as needing token refresh
      await supabase
        .from('channel_accounts')
        .update({ is_active: false })
        .eq('id', account.id)
      console.error('[handleCommentAutoReply] Token expired — account deactivated:', pageId)
    } else {
      console.error('[handleCommentAutoReply] Failed to send reply:', err)
    }
  }
}
