import { createDispatchAdminClient } from '../../supabase/dispatch-admin.ts'
import { resolveDispatchContext, isSubscriptionValid, type DispatchContext } from './context.ts'
import { handleEcommerceMessage, handleQaMessage } from '../../agent/ecommerce/handler.ts'
import { resolveProduct } from '../../agent/ecommerce/parse.ts'
import { detectShopIntent } from '../../agent/ecommerce/intent-router.ts'
import { handleAvailabilityMessage } from '../../agent/ecommerce/availability.ts'
import { handleAgentMessage, type BusinessType } from '../../agent/router.ts'
import { sendAndReport } from '../../agent/messaging.ts'
import { loadHistory, renderHistoryBlock } from '../../agent/history.ts'
import { transcribeInbound } from '../../agent/voice.ts'
import { logTurn } from '../../agent/telemetry.ts'
import type { AgentOutcome } from '../../agent/types.ts'
import { TokenExpiredError } from '../../meta/messaging.ts'
import { findChannelAccountByExternalId } from './lookup.ts'
import { upsertContact, getContact } from '../../contacts/service.ts'
import { renderTemplate } from '../../personalization.ts'
import {
  runFlowsForInbound,
  runFlowsForInboundComment,
  continueRunFromPostback,
  tryContinueRunFromTextCapture,
  startRunFromGrowthLink,
} from '../../flows/engine.ts'
import type { NormalizedInboundMessage, NormalizedInboundComment } from '../types.ts'

async function deactivateAccount(supabase: ReturnType<typeof createDispatchAdminClient>, accountId: string): Promise<void> {
  await supabase.from('channel_accounts').update({ is_active: false }).eq('id', accountId)
}

/**
 * Persists what actually happened this turn — reply_text now holds the real
 * text sent to the customer (or nothing) and handled_by the routing label,
 * instead of a fixed '[Géré par …]' placeholder written regardless of
 * whether a reply went out (audit findings F3/F4). Deactivates the account
 * on a detected expired token, centralizing what used to be duplicated
 * per-handler cleanup. Also emits structured per-turn telemetry (route,
 * provider/model, latency, outcome) — previously the only observability was
 * scattered, sometimes content-leaking console.log calls (audit finding F16).
 */
async function logOutcome(ctx: DispatchContext, msg: NormalizedInboundMessage, outcome: AgentOutcome, startedAt: number): Promise<void> {
  if (outcome.status === 'replied') {
    await ctx.supabase
      .from('message_logs')
      .update({ auto_reply_sent: true, reply_text: outcome.replyText, handled_by: outcome.route, replied_at: new Date().toISOString() })
      .eq('message_id', msg.messageId)
  } else if (outcome.status === 'error') {
    console.error(`[dispatchInboundMessage] ${outcome.route} failed:`, outcome.error)
    if (outcome.error instanceof TokenExpiredError) {
      await deactivateAccount(ctx.supabase, ctx.account.id)
    }
  }

  logTurn({
    accountId: ctx.account.id,
    senderId: msg.senderId,
    route: outcome.route,
    provider: (ctx.settings?.ai_provider as string) || null,
    model: (ctx.settings?.ai_model as string) || null,
    latencyMs: Date.now() - startedAt,
    outcome: outcome.status,
  })
}

/**
 * Bot-paused check — deliberately resolved independently of
 * resolveDispatchContext(): a lapsed subscription must not suppress this
 * log (the human handling the conversation manually still wants to see the
 * message in the inbox), whereas resolveDispatchContext short-circuits on
 * exactly that condition.
 */
async function logIfBotPaused(msg: NormalizedInboundMessage): Promise<boolean> {
  const account = await findChannelAccountByExternalId(msg.platform, msg.channelExternalId)
  if (!account) return false

  const supabase = createDispatchAdminClient()
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, bot_paused')
    .eq('channel_account_id', account.id)
    .eq('sender_id', msg.senderId)
    .maybeSingle()

  if (!contact?.bot_paused) return false

  if (msg.text || msg.audioUrl) {
    await supabase.from('message_logs').upsert(
      {
        channel_account_id: account.id,
        contact_id: contact.id,
        sender_id: msg.senderId,
        message_id: msg.messageId,
        message_text: msg.text ?? '[audio]',
        direction: 'incoming',
        auto_reply_sent: false,
      },
      { onConflict: 'message_id' }
    )
  }
  return true
}

