'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { ChevronLeft, Bot, Zap, Send, Pause, Play, MessageSquareText, Plus, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useT, useLocale } from '@/components/i18n-provider'
import type { MessageItem } from './types'

export interface Snippet {
  id: string
  shortcut: string
  text: string
}

interface ExtendedMessageItem extends MessageItem {
  isAutoReply?: boolean
}

// Deterministic organic gradient for avatar
const AVATAR_PALETTES = [
  { from: 'var(--organic-terracotta-400)', to: 'var(--organic-terracotta-600)' },
  { from: 'var(--organic-sage-400)', to: 'var(--organic-sage-600)' },
  { from: 'var(--organic-terracotta-300)', to: 'var(--organic-sage-500)' },
  { from: 'var(--organic-sand-400)', to: 'var(--organic-terracotta-500)' },
]
function getAvatarPalette(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

export function ConversationThread({
  messages,
  senderName,
  senderProfilePic,
  accountUsername,
  backHref,
  channelAccountId,
  senderId,
  contactId,
  initialBotPaused,
  initialSnippets,
  teamMembers,
  initialAssignedTo,
}: {
  messages: MessageItem[]
  senderName: string
  senderProfilePic: string | null
  accountUsername: string | null
  backHref?: string
  channelAccountId: string
  senderId: string
  contactId: string | null
  initialBotPaused: boolean
  initialSnippets: Snippet[]
  teamMembers: { name: string; email: string }[]
  initialAssignedTo: string
}) {
  const t = useT()
  const locale = useLocale()
  const dateLocale = locale === 'ar' ? 'ar' : locale === 'en' ? 'en-US' : 'fr-FR'
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [localMessages, setLocalMessages] = useState(messages)

  // Scroll to bottom when conversation loads or messages update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [localMessages, senderId])

  // Sync messages prop to state
  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [botPaused, setBotPaused] = useState(initialBotPaused)
  const [togglingPause, setTogglingPause] = useState(false)
  const [snippets, setSnippets] = useState(initialSnippets)
  const [snippetsOpen, setSnippetsOpen] = useState(false)
  const [newShortcut, setNewShortcut] = useState('')
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo)

  async function handleAssign(email: string) {
    if (!contactId) return
    setAssignedTo(email)
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: email || null }),
      })
    } catch {
      toast.error(t('inbox.thread.toastAssignError'))
    }
  }

  const sorted = [...localMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const displayItems: ExtendedMessageItem[] = []
  for (const msg of sorted) {
    displayItems.push(msg)
    if (msg.reply_text) {
      displayItems.push({
        ...msg,
        id: `reply-${msg.id}`,
        direction: 'outgoing',
        message_text: msg.reply_text,
        reply_text: null,
        auto_reply_sent: false,
        isAutoReply: true,
        created_at: new Date(new Date(msg.created_at).getTime() + 1000).toISOString(),
      })
    }
  }

  const groups: { date: string; items: ExtendedMessageItem[] }[] = []
  for (const msg of displayItems) {
    const day = new Date(msg.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === day) last.items.push(msg)
    else groups.push({ date: day, items: [msg] })
  }

  const initial = senderName[0]?.toUpperCase() ?? '?'
  const palette = getAvatarPalette(senderName)

  async function sendMessage() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, sender_id: senderId, text }),
      })
      if (!res.ok) throw new Error()
      const logged = await res.json()
      setLocalMessages((prev) => [
        ...prev,
        {
          id: logged.id ?? `local-${Date.now()}`,
          direction: 'outgoing',
          message_text: text,
          message_type: 'text',
          reply_text: null,
          auto_reply_sent: false,
          created_at: logged.created_at ?? new Date().toISOString(),
          sender_username: null,
          sender_full_name: null,
          sender_profile_pic: null,
          sender_id: senderId,
        },
      ])
      setDraft('')
    } catch {
      toast.error(t('inbox.thread.toastSendError'))
    } finally {
      setSending(false)
    }
  }

  async function saveSnippet() {
    if (!newShortcut.trim() || !draft.trim()) return
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, shortcut: newShortcut.trim(), text: draft.trim() }),
      })
      if (!res.ok) throw new Error()
      const created: Snippet = await res.json()
      setSnippets((prev) => [created, ...prev])
      setNewShortcut('')
      toast.success(t('inbox.thread.toastSnippetSaved'))
    } catch {
      toast.error(t('inbox.thread.toastSnippetSaveError'))
    }
  }

  async function deleteSnippet(id: string) {
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSnippets((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error(t('inbox.thread.toastSnippetDeleteError'))
    }
  }

  async function togglePause() {
    if (!contactId) return
    setTogglingPause(true)
    const next = !botPaused
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_paused: next }),
      })
      if (!res.ok) throw new Error()
      setBotPaused(next)
      toast.success(next ? t('inbox.thread.toastBotPaused') : t('inbox.thread.toastBotResumed'))
    } catch {
      toast.error(t('inbox.thread.toastBotToggleError'))
    } finally {
      setTogglingPause(false)
    }
  }

  return (
    <>
      {/* ─── Header ─── */}
      <div
        className="relative flex h-14 shrink-0 items-center gap-3 px-4"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 60%, transparent)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
        }}
      >
        {/* Subtle aurora in header */}
        <div
          className="pointer-events-none absolute end-0 top-0 h-full w-40 opacity-[0.05]"
          style={{ background: 'linear-gradient(to left, var(--organic-terracotta), transparent)' }}
        />

        {backHref && (
          <Link
            href={backHref}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            style={{ background: 'color-mix(in srgb, var(--organic-sand-300) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--organic-sand-400) 18%, transparent)' }}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
            <span className="text-[12px] font-medium">{t('inbox.thread.back')}</span>
          </Link>
        )}

        {/* Avatar */}
        {senderProfilePic ? (
          <Image
            src={senderProfilePic}
            alt={senderName}
            width={34}
            height={34}
            unoptimized
            className="size-[34px] shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px color-mix(in srgb, var(--organic-terracotta) 22%, transparent)` }}
          />
        ) : (
          <div
            className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
              boxShadow: `0 2px 8px color-mix(in srgb, ${palette.to} 30%, transparent)`,
            }}
          >
            {initial}
          </div>
        )}

        {/* Name + channel */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <p className="truncate text-[13.5px] font-semibold text-foreground">{senderName}</p>
          {accountUsername && (
            <p className="truncate text-[11px]" style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}>
              {t('inbox.thread.viaAccount', { username: accountUsername })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="relative flex shrink-0 items-center gap-2">
          {/* Assign select */}
          {contactId && teamMembers.length > 0 && (
            <select
              value={assignedTo}
              onChange={(e) => handleAssign(e.target.value)}
              className="hidden cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium outline-none transition-all sm:block"
              style={{
                background: 'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)',
                border: '1px solid color-mix(in srgb, var(--organic-sand-400) 25%, transparent)',
                color: 'color-mix(in srgb, var(--foreground) 65%, transparent)',
              }}
            >
              <option value="">{t('inbox.thread.unassigned')}</option>
              {teamMembers.map((m) => (
                <option key={m.email} value={m.email}>{m.name}</option>
              ))}
            </select>
          )}

          {/* Bot pause toggle */}
          {contactId && (
            <button
              type="button"
              onClick={togglePause}
              disabled={togglingPause}
              className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 disabled:opacity-50 sm:flex"
              style={
                botPaused
                  ? {
                      background: 'color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--organic-terracotta) 20%, transparent)',
                      color: 'var(--organic-terracotta-700)',
                    }
                  : {
                      background: 'color-mix(in srgb, var(--organic-sage) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--organic-sage) 20%, transparent)',
                      color: 'var(--organic-sage-700)',
                    }
              }
            >
              {botPaused ? <Pause className="size-3" /> : <Play className="size-3" />}
              {botPaused ? t('inbox.thread.botPaused') : t('inbox.thread.botActive')}
            </button>
          )}

          {/* Message count */}
          <div
            className="hidden shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium sm:flex"
            style={{
              background: 'color-mix(in srgb, var(--organic-sand-300) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--organic-sand-400) 20%, transparent)',
              color: 'color-mix(in srgb, var(--foreground) 50%, transparent)',
            }}
          >
            <Bot className="size-3" strokeWidth={1.75} />
            {t.plural('inbox.thread.messageCount', sorted.length)}
          </div>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 pt-4 pb-6 md:px-6 md:pt-6 md:pb-8 scroll-smooth"
        style={{ background: 'color-mix(in srgb, var(--organic-bg) 35%, transparent)' }}
      >
        {groups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="my-6 flex items-center gap-3">
              <div
                className="h-px flex-1"
                style={{ background: 'color-mix(in srgb, var(--organic-sand-400) 25%, transparent)' }}
              />
              <span
                className="whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-medium"
                style={{
                  background: 'color-mix(in srgb, var(--organic-sand-300) 20%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--organic-sand-400) 25%, transparent)',
                  color: 'color-mix(in srgb, var(--foreground) 45%, transparent)',
                }}
              >
                {group.date}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: 'color-mix(in srgb, var(--organic-sand-400) 25%, transparent)' }}
              />
            </div>

            {group.items.map((msg, idx) => {
              const isIncoming = msg.direction === 'incoming'
              const prevMsg = idx > 0 ? group.items[idx - 1] : null
              const sameDirectionAsPrev = prevMsg?.direction === msg.direction
              const isAutoReply = msg.isAutoReply

              return (
                <div
                  key={msg.id}
                  className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} ${sameDirectionAsPrev ? 'mt-1' : 'mt-4'}`}
                >
                  <div className={`flex max-w-[82%] flex-col gap-1 md:max-w-[68%] ${isIncoming ? 'items-start' : 'items-end'}`}>
                    {/* Auto-reply label */}
                    {isAutoReply && (
                      <span
                        className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: 'var(--organic-terracotta-600)' }}
                      >
                        <Sparkles className="size-2.5" />
                        {t('inbox.thread.autoReplyLabel')}
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      className="break-words rounded-2xl px-3.5 py-2.5 shadow-sm"
                      style={
                        isIncoming
                          ? {
                              background: 'color-mix(in srgb, var(--organic-bg) 80%, transparent)',
                              border: '1px solid color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
                              borderTopLeftRadius: '6px',
                              backdropFilter: 'blur(8px)',
                            }
                          : isAutoReply
                            ? {
                                background: 'color-mix(in srgb, var(--organic-terracotta) 75%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--organic-terracotta) 30%, transparent)',
                                borderTopRightRadius: '6px',
                                color: 'white',
                              }
                            : {
                                background: 'linear-gradient(135deg, var(--organic-terracotta-500), var(--organic-terracotta-700))',
                                borderTopRightRadius: '6px',
                                color: 'white',
                                boxShadow: '0 4px 12px color-mix(in srgb, var(--organic-terracotta) 30%, transparent)',
                              }
                      }
                    >
                      {msg.message_text ? (
                        <p className="text-[13px] leading-relaxed">{msg.message_text}</p>
                      ) : (
                        <p className="text-xs italic opacity-70">
                          {msg.message_type === 'image'
                            ? t('inbox.thread.imageContent')
                            : msg.message_type === 'story_reply'
                              ? t('inbox.thread.storyReplyContent')
                              : t('inbox.thread.nonTextContent')}
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span
                      className="px-0.5 text-[10.5px] tabular-nums"
                      style={{ color: 'color-mix(in srgb, var(--foreground) 32%, transparent)' }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                      {msg.auto_reply_sent && !isAutoReply && (
                        <span style={{ marginLeft: '4px', color: 'var(--organic-terracotta-600)' }}>
                          · <Zap className="inline size-2.5" /> {t('inbox.thread.repliedIndicator')}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ─── Composer ─── */}
      <div
        className="flex shrink-0 items-end gap-2 p-3"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 65%, transparent)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Snippets popover */}
        <Popover open={snippetsOpen} onOpenChange={setSnippetsOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label={t('inbox.thread.quickReplies')}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-150"
                style={{
                  background: 'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--organic-sand-400) 25%, transparent)',
                  color: 'color-mix(in srgb, var(--foreground) 55%, transparent)',
                }}
              />
            }
          >
            <MessageSquareText className="size-4" strokeWidth={1.75} />
          </PopoverTrigger>
          <PopoverContent
            className="w-72 overflow-hidden rounded-2xl border-0 p-0 shadow-xl"
            align="start"
            side="top"
            style={{
              background: 'color-mix(in srgb, var(--organic-bg) 85%, transparent)',
              backdropFilter: 'blur(24px) saturate(1.8)',
              border: '1px solid color-mix(in srgb, var(--organic-sand-300) 40%, transparent)',
              boxShadow: '0 8px 32px color-mix(in srgb, var(--organic-terracotta) 8%, transparent)',
            }}
          >
            <div
              className="px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                borderBottom: '1px solid color-mix(in srgb, var(--organic-sand-300) 30%, transparent)',
                color: 'color-mix(in srgb, var(--foreground) 45%, transparent)',
              }}
            >
              {t('inbox.thread.quickReplies')}
            </div>
            <div className="max-h-52 space-y-0.5 overflow-y-auto p-1.5">
              {snippets.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs italic text-muted-foreground">{t('inbox.thread.noQuickReplies')}</p>
              ) : (
                snippets.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-1 rounded-lg transition-all duration-100"
                    style={{
                      // hover done via onMouseEnter/Leave — or let browser handle via CSS
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(s.text)
                        setSnippetsOpen(false)
                      }}
                      className="flex-1 truncate rounded-lg px-2.5 py-2 text-start text-xs transition-colors hover:bg-[color-mix(in_srgb,var(--organic-sand-300)_18%,transparent)]"
                    >
                      <span className="font-bold" style={{ color: 'var(--organic-terracotta-600)' }}>
                        /{s.shortcut}
                      </span>{' '}
                      <span className="text-muted-foreground">{s.text}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSnippet(s.id)}
                      className="me-1 shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                      aria-label={t('inbox.thread.deleteSnippetAria')}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div
              className="flex items-center gap-1.5 p-2"
              style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-sand-300) 25%, transparent)' }}
            >
              <Input
                value={newShortcut}
                onChange={(e) => setNewShortcut(e.target.value)}
                placeholder={t('inbox.thread.shortcutPlaceholder')}
                className="h-7 text-xs"
              />
              <Button
                type="button"
                size="icon-sm"
                onClick={saveSnippet}
                disabled={!newShortcut.trim() || !draft.trim()}
                aria-label={t('inbox.thread.saveSnippetAria')}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Textarea */}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={t('inbox.thread.composerPlaceholder')}
          rows={1}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-xl px-3.5 py-2 text-[13.5px] outline-none transition-all"
          style={{
            background: 'color-mix(in srgb, var(--organic-bg) 70%, transparent)',
            border: '1px solid color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
            color: 'var(--foreground)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--organic-terracotta) 35%, transparent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--organic-terracotta) 8%, transparent)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--organic-sand-400) 30%, transparent)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !draft.trim()}
          aria-label={t('inbox.thread.sendAria')}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white shadow-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={{
            background: draft.trim()
              ? 'linear-gradient(135deg, var(--organic-terracotta-500), var(--organic-terracotta-700))'
              : 'color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
            boxShadow: draft.trim()
              ? '0 4px 12px color-mix(in srgb, var(--organic-terracotta) 30%, transparent)'
              : 'none',
          }}
        >
          <Send className="size-4" strokeWidth={2} />
        </button>
      </div>
    </>
  )
}
