import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { ConversationList } from '@/components/inbox/conversation-list'
import { ConversationThread } from '@/components/inbox/conversation-thread'
import type { Conversation, MessageItem } from '@/components/inbox/types'

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'incoming', label: 'Reçus' },
  { key: 'replied', label: 'Répondus' },
  { key: 'unreplied', label: 'Sans réponse' },
]

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

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div
        className={cn(
          'w-full shrink-0 flex-col overflow-hidden border-border bg-card md:flex md:w-80 md:border-r',
          activeConvId ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="shrink-0 border-b border-border px-4 pt-5 pb-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Inbox</h1>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            {conversations.some((c) => c.hasUnreplied) && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {conversations.filter((c) => c.hasUnreplied).length}
              </span>
            )}
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {FILTERS.map(({ key, label }) => {
              const params = new URLSearchParams()
              if (key !== 'all') params.set('filter', key)
              if (activeConvId) params.set('conv', activeConvId)
              const href = `/inbox${params.toString() ? `?${params.toString()}` : ''}`
              const isActive = activeFilter === key
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-all',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} activeId={activeConvId} filter={activeFilter} />
        </div>
      </div>

      <div className={cn('min-w-0 flex-1 flex-col overflow-hidden', activeConvId ? 'flex' : 'hidden md:flex')}>
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
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <MessageSquare className="size-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Sélectionnez une conversation</p>
              <p className="mt-1 text-xs text-muted-foreground">Cliquez sur un contact à gauche pour voir les messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