function flowAgentArgs(ctx: DispatchContext) {
  return {
    aiProvider: (ctx.settings?.ai_provider as string | null) || null,
    aiApiKey: ctx.aiApiKey,
    aiModel: (ctx.settings?.ai_model as string | null) || null,
  }
}

function dispatchAccountRef(ctx: DispatchContext): { id: string; user_id: string; access_token: string } {
  return { id: ctx.account.id, user_id: ctx.account.user_id, access_token: ctx.account.access_token }
}

/** Growth link (ref deep link) opened — starts the linked flow directly, the link itself is the trigger. Returns whether a link matched. */
async function handleGrowthLink(ctx: DispatchContext, msg: NormalizedInboundMessage): Promise<boolean> {
  const { data: link } = await ctx.supabase
    .from('growth_links')
    .select('id, flow_id, clicks')
    .eq('channel_account_id', ctx.account.id)
    .eq('code', msg.referralRef)
    .maybeSingle()

  if (!link) return false

  await ctx.supabase.from('growth_links').update({ clicks: link.clicks + 1 }).eq('id', link.id)
  if (ctx.contactId) {
    // First-touch attribution only — never overwrites an existing source,
    // so a contact who already came from somewhere else attributed doesn't
    // get relabeled just because they later click a growth link too (see
    // audit: neither orders nor order_sessions reference a flow_id/
    // campaign_id, so this is the one clean attribution signal available).
    await ctx.supabase
      .from('contacts')
      .update({ acquisition_source: 'growth_link', acquisition_source_id: link.id })
      .eq('id', ctx.contactId)
      .is('acquisition_source', null)
  }
  await startRunFromGrowthLink(link.flow_id, msg.platform, dispatchAccountRef(ctx), ctx.contactId, msg.senderId, flowAgentArgs(ctx))
  return true
}

/** Button click (postback) — resumes the paused flow run directly, never re-evaluates triggers from scratch. */
async function handlePostback(ctx: DispatchContext, msg: NormalizedInboundMessage): Promise<void> {
  await continueRunFromPostback(msg.postbackPayload!, msg.platform, dispatchAccountRef(ctx), msg.senderId, flowAgentArgs(ctx))
}

/** Text reply to a paused "capture_input" node — stores it and resumes that run before any trigger/Q&A/rules handling ever sees it. */
async function handleTextCapture(ctx: DispatchContext, msg: NormalizedInboundMessage): Promise<boolean> {
  return tryContinueRunFromTextCapture(msg.text!, msg.platform, dispatchAccountRef(ctx), msg.senderId, flowAgentArgs(ctx))
}

/** Fetches the sender's profile (name/username/pic) and upserts it onto the already-created contact — done once per real (voice or text) turn. */
async function enrichContactProfile(ctx: DispatchContext, msg: NormalizedInboundMessage) {
  const senderProfile = await ctx.adapter.fetchSenderProfile?.(msg.senderId, ctx.account.access_token)
  const contactId = await upsertContact(ctx.account.id, msg.senderId, senderProfile)
  return { senderProfile, contactId }
}

/** Writes a placeholder incoming voice row (limit reached / transcription failed — no transcript to show yet). */
async function logVoicePlaceholder(
  ctx: DispatchContext,
  msg: NormalizedInboundMessage,
  contactId: string | null,
  senderProfile: { username?: string; name?: string; profilePic?: string } | null | undefined
): Promise<void> {
  await ctx.supabase.from('message_logs').upsert(
    {
      channel_account_id: ctx.account.id,
      contact_id: contactId,
      sender_id: msg.senderId,
      sender_username: senderProfile?.username || null,
      sender_full_name: senderProfile?.name || null,
      sender_profile_pic: senderProfile?.profilePic || null,
      message_id: msg.messageId,
      message_text: '[🎙️ Vocal]',
      direction: 'incoming',
      auto_reply_sent: false,
    },
    { onConflict: 'message_id' }
  )
}

/**
 * Transcribes the voice note and hands the transcript to handleTextTurn —
 * voice now traverses the exact same pipeline as text (flows → Q&A →
 * tunnel → coaching/agency → classic rules) for every vertical, instead of
 * only ever reaching the order-taking tunnel (and a generic keyword-rules
 * matcher for everyone else, never the Q&A agent — audit finding F8).
 */
