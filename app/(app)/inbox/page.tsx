import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { getAccountLabel } from '@/lib/channels/labels'
import type { Platform } from '@/lib/channels/types'
import { cn } from '@/lib/utils'
import { getT } from '@/lib/i18n/server'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { ConversationList } from '@/components/inbox/conversation-list'
import { ConversationThread } from '@/components/inbox/conversation-thread'
import { InboxFilterBar } from '@/components/inbox/inbox-filter-bar'
import { ChannelFilterPills } from '@/components/inbox/channel-filter-pills'
import type { Conversation, MessageItem } from '@/components/inbox/types'

const PAGE_SIZE = 50
const PLATFORMS: Platform[] = ['instagram', 'whatsapp', 'messenger']

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; conv?: string; channel?: string; page?: string }>
}) {
  const supabase = await createClient()
  const t = await getT()
  const { accounts, active: account, scope } = await resolveActiveAccount()

  const { filter, conv, channel, page } = await searchParams
  const activeFilter = filter ?? 'all'
  const activeConvId = conv ?? null
  const activeChannel = channel && PLATFORMS.includes(channel as Platform) ? channel : 'all'
  const pageNum = Math.max(1, Number(page) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE

  // Unified inbox (Phase 2): scope 'all' reads across every account the user
  // can access, not just the cookie's single active account.
  const accountIds = scope === 'all' ? accounts.map((a) => a.id) : account ? [account.id] : []

  if (accountIds.length === 0) {
    return <NoAccountState description={t('inbox.noAccount')} />
  }

  const accountLabels = new Map(accounts.map((a) => [a.id, getAccountLabel(a)]))
  const availablePlatforms = Array.from(new Set(accounts.map((a) => a.platform)))

  let query = supabase
    .from('conversations')
    .select('*')
    .in('channel_account_id', accountIds)
    .order('last_message_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (activeChannel !== 'all') query = query.eq('platform', activeChannel)
  if (activeFilter === 'incoming') query = query.eq('last_direction', 'incoming')
  if (activeFilter === 'replied') query = query.eq('has_auto_replied', true)
  if (activeFilter === 'unreplied') query = query.eq('has_unreplied', true)

  let unrepliedQuery = supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('channel_account_id', accountIds)
    .eq('has_unreplied', true)
  if (activeChannel !== 'all') unrepliedQuery = unrepliedQuery.eq('platform', activeChannel)

  const [{ data: rows }, { count: unrepliedCount }] = await Promise.all([query, unrepliedQuery])

  const conversations: Conversation[] = (rows ?? []).map((row) => ({
    id: row.id,
    channelAccountId: row.channel_account_id,
    platform: row.platform,
    senderId: row.sender_id,
    senderUsername: row.sender_username,
    senderFullName: row.sender_full_name,
    senderProfilePic: row.sender_profile_pic,
    accountUsername: accountLabels.get(row.channel_account_id) ?? null,
    lastMessage: row.last_message_text,
    lastMessageAt: row.last_message_at,
    lastDirection: row.last_direction,
    messageCount: row.message_count,
    hasUnreplied: row.has_unreplied,
    hasAutoReplied: row.has_auto_replied,
  }))

  // Resolved directly by id (not just "found in the current page") so a
  // deep link into a conversation still opens it even if it falls off the
  // current filter/page — same account-scoping guarantee RLS already gives
  // every other query here.
  const { data: activeConversation } = activeConvId
    ? await supabase.from('conversations').select('*').eq('id', activeConvId).in('channel_account_id', accountIds).maybeSingle()
    : { data: null }

  // Full thread, never truncated by the list's status filter — the old
  // implementation applied `filter` to the same query it grouped into
  // threads, so opening an unreplied-only view hid a conversation's own
  // outgoing messages. Loading the thread independently of `filter` fixes
  // that.
  const { data: threadRows } = activeConversation
    ? await supabase
        .from('message_logs')
        .select('*')
        .eq('channel_account_id', activeConversation.channel_account_id)
        .eq('sender_id', activeConversation.sender_id)
        .order('created_at', { ascending: true })
        .limit(500)
    : { data: [] }

  const threadMessages: MessageItem[] = (threadRows ?? []) as MessageItem[]

  const activeContact = activeConversation
    ? (
        await supabase
          .from('contacts')
          .select('id, bot_paused, assigned_to')
          .eq('channel_account_id', activeConversation.channel_account_id)
          .eq('sender_id', activeConversation.sender_id)
          .maybeSingle()
      ).data
    : null

  const { data: teamMembers } = activeConversation
    ? await supabase.from('team_members').select('name, email').eq('channel_account_id', activeConversation.channel_account_id)
    : { data: [] }

  const { data: snippets } = activeConversation
    ? await supabase
        .from('snippets')
        .select('*')
        .eq('channel_account_id', activeConversation.channel_account_id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const backHrefParams = new URLSearchParams()
  if (activeFilter !== 'all') backHrefParams.set('filter', activeFilter)
  if (activeChannel !== 'all') backHrefParams.set('channel', activeChannel)
  const backHref = `/inbox${backHrefParams.toString() ? `?${backHrefParams.toString()}` : ''}`

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ─── Left sidebar ─── */}
      <div
        className={cn(
          'w-full shrink-0 flex-col overflow-hidden md:flex md:w-[300px]',
          'border-r border-[color-mix(in_srgb,var(--organic-terracotta)_10%,transparent)]',
          'bg-[color-mix(in_srgb,var(--organic-bg)_55%,transparent)] backdrop-blur-md',
          activeConvId ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Sidebar header */}
        <div
          className="shrink-0 px-4 pt-5 pb-3"
          style={{
            borderBottom: '1px solid color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
            background: 'color-mix(in srgb, var(--organic-bg) 40%, transparent)',
          }}
        >
          {/* Title row */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Left accent bar */}
              <div
                className="h-5 w-[3px] rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, var(--organic-terracotta), var(--organic-sage))',
                }}
              />
              <div>
                <h1 className="text-[15px] font-bold tracking-tight text-foreground">{t('inbox.title')}</h1>
                <p className="text-[11px] tabular-nums" style={{ color: 'color-mix(in srgb, var(--organic-text, var(--foreground)) 45%, transparent)' }}>
                  {t.plural('inbox.conversationCount', conversations.length)}
                </p>
              </div>
            </div>

            {(unrepliedCount ?? 0) > 0 && (
              <span
                className="flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: 'var(--organic-terracotta-600)' }}
              >
                {unrepliedCount}
              </span>
            )}
          </div>

          {/* Filter pills — client component for smooth transitions */}
          <InboxFilterBar activeFilter={activeFilter} activeConvId={activeConvId} />
          {scope === 'all' && (
            <ChannelFilterPills
              platforms={availablePlatforms}
              activeChannel={activeChannel}
              activeFilter={activeFilter}
              activeConvId={activeConvId}
            />
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1">
          <ConversationList conversations={conversations} activeId={activeConvId} filter={activeFilter} />
        </div>
      </div>

      {/* ─── Right thread panel ─── */}
      <div
        className={cn(
          'min-w-0 flex-1 flex-col overflow-hidden',
          'bg-[color-mix(in_srgb,var(--organic-bg)_45%,transparent)] backdrop-blur-sm',
          activeConvId ? 'flex' : 'hidden md:flex'
        )}
      >
        {activeConversation ? (
          <ConversationThread
            messages={threadMessages}
            senderName={
              activeConversation.sender_full_name ??
              (activeConversation.sender_username ? `@${activeConversation.sender_username}` : activeConversation.sender_id)
            }
            senderProfilePic={activeConversation.sender_profile_pic}
            accountUsername={accountLabels.get(activeConversation.channel_account_id) ?? null}
            backHref={backHref}
            channelAccountId={activeConversation.channel_account_id}
            senderId={activeConversation.sender_id}
            contactId={activeContact?.id ?? null}
            initialBotPaused={activeContact?.bot_paused ?? false}
            initialSnippets={snippets ?? []}
            teamMembers={teamMembers ?? []}
            initialAssignedTo={activeContact?.assigned_to ?? ''}
          />
        ) : (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <div
              className="relative flex size-16 items-center justify-center rounded-2xl"
              style={{
                background: 'color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--organic-terracotta) 18%, transparent)',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl blur-xl opacity-40"
                style={{ background: 'color-mix(in srgb, var(--organic-terracotta) 30%, transparent)' }}
              />
              <Inbox className="relative size-7" style={{ color: 'var(--organic-terracotta-600)' }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[14.5px] font-semibold text-foreground">{t('inbox.emptyState.title')}</p>
              <p className="mt-1 text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}>
                {t('inbox.emptyState.description')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
