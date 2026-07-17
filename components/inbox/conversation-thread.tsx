'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { ChevronLeft, Bot, Zap, Send, Pause, Play, MessageSquareText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { MessageItem } from './types'

export interface Snippet {
  id: string
  shortcut: string
  text: string
}

interface ExtendedMessageItem extends MessageItem {
  isAutoReply?: boolean
}

// Deterministic gradient for avatar
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
]
function getAvatarGradient(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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
  const [localMessages, setLocalMessages] = useState(messages)
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
      toast.error("Impossible d'assigner la conversation")
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
    const day = new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === day) last.items.push(msg)
    else groups.push({ date: day, items: [msg] })
  }

  const initial = senderName[0]?.toUpperCase() ?? '?'
  const gradient = getAvatarGradient(senderName)

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
      toast.error("Impossible d'envoyer le message")
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
      toast.success('Réponse rapide enregistrée')
    } catch {
      toast.error("Impossible d'enregistrer la réponse rapide")
    }
  }

  async function deleteSnippet(id: string) {
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSnippets((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error('Impossible de supprimer')
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
      toast.success(next ? 'Bot mis en pause pour ce contact' : 'Bot réactivé pour ce contact')
    } catch {
      toast.error('Impossible de changer le statut du bot')
    } finally {
      setTogglingPause(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        {backHref && (
          <Link
            href={backHref}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <ChevronLeft className="size-4" />
          </Link>
        )}

        {/* Avatar */}
        {senderProfilePic ? (
          <Image
            src={senderProfilePic}
            alt={senderName}
            width={32}
            height={32}
            unoptimized
            className="size-8 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${gradient}`}
          >
            {initial}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-[13px] font-semibold text-foreground">{senderName}</p>
          {accountUsername && (
            <p className="truncate text-[11px] text-muted-foreground">via @{accountUsername}</p>
          )}
        </div>

        {contactId && teamMembers.length > 0 && (
          <select
            value={assignedTo}
            onChange={(e) => handleAssign(e.target.value)}
            className="hidden shrink-0 cursor-pointer rounded-full border border-border bg-transparent px-2 py-1 text-[11px] text-muted-foreground outline-none sm:block"
          >
            <option value="">Non assigné</option>
            {teamMembers.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {contactId && (
          <button
            type="button"
            onClick={togglePause}
            disabled={togglingPause}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
              botPaused
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
            title={botPaused ? 'Réactiver le bot pour ce contact' : 'Mettre le bot en pause pour ce contact'}
          >
            {botPaused ? <Pause className="size-3" /> : <Play className="size-3" />}
            {botPaused ? 'Bot en pause' : 'Bot actif'}
          </button>
        )}

        <div className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <Bot className="size-3" />
          {sorted.length} message{sorted.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background/60 px-4 pt-6 pb-8 md:px-6">
        {groups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="whitespace-nowrap rounded-full border border-border/60 bg-muted/60 px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                {group.date}
              </span>
              <div className="h-px flex-1 bg-border/60" />
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
                  <div className={`flex max-w-[68%] flex-col gap-1 ${isIncoming ? 'items-start' : 'items-end'}`}>
                    {/* Auto-reply label */}
                    {isAutoReply && (
                      <span className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Zap className="size-2.5 text-primary" />
                        Réponse automatique
                      </span>
                    )}

                    <div
                      className={`rounded-2xl px-3.5 py-2.5 break-words shadow-sm ${
                        isIncoming
                          ? 'rounded-tl-sm bg-muted/80 text-foreground'
                          : isAutoReply
                            ? 'rounded-tr-sm bg-primary/85 text-primary-foreground ring-1 ring-primary/20'
                            : 'rounded-tr-sm bg-primary text-primary-foreground'
                      }`}
                    >
                      {msg.message_text ? (
                        <p className="text-[13px] leading-relaxed">{msg.message_text}</p>
                      ) : (
                        <p className="text-xs italic opacity-70">
                          {msg.message_type === 'image'
                            ? '🖼️ Image'
                            : msg.message_type === 'story_reply'
                              ? '📖 Réponse à une story'
                              : '(contenu non textuel)'}
                        </p>
                      )}
                    </div>

                    <span className="px-0.5 text-[11px] text-muted-foreground/60 tabular-nums">
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.auto_reply_sent && !isAutoReply && (
                        <span className="ml-1 text-primary/60">· Répondu</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-end gap-2 border-t border-border bg-card/80 p-3 backdrop-blur-sm">
        <Popover open={snippetsOpen} onOpenChange={setSnippetsOpen}>
          <PopoverTrigger
            render={<Button type="button" variant="outline" size="icon" aria-label="Réponses rapides" />}
          >
            <MessageSquareText className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start" side="top">
            <div className="mb-1.5 px-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Réponses rapides
            </div>
            <div className="max-h-52 space-y-0.5 overflow-y-auto">
              {snippets.length === 0 ? (
                <p className="px-1.5 py-2 text-xs italic text-muted-foreground">Aucune réponse rapide.</p>
              ) : (
                snippets.map((s) => (
                  <div key={s.id} className="group flex items-center gap-1 rounded-lg hover:bg-muted">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(s.text)
                        setSnippetsOpen(false)
                      }}
                      className="flex-1 truncate px-2.5 py-2 text-left text-xs"
                    >
                      <span className="font-semibold text-primary">/{s.shortcut}</span>{' '}
                      <span className="text-muted-foreground">{s.text}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSnippet(s.id)}
                      className="mr-1 shrink-0 cursor-pointer rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 border-t border-border pt-1.5">
              <Input
                value={newShortcut}
                onChange={(e) => setNewShortcut(e.target.value)}
                placeholder="raccourci (ex: prix)"
                className="h-7 text-xs"
              />
              <Button type="button" size="icon-sm" onClick={saveSnippet} disabled={!newShortcut.trim() || !draft.trim()} aria-label="Enregistrer le brouillon comme réponse rapide">
                <Plus className="size-3.5" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Écrire un message…"
          rows={1}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button size="icon" onClick={sendMessage} disabled={sending || !draft.trim()} aria-label="Envoyer">
          <Send className="size-4" />
        </Button>
      </div>
    </>
  )
}