async function handleVoiceTurn(ctx: DispatchContext, msg: NormalizedInboundMessage, businessType: BusinessType): Promise<void> {
  const startedAt = Date.now()
  const { checkAutoReplyLimit } = await import('../../plans/restrictions')
  if (!(await checkAutoReplyLimit(ctx.account.id))) {
    console.warn(`[dispatchInboundMessage] Auto reply limit reached for account: ${ctx.account.id} — skipping voice reply.`)
    const { senderProfile, contactId } = await enrichContactProfile(ctx, msg)
    await logVoicePlaceholder(ctx, msg, contactId, senderProfile)
    return
  }

  const { downloadAudio } = await import('../../meta/voice')
  let audioBuffer: Buffer
  try {
    audioBuffer = await downloadAudio(msg.audioUrl!, ctx.account.access_token)
  } catch (err) {
    console.error(`[dispatchInboundMessage] Failed to download audio for message ${msg.messageId}:`, err)
    return
  }
  const VOICE_MIME = 'audio/mp4'
  const transcription = await transcribeInbound(audioBuffer, VOICE_MIME, (ctx.settings?.ai_provider as string) || null, ctx.aiApiKey)

  if (!transcription.trim()) {
    const { senderProfile, contactId } = await enrichContactProfile(ctx, msg)
    await logVoicePlaceholder(ctx, msg, contactId, senderProfile)
    const outcome = await sendAndReport(
      ctx.channel,
      "Désolé, je n'ai pas bien compris votre message vocal 😅 Pouvez-vous réécrire en texte ?",
      'voice.transcription_failed'
    )
    await logOutcome(ctx, msg, outcome, startedAt)
    return
  }

  console.log(`[Voice] Transcription: "${transcription}"`)
  await handleTextTurn(ctx, msg, businessType, { messageText: transcription, logText: `[🎙️ Vocal] : ${transcription}`, startedAt })
}

