import { MessageSquare, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { ConversationList } from '@/components/inbox/conversation-list'
import { ConversationThread } from '@/components/inbox/conversation-thread'
import { InboxFilterBar } from '@/components/inbox/inbox-filter-bar'
import type { Conversation, MessageItem } from '@/components/inbox/types'



export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; conv?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { filter, conv } = await searchParams
  const activeFilter = filter ?? 'all'
  const activeConvId = conv ?? null

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_picture_url')
    .eq('user_id', user!.id)

  const safeAccounts = accounts ?? []
  const accountIds = safeAccounts.map((a) => a.id)
  const accountMap = Object.fromEntries(safeAccounts.map((a) => [a.id, a]))

  let query = supabase
    .from('message_logs')
    .select('*')
    .in('channel_account_id', accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(500)

  if (activeFilter === 'incoming') query = query.eq('direction', 'incoming')
  if (activeFilter === 'replied') query = query.eq('auto_reply_sent', true)
  if (activeFilter === 'unreplied') query = query.eq('direction', 'incoming').eq('auto_reply_sent', false)

  const { data: allMessages } = await query

  const convMap = new Map<
    string,
    {
      msgs: MessageItem[]
      accountUsername: string | null
      senderUsername: string | null
      senderFullName: string | null
      senderProfilePic: string | null
      channelAccountId: string
    }
  >()

  for (const msg of allMessages ?? []) {
    const key = msg.sender_id
    if (!convMap.has(key)) {
      const acc = accountMap[msg.channel_account_id]
      convMap.set(key, {
        msgs: [],
        accountUsername: acc?.instagram_username ?? null,
        senderUsername: msg.sender_username ?? null,
        senderFullName: msg.sender_full_name ?? null,
        senderProfilePic: msg.sender_profile_pic ?? null,
        channelAccountId: msg.channel_account_id,
      })
    }
    convMap.get(key)!.msgs.push(msg as MessageItem)
  }

  const conversations: Conversation[] = Array.from(convMap.entries())
    .map(([senderId, data]) => {
      const sorted = [...data.msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const latest = sorted[0]
      return {
        senderId,
        senderUsername: data.senderUsername,
        senderFullName: data.senderFullName,
        senderProfilePic: data.senderProfilePic,
        accountUsername: data.accountUsername,
        lastMessage: latest.message_text,
        lastMessageAt: latest.created_at,
        lastDirection: latest.direction as 'incoming' | 'outgoing',
        messageCount: data.msgs.length,
        hasUnreplied: data.msgs.some((m) => m.direction === 'incoming' && !m.auto_reply_sent),
        hasAutoReplied: data.msgs.some((m) => m.auto_reply_sent),
      }
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  const activeConv = activeConvId ? convMap.get(activeConvId) : null
  const threadMessages: MessageItem[] = activeConv
    ? [...activeConv.msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : []

  const activeContact =
    activeConv && activeConvId
      ? (
          await supabase
            .from('contacts')
            .select('id, bot_paused, assigned_to')
            .eq('channel_account_id', activeConv.channelAccountId)
            .eq('sender_id', activeConvId)
            .maybeSingle()
        ).data
      : null

  const { data: teamMembers } = activeConv
    ? await supabase.from('team_members').select('name, email').eq('channel_account_id', activeConv.channelAccountId)
    : { data: [] }

  const { data: snippets } = activeConv
    ? await supabase
        .from('snippets')
        .select('*')
        .eq('channel_account_id', activeConv.channelAccountId)
        .order('created_at', { ascending: false })
    : { data: [] }

  const unrepliedCount = conversations.filter((c) => c.hasUnreplied).length

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
                <h1 className="text-[15px] font-bold tracking-tight text-foreground">Inbox</h1>
                <p className="text-[11px] tabular-nums" style={{ color: 'color-mix(in srgb, var(--organic-text, var(--foreground)) 45%, transparent)' }}>
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {unrepliedCount > 0 && (
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
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
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
        {activeConv && activeConvId ? (
          <ConversationThread
            messages={threadMessages}
            senderName={activeConv.senderFullName ?? (activeConv.senderUsername ? `@${activeConv.senderUsername}` : activeConvId)}
            senderProfilePic={activeConv.senderProfilePic}
            accountUsername={activeConv.accountUsername}
            backHref={`/inbox${activeFilter !== 'all' ? `?filter=${activeFilter}` : ''}`}
            channelAccountId={activeConv.channelAccountId}
            senderId={activeConvId}
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
              <p className="text-[14.5px] font-semibold text-foreground">Sélectionnez une conversation</p>
              <p className="mt-1 text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}>
                Cliquez sur un contact à gauche pour voir ses messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