/** Classic keyword/any_message rules + configurable default message — the terminal fallback for any turn no smarter handler answered. */
async function handleClassicRulesFallback(
  ctx: DispatchContext,
  msg: NormalizedInboundMessage,
  messageText: string,
  contactId: string | null,
  startedAt: number
): Promise<void> {
  // A rule matches this account either as its owner (channel_account_id) or
  // as one of its additional targets (rule_target_accounts — see migration
  // 20260903000000 and PUT-equivalent handling in app/api/rules/**). Two
  // queries rather than one embedded-join filter, same reasoning as
  // lib/flows/engine.ts::queryFlowsForAccount.
  const { data: targetRows } = await ctx.supabase.from('rule_target_accounts').select('rule_id').eq('channel_account_id', ctx.account.id)
  const targetRuleIds = (targetRows ?? []).map((r) => r.rule_id)

  let rulesQuery = ctx.supabase.from('automation_rules').select('*').eq('is_active', true)
  rulesQuery =
    targetRuleIds.length > 0
      ? rulesQuery.or(`channel_account_id.eq.${ctx.account.id},id.in.(${targetRuleIds.join(',')})`)
      : rulesQuery.eq('channel_account_id', ctx.account.id)
  const { data: rules } = await rulesQuery.order('created_at', { ascending: true })

  let replyText: string | null = null
  let matchedRule: (typeof rules extends (infer T)[] | null ? T : never) | null = null
  if (rules && rules.length > 0) {
    const lowerText = messageText.toLowerCase()
    if (msg.storyEventType) {
      matchedRule = rules.find((rule) => rule.trigger_type === `story_${msg.storyEventType}`) ?? null
    } else {
      const keywordRule = rules.find(
        (rule) => rule.trigger_type === 'keyword' && rule.trigger_keywords?.some((kw: string) => lowerText.includes(kw.toLowerCase()))
      )
      const anyMessageRule = rules.find((rule) => rule.trigger_type === 'any_message')
      matchedRule = keywordRule ?? anyMessageRule ?? null
    }
    replyText = matchedRule?.response_text ?? null
  }

  const route = matchedRule ? 'rules.matched' : 'rules.default_message'

  if (!replyText) {
    const settings = ctx.settings
    const defaultEnabled = settings?.default_message_enabled ?? true
    const defaultText = (settings?.default_message_text as string) ?? 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏'
    const defaultFreq = settings?.default_message_frequency ?? 'always'

    if (defaultEnabled) {
      let shouldSend = true
      if (defaultFreq === 'first_message_only') {
        const { count } = await ctx.supabase
          .from('message_logs')
          .select('*', { count: 'exact', head: true })
          .eq('channel_account_id', ctx.account.id)
          .eq('sender_id', msg.senderId)
          .eq('direction', 'incoming')
        if (count && count > 1) shouldSend = false
      }
      if (shouldSend) replyText = defaultText
    }
  }

  if (!replyText) return

  const contact = contactId ? await getContact(ctx.account.id, contactId) : null
  replyText = renderTemplate(replyText, contact)

  const cardButtons = ((matchedRule?.card_buttons as Array<{ type?: 'postback' | 'web_url'; title: string; url?: string }>) ?? []).map((b) => ({
    ...b,
    title: renderTemplate(b.title, contact),
  }))
  const cardTitle = renderTemplate(matchedRule?.card_title || replyText, contact)
  const cardSubtitle = matchedRule?.card_subtitle ? renderTemplate(matchedRule.card_subtitle, contact) : undefined
  const isCard = matchedRule?.response_type === 'card'
  const hasImage = !!matchedRule?.card_image_url

  try {
    let result: { messageId: string } | null
    if (isCard && !hasImage && cardButtons.length > 0 && ctx.adapter.sendButtons) {
      result = await ctx.adapter.sendButtons(
        ctx.ref,
        msg.senderId,
        cardTitle,
        cardButtons.map((b) => ({ type: b.type ?? 'web_url', title: b.title, url: b.url }))
      )
    } else if (isCard && ctx.adapter.sendCard) {
      result = await ctx.adapter.sendCard(
        ctx.ref,
        msg.senderId,
        cardTitle,
        cardSubtitle,
        matchedRule?.card_image_url ?? undefined,
        cardButtons.map((b) => ({ title: b.title, url: b.url ?? '' }))
      )
    } else {
      result = await ctx.channel.sendText(replyText)
    }
    if (result) {
      await logOutcome(ctx, msg, { status: 'replied', replyText, route }, startedAt)
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await deactivateAccount(ctx.supabase, ctx.account.id)
    } else {
      console.error('[dispatchInboundMessage] Failed to send reply:', err)
    }
  }
}

/**
 * Handles one full text turn: flows → active-tunnel/Q&A → coaching/agency →
 * classic rules. Also the delegate target for voice (see handleVoiceTurn):
 * `opts.messageText` is what the LLM/routing logic actually sees (the
 * transcript), while `opts.logText` is what message_logs shows for this
 * inbound row (the `[🎙️ Vocal] : …` marker) — they differ only for voice.
 */
async function handleTextTurn(
  ctx: DispatchContext,
  msg: NormalizedInboundMessage,
  businessType: BusinessType,
  opts?: { messageText: string; logText: string; startedAt?: number }
): Promise<void> {
  const startedAt = opts?.startedAt ?? Date.now()
  const { senderProfile, contactId } = await enrichContactProfile(ctx, msg)
  const messageText = opts?.messageText ?? msg.text ?? ''
  // A shared post with no caption text (see the guard below, widened to let
  // this turn through at all) still needs something readable in the inbox.
  const logText = opts?.logText ?? (messageText || (msg.sharedPost ? '[Post partagé]' : ''))
  const settings = ctx.settings
  // Loaded before this turn's own message_logs row exists below, so the
  // current (not-yet-answered) message never shows up duplicated inside its
  // own history block (audit finding F5).
  const historyBlock = renderHistoryBlock(await loadHistory(ctx.supabase, ctx.account.id, msg.senderId))

  await ctx.supabase.from('message_logs').upsert(
    {
      channel_account_id: ctx.account.id,
      contact_id: contactId,
      sender_id: msg.senderId,
      sender_username: senderProfile?.username || null,
      sender_full_name: senderProfile?.name || null,
      sender_profile_pic: senderProfile?.profilePic || null,
      message_id: msg.messageId,
      message_text: logText,
      direction: 'incoming',
      auto_reply_sent: false,
    },
    { onConflict: 'message_id' }
  )

  const { checkAutoReplyLimit } = await import('../../plans/restrictions')
  const autoReplyAllowed = await checkAutoReplyLimit(ctx.account.id)
  if (!autoReplyAllowed) {
    console.warn(`[dispatchInboundMessage] Auto reply limit reached for account: ${ctx.account.id} — skipping text reply.`)
    return
  }

  const isQaActive = businessType === 'ecommerce' && (settings?.is_qa_active ?? false)
  const isOrderTakingActive = businessType === 'ecommerce' && (settings?.is_order_taking_active ?? false)
  const isAvailabilityActive = businessType === 'ecommerce' && (settings?.is_availability_check_active ?? false)
  const verticalConfig = (settings?.vertical_config as Record<string, unknown>) ?? {}
  const agentArgs = {
    customInstructions: (settings?.instructions as string[]) || [],
    infosToCollect: (settings?.infos_to_collect as string[]) || [],
    faqs: (verticalConfig as { faqs?: Array<{ question: string; answer: string }> })?.faqs || [],
    persona: (verticalConfig as { persona?: string })?.persona || undefined,
    history: historyBlock,
    aiProvider: (settings?.ai_provider as string) || null,
    aiApiKey: ctx.aiApiKey,
    aiModel: (settings?.ai_model as string) || null,
  }

  // ── Scenario 0: visual flows (opt-in via agent_settings.flows_enabled) ──
  // Checked first, ahead of the Q&A/order-taking agent and the classic
  // rules fallback below: a matching flow trigger is an explicit, specific
  // configuration and must take priority over the generic agent — otherwise
  // an account with Q&A/order-taking enabled would never reach this block
  // and flows would silently never fire. Flows are a deterministic node
  // graph (not an LLM prompt), so they're kept as a hard return rather than
  // going through the AgentOutcome fallback path below.
  if (settings?.flows_enabled) {
    const handled = await runFlowsForInbound({
      platform: msg.platform,
      account: dispatchAccountRef(ctx),
      contactId,
      senderId: msg.senderId,
      messageText,
      storyEventType: msg.storyEventType,
      agentArgs: { aiProvider: agentArgs.aiProvider, aiApiKey: agentArgs.aiApiKey, aiModel: agentArgs.aiModel },
    })
    if (handled) {
      await logOutcome(ctx, msg, { status: 'replied', replyText: '[Géré par Flow]', route: 'flow' }, startedAt)
      return
    }
  }

  const { data: activeSession } = await ctx.supabase
    .from('order_sessions')
    .select('id')
    .eq('channel_account_id', ctx.account.id)
    .eq('sender_id', msg.senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  let outcome: AgentOutcome | null = null

  // ── Scenario A: active order session → continue the tunnel ─────────────
  // Greetings and cancel/restart/change-product/human-handoff intents
  // arriving mid-flow are now recognized and handled inside
  // handleEcommerceMessage itself (see lib/agent/ecommerce/intent.ts),
  // instead of being intercepted here and unconditionally cancelling the
  // whole session on any greeting — that used to be the tunnel's only
  // "exit" and threw away everything the customer had already given
  // (audit finding F6).
  if (activeSession && isOrderTakingActive) {
    outcome = await handleEcommerceMessage({
      accountId: ctx.account.id,
      senderId: msg.senderId,
      messageText,
      channel: ctx.channel,
      isAvailabilityActive,
      ...agentArgs,
    })
  }
  // ── Scenario B: no active session — availability, then Q&A and/or order-taking depending on flags ──
  else if (isQaActive || isOrderTakingActive || isAvailabilityActive) {
    // Availability is checked first (requirement §6: "la vérification de
    // disponibilité doit être effectuée en premier"): a "dispo ?" must
    // never fall into the Q&A LLM, whose catalog is stock-filtered below
    // anyway and would just stay silent about an out-of-stock item instead
    // of saying so. detectShopIntent is a plain regex router (no LLM), so
    // this costs nothing on turns that aren't about availability — it
    // leaves `outcome` untouched and the existing Q&A/tunnel logic runs
    // exactly as before.
    if (isAvailabilityActive) {
      const routed = detectShopIntent(messageText, { hasSharedPost: !!msg.sharedPost })
      if (routed.primary === 'availability') {
        const { outcome: availabilityOutcome, availableProductId } = await handleAvailabilityMessage({
          accountId: ctx.account.id,
          senderId: msg.senderId,
          channel: ctx.channel,
          messageText,
          sharedPost: msg.sharedPost,
        })
        outcome = availabilityOutcome

        // Chain into the order-taking tunnel ONLY when the same message
        // also carried an explicit purchase commitment ("... si oui je le
        // prends") AND the product was actually confirmed available —
        // requirement §6. prefillProductId is the same hand-off point the
        // Q&A→tunnel path below already uses (audit finding F9): the
        // tunnel skips its own LLM extraction call for this turn.
        if (routed.chainPurchase && availableProductId && isOrderTakingActive && outcome.status !== 'error') {
          outcome = await handleEcommerceMessage({
            accountId: ctx.account.id,
            senderId: msg.senderId,
            messageText,
            channel: ctx.channel,
            prefillProductId: availableProductId,
            isAvailabilityActive,
            ...agentArgs,
          })
        }
      }
    }

    if (!outcome && isQaActive) {
      // Out-of-stock products (when the shop tracks stock at all — see
      // migration 20260826) are excluded from what the customer is shown,
      // not just from what they're allowed to confirm (audit finding F10):
      // no point offering something an atomic re-check will reject anyway.
      const { data: products } = await ctx.supabase
        .from('products')
        .select('*')
        .eq('channel_account_id', ctx.account.id)
        .eq('is_active', true)
        .or('track_stock.eq.false,stock_quantity.gt.0')
      const { hasPurchaseIntent, productNameHint, outcome: qaOutcome } = await handleQaMessage({
        accountId: ctx.account.id,
        senderId: msg.senderId,
        channel: ctx.channel,
        messageText,
        products: products ?? [],
        isOrderTakingActive,
        skipReplyOnPurchaseIntent: isOrderTakingActive,
        ...agentArgs,
      })
      outcome = qaOutcome

      if (hasPurchaseIntent && isOrderTakingActive) {
        // Resolved deterministically from the Q&A call's own product-name
        // guess — when it hits, the tunnel below skips its own LLM
        // extraction call entirely for this turn (audit finding F9).
        const prefillProductId = productNameHint ? resolveProduct(productNameHint, products ?? [])?.id ?? null : null
        outcome = await handleEcommerceMessage({
          accountId: ctx.account.id,
          senderId: msg.senderId,
          messageText,
          channel: ctx.channel,
          prefillProductId,
          isAvailabilityActive,
          ...agentArgs,
        })
      }
    } else if (!outcome && isOrderTakingActive) {
      outcome = await handleEcommerceMessage({
        accountId: ctx.account.id,
        senderId: msg.senderId,
        messageText,
        channel: ctx.channel,
        isAvailabilityActive,
        ...agentArgs,
      })
    }
  }
  // ── Scenario C: coaching/agency verticals (simpler — one LLM call per turn) ──
  else if (businessType !== 'ecommerce' && businessType !== 'generic' && settings?.is_active) {
    outcome = await handleAgentMessage(businessType, {
      accountId: ctx.account.id,
      senderId: msg.senderId,
      messageText,
      channel: ctx.channel,
      customInstructions: agentArgs.customInstructions,
      infosToCollect: agentArgs.infosToCollect,
      history: agentArgs.history,
      aiProvider: agentArgs.aiProvider,
      aiApiKey: agentArgs.aiApiKey,
      aiModel: agentArgs.aiModel,
    })
  }

  if (outcome) {
    await logOutcome(ctx, msg, outcome, startedAt)
    // 'replied' → the customer got the smart-agent answer, done.
    // 'no_reply' → a deliberate silence (e.g. purchase intent silently
    // handed off to the tunnel above), also done.
    // 'error' → the customer got NOTHING from the smart agent (LLM down,
    // send failed, ...). Falling through to classic rules / the default
    // message means they still get something instead of dead air — this is
    // the actual fix for audit finding F3.
    if (outcome.status !== 'error') return
  }

  await handleClassicRulesFallback(ctx, msg, messageText, contactId, startedAt)
}

/**
 * Mirrors the live supabase/functions/_shared/meta/messaging.ts::handleAutoReply
 * (Deno) — Q&A mode, order-taking tunnel with greeting-reset, configurable
 * default message — generalized behind a ChannelAdapter. Skips echo events
 * (sent BY the connected account) the same way the Deno webhook does today.
 */
export async function dispatchInboundMessage(msg: NormalizedInboundMessage): Promise<void> {
  if (msg.senderId === msg.recipientId || msg.senderId === msg.channelExternalId) return

  // Bot paused for this contact (human is handling it manually in the
  // inbox) — log the message so it shows in the thread, but skip every
  // form of automation below.
  if (await logIfBotPaused(msg)) return

  const ctx = await resolveDispatchContext(msg)
  if (!ctx) return

  // Growth link (ref deep link) opened — start the linked flow directly;
  // if the event carries no text alongside it, that's the whole turn.
  if (msg.referralRef) {
    const handled = await handleGrowthLink(ctx, msg)
    if (handled && !msg.text) return
  }

  // Button click (postback) — resume the paused flow run directly.
  if (msg.postbackPayload) {
    await handlePostback(ctx, msg)
    return
  }

  // Text reply to a paused "capture_input" node — resume that run before
  // any trigger/Q&A/rules handling ever sees it.
  if (msg.text) {
    const consumed = await handleTextCapture(ctx, msg)
    if (consumed) return
  }

  // A shared post with no caption text is still a real turn (see requirement
  // §2: "dispo ?" is often just the post itself, no words at all) —
  // previously dropped here outright since neither text nor audio was set.
  if (!msg.text && !msg.audioUrl && !msg.sharedPost) return

  const businessType: BusinessType = ctx.businessType

  if (msg.audioUrl) {
    await handleVoiceTurn(ctx, msg, businessType)
    return
  }

  await handleTextTurn(ctx, msg, businessType)
}

/** Mirrors lib/meta/comments.ts::handleCommentAutoReply, generalized behind a ChannelAdapter. */
export async function dispatchInboundComment(comment: NormalizedInboundComment): Promise<void> {
  if (comment.commenterId === comment.channelExternalId) return

  const account = await findChannelAccountByExternalId(comment.platform, comment.channelExternalId)
  if (!account) return

  const supabase = createDispatchAdminClient()

  if (!(await isSubscriptionValid(supabase, account.user_id))) return

  const contactId = await upsertContact(account.id, comment.commenterId, { username: comment.commenterUsername })

  await supabase.from('comment_logs').upsert(
    {
      channel_account_id: account.id,
      comment_id: comment.commentId,
      commenter_id: comment.commenterId,
      commenter_username: comment.commenterUsername,
      comment_text: comment.text,
      media_id: comment.mediaId || null,
      auto_reply_sent: false,
    },
    { onConflict: 'comment_id' }
  )

  const { checkAutoReplyLimit } = await import('../../plans/restrictions')
  const autoReplyAllowed = await checkAutoReplyLimit(account.id)
  if (!autoReplyAllowed) {
    console.warn(`[dispatchInboundComment] Auto reply limit reached for account: ${account.id} — skipping comment reply.`)
    return
  }

  const { data: agentSettings } = await supabase
    .from('agent_settings')
    .select('flows_enabled, ai_provider, ai_api_key, ai_model')
    .eq('channel_account_id', account.id)
    .maybeSingle()

  if (agentSettings?.flows_enabled) {
    const { isEncrypted, decryptApiKey } = await import('../../crypto')
    let apiKey: string | null = agentSettings.ai_api_key || null
    if (apiKey && isEncrypted(apiKey)) {
      try {
        apiKey = await decryptApiKey(apiKey)
      } catch {
        apiKey = null
      }
    }
    const handled = await runFlowsForInboundComment({
      platform: comment.platform,
      account: { id: account.id, user_id: account.user_id, access_token: account.access_token },
      contactId,
      senderId: comment.commenterId,
      commentText: comment.text,
      mediaId: comment.mediaId,
      agentArgs: { aiProvider: agentSettings.ai_provider || null, aiApiKey: apiKey, aiModel: agentSettings.ai_model || null },
    })
    if (handled) {
      await supabase
        .from('comment_logs')
        .update({ auto_reply_sent: true, reply_text: '[Géré par Flow]', replied_at: new Date().toISOString() })
        .eq('comment_id', comment.commentId)
      return
    }
  }

  const { data: commentTargetRows } = await supabase.from('rule_target_accounts').select('rule_id').eq('channel_account_id', account.id)
  const commentTargetRuleIds = (commentTargetRows ?? []).map((r) => r.rule_id)

  let commentRulesQuery = supabase.from('automation_rules').select('*').eq('is_active', true)
  commentRulesQuery =
    commentTargetRuleIds.length > 0
      ? commentRulesQuery.or(`channel_account_id.eq.${account.id},id.in.(${commentTargetRuleIds.join(',')})`)
      : commentRulesQuery.eq('channel_account_id', account.id)
  const { data: rules } = await commentRulesQuery.order('created_at', { ascending: true })

  const applicableRules = (rules || []).filter((rule) => {
    if (!['any_comment', 'comment_keyword'].includes(rule.trigger_type)) return false
    if (rule.target_post_ids?.length && comment.mediaId && !rule.target_post_ids.includes(comment.mediaId)) return false
    return true
  })

  applicableRules.sort((a, b) => {
    const aHasTarget = a.target_post_ids?.length > 0
    const bHasTarget = b.target_post_ids?.length > 0
    return aHasTarget === bHasTarget ? 0 : aHasTarget ? -1 : 1
  })

  const lowerText = comment.text.toLowerCase()
  const matchedRule =
    applicableRules.find(
      (rule) => rule.trigger_type === 'comment_keyword' && rule.trigger_keywords?.some((kw: string) => lowerText.includes(kw.toLowerCase()))
    ) ?? applicableRules.find((rule) => rule.trigger_type === 'any_comment')

  if (!matchedRule) return

  // Comment replies remain Instagram-only (no public-comment concept on
  // WhatsApp/Messenger's DM-only surface used here) — delegate to the
  // existing comment-reply helpers rather than the generic adapter.
  const { sendCommentReply, sendPrivateReplyToComment, sendPrivateButtonReplyToComment, sendPrivateCardReplyToComment } = await import(
    '../../meta/comments'
  )
  const commentContact = contactId ? await getContact(account.id, contactId) : null
  const replyText = renderTemplate(matchedRule.response_text, commentContact)
  const replyMethod = matchedRule.reply_method || 'comment'
  const isCard = matchedRule.response_type === 'card'
  const cardButtons = (
    (matchedRule.card_buttons as Array<{ type?: 'postback' | 'web_url'; title: string; url?: string }>) ?? []
  ).map((b) => ({ ...b, title: renderTemplate(b.title, commentContact) }))

  async function sendDm(dmText: string) {
    if (isCard) {
      return matchedRule.card_image_url
        ? sendPrivateCardReplyToComment(
            comment.channelExternalId,
            comment.commentId,
            account!.access_token,
            renderTemplate(matchedRule.card_title || dmText, commentContact),
            matchedRule.card_subtitle ? renderTemplate(matchedRule.card_subtitle, commentContact) : undefined,
            matchedRule.card_image_url ?? undefined,
            cardButtons
          )
        : sendPrivateButtonReplyToComment(
            comment.channelExternalId,
            comment.commentId,
            account!.access_token,
            renderTemplate(matchedRule.card_title || dmText, commentContact),
            cardButtons
          )
    }
    return sendPrivateReplyToComment(comment.channelExternalId, comment.commentId, account!.access_token, dmText)
  }

  try {
    let result = null
    if (replyMethod === 'both') {
      result = await sendCommentReply(comment.commentId, account.access_token, replyText)
      const dmText = matchedRule.response_text_dm ? renderTemplate(matchedRule.response_text_dm, commentContact) : replyText
      await sendDm(dmText)
    } else if (replyMethod === 'dm') {
      result = await sendDm(replyText)
    } else {
      result = await sendCommentReply(comment.commentId, account.access_token, replyText)
    }

    if (result) {
      await supabase
        .from('comment_logs')
        .update({ auto_reply_sent: true, reply_text: replyText, replied_at: new Date().toISOString() })
        .eq('comment_id', comment.commentId)
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await deactivateAccount(supabase, account.id)
    } else {
      console.error('[dispatchInboundComment] Failed to send reply:', err)
    }
  }
}
