'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Streamdown } from 'streamdown'
import { Send, Sparkles, Loader2, ShieldAlert } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ProgressIndicator, ThinkingIndicator } from './progress-indicator'
import { ToolResultCard } from './tool-result-card'
import { appendTextDelta, appendToolResult, type AssistantPart } from '@/lib/ai/copilot-message-parts'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import type { AiStreamEvent } from '@/lib/ai/types'
import type { AiContext } from '@/lib/ai/context/types'

type DisplayMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; parts: AssistantPart[] }

interface PendingConfirm {
  id: string
  name: string
  preview: string
}

async function readNdjsonStream(res: Response, onEvent: (event: AiStreamEvent) => void): Promise<void> {
  if (!res.ok) {
    // A non-2xx (402 quota, 404, 429 rate limit, 503 provider down, 500) has
    // a JSON error body, not an ndjson stream — reading it as one silently
    // no-ops (no `t` field matches) and the user sees an empty bubble with
    // no explanation. Surface it as a normal error event instead.
    const body = await res.json().catch(() => null)
    onEvent({ t: 'error', message: body?.error ?? `Erreur serveur (${res.status})` })
    return
  }
  if (!res.body) throw new Error('Pas de réponse du serveur')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        onEvent(JSON.parse(line) as AiStreamEvent)
      } catch {
        // One malformed line shouldn't abort the whole read.
      }
    }
  }
}

export function CopilotPanel({
  channelAccountId,
  context = { kind: 'none' },
  open,
  onOpenChange,
  initialMessage,
  onInitialMessageSent,
}: {
  channelAccountId: string
  context?: AiContext
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMessage?: string
  onInitialMessageSent?: () => void
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [input, setInput] = useState('')
  const [progressStep, setProgressStep] = useState<{ step: string; detail?: string } | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const conversationIdRef = useRef<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingConfirm, progressStep, isThinking])

  useEffect(() => {
    if (open && initialMessage) {
      void send(initialMessage)
      onInitialMessageSent?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMessage])

  function newAssistantBubble(): string {
    const id = crypto.randomUUID()
    setMessages((prev) => [...prev, { id, role: 'assistant', parts: [] }])
    return id
  }

  function updateAssistantParts(assistantId: string, update: (parts: AssistantPart[]) => AssistantPart[]) {
    setMessages((prev) => prev.map((m) => (m.id === assistantId && m.role === 'assistant' ? { ...m, parts: update(m.parts) } : m)))
  }

  function applyEvent(event: AiStreamEvent, assistantId: string) {
    if (event.t === 'text') {
      updateAssistantParts(assistantId, (parts) => appendTextDelta(parts, event.delta))
      // Clear progress indicators when text starts streaming
      setProgressStep(null)
      setIsThinking(false)
    } else if (event.t === 'tool_result' && event.ok && event.output !== undefined) {
      // Only the handful of read/list tools in DISPLAYABLE_TOOLS (lib/ai/loop.ts) ever carry
      // `output` — every other tool call stays silent here exactly as before this feature.
      updateAssistantParts(assistantId, (parts) => appendToolResult(parts, event.name, event.output))
    } else if (event.t === 'error') {
      updateAssistantParts(assistantId, (parts) => (parts.length > 0 ? parts : [{ type: 'text', text: event.message }]))
      // Clear indicators on error
      setProgressStep(null)
      setIsThinking(false)
    } else if (event.t === 'confirm') {
      setPendingConfirm({ id: event.id, name: event.name, preview: event.preview })
      // Clear indicators when confirmation is requested
      setProgressStep(null)
      setIsThinking(false)
    } else if (event.t === 'progress') {
      // Update progress step
      setProgressStep({ step: event.step, detail: event.detail })
      setIsThinking(false)
    } else if (event.t === 'thinking') {
      // Update thinking state
      setIsThinking(event.active)
      if (event.active) {
        // Clear progress step when thinking starts
        setProgressStep(null)
      }
    } else if (event.t === 'done') {
      // Clear all indicators when done
      setProgressStep(null)
      setIsThinking(false)
    }
    // tool_start stays silent by design (§1.2); credits update the settings-page meter on next load.
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setInput('')
    setSending(true)
    setPendingConfirm(null)
    setProgressStep(null)
    setIsThinking(false)

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }])
    const assistantId = newAssistantBubble()

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelAccountId, message: trimmed, conversationId: conversationIdRef.current, context }),
      })
      const headerConversationId = res.headers.get('X-Conversation-Id')
      if (headerConversationId) conversationIdRef.current = headerConversationId
      await readNdjsonStream(res, (event) => applyEvent(event, assistantId))
    } catch {
      updateAssistantParts(assistantId, (parts) => (parts.length > 0 ? parts : [{ type: 'text', text: 'Une erreur est survenue.' }]))
    } finally {
      setSending(false)
      setProgressStep(null)
      setIsThinking(false)
    }
  }

  async function respondToConfirm(confirmed: boolean) {
    if (!pendingConfirm) return
    const toolCallId = pendingConfirm.id
    setPendingConfirm(null)

    if (!confirmed) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', parts: [{ type: 'text', text: 'Action annulée.' }] }])
      // Must reach the server: it patches the placeholder tool_result left
      // by the paused turn so the conversation stays well-formed for the
      // next message. A purely local cancel (the previous behavior) left
      // that tool_use unresolved forever — every later message then 400'd
      // against the provider. Fire-and-forget is fine here: worst case is a
      // stale "en attente" placeholder in history, not a broken turn, since
      // the confirm endpoint independently rejects an already-cancelled id.
      void fetch('/api/ai/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolCallId }),
      })
      return
    }

    setConfirming(true)
    setProgressStep(null)
    setIsThinking(false)
    const assistantId = newAssistantBubble()
    try {
      const res = await fetch('/api/ai/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolCallId }),
      })
      await readNdjsonStream(res, (event) => applyEvent(event, assistantId))
    } catch {
      updateAssistantParts(assistantId, (parts) => (parts.length > 0 ? parts : [{ type: 'text', text: 'Une erreur est survenue.' }]))
    } finally {
      setConfirming(false)
      setProgressStep(null)
      setIsThinking(false)
    }
  }

  const isLive = sending || confirming || isThinking
  const isMobile = !useMediaQuery('(min-width: 640px)')

  // ── Swipe-to-dismiss (mobile bottom sheet only) ─────────────────────────
  const dragY = useMotionValue(0)
  const sheetOpacity = useTransform(dragY, [0, 300], [1, 0.4])

  function handleDragEnd(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
    const shouldClose = info.offset.y > 120 || info.velocity.y > 500
    if (shouldClose) {
      onOpenChange(false)
    } else {
      // Snap back to 0
      void animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex w-full flex-col gap-0 border-0 bg-transparent p-0 shadow-none',
          isMobile ? 'h-[85dvh] rounded-t-2xl' : 'sm:max-w-md'
        )}
      >
        {/* Mobile: draggable wrapper for swipe-to-dismiss */}
        {isMobile ? (
          <motion.div
            style={{ y: dragY, opacity: sheetOpacity }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            className="flex flex-col h-full touch-none"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-foreground/25 transition-colors" />
            </div>
            <div className="glass-card flex flex-1 flex-col gap-0 overflow-hidden rounded-t-2xl">
          <SheetHeader className="border-b border-border/50 px-4 py-3.5">
            {/* SheetTitle stays text-only (screen readers need an accessible dialog title) —
                the visual identity block below is a sibling, not nested inside it, since
                Base UI's Title renders a heading element that shouldn't contain a <div>. */}
            <SheetTitle className="sr-only">Copilote</SheetTitle>
            <div className="flex items-center gap-2.5">
              {/* Mini orb — same layered treatment as the FAB, scaled down */}
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(145deg, var(--organic-terracotta-400) 0%, var(--organic-terracotta-600) 100%)' }}
                />
                <Sparkles className="relative size-3.5 text-primary-foreground" strokeWidth={2.25} />
                <span
                  className={cn(
                    'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card',
                    isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
                  )}
                  aria-hidden="true"
                />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground">Copilote</span>
                <span className="text-[11px] text-muted-foreground">{isLive ? 'En train de répondre…' : 'En ligne'}</span>
              </div>
            </div>
          </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Demandez-moi de diagnostiquer un flow, chercher un contact, ou résumer votre activité récente.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => {
                if (m.role === 'user') {
                  return (
                    <div
                      key={m.id}
                      className="ml-auto max-w-[85%] rounded-2xl rounded-br-[4px] bg-primary/12 px-3.5 py-2.5 text-sm leading-relaxed text-foreground"
                    >
                      {m.text}
                    </div>
                  )
                }

                if (m.parts.length === 0) {
                  // Assistant turn started (bubble created) but no text/card has arrived yet.
                  return (
                    <div
                      key={m.id}
                      className="mr-auto max-w-[85%] rounded-2xl rounded-bl-[4px] border border-border/50 bg-muted/50 px-3.5 py-2.5 text-sm text-foreground"
                    >
                      {sending && <Loader2 className="size-3.5 animate-spin" />}
                    </div>
                  )
                }

                return (
                  <Fragment key={m.id}>
                    {m.parts.map((part, i) =>
                      part.type === 'text' ? (
                        part.text.trim() && (
                          <div
                            key={i}
                            className="mr-auto max-w-[85%] rounded-2xl rounded-bl-[4px] border border-border/50 bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed text-foreground"
                          >
                            <Streamdown className="copilot-markdown">{part.text}</Streamdown>
                          </div>
                        )
                      ) : (
                        <ToolResultCard key={i} name={part.name} output={part.output} />
                      )
                    )}
                  </Fragment>
                )
              })}

              {/* Progress indicator - shown when a tool is being executed */}
              {progressStep && (
                <div className="mr-auto max-w-[85%]">
                  <ProgressIndicator step={progressStep.step} detail={progressStep.detail} />
                </div>
              )}

              {/* Thinking indicator - shown when waiting for LLM response */}
              {isThinking && !progressStep && (
                <div className="mr-auto max-w-[85%] px-1">
                  <ThinkingIndicator />
                </div>
              )}

              {pendingConfirm && (
                <div className="mr-auto max-w-[85%] rounded-2xl border border-primary/30 bg-card p-3 shadow-sm ring-1 ring-primary/20">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-sm text-foreground">{pendingConfirm.preview}</p>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => respondToConfirm(false)} disabled={confirming}>
                      Annuler
                    </Button>
                    <Button size="sm" onClick={() => respondToConfirm(true)} disabled={confirming}>
                      {confirming ? <Loader2 className="size-3.5 animate-spin" /> : 'Confirmer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
          className={cn(
            'flex items-center gap-2 border-t border-border/50',
            isMobile ? 'p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]' : 'p-3'
          )}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrire au copilote…"
            disabled={sending || Boolean(pendingConfirm)}
            className={cn(
              'flex-1 rounded-full border border-border bg-background/80 px-3.5 text-sm outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25',
              isMobile ? 'h-11' : 'h-9'
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim() || Boolean(pendingConfirm)}
            className={cn('shrink-0', isMobile ? 'size-11' : 'size-9')}
            aria-label="Envoyer"
          >
            <Send className={isMobile ? 'size-5' : 'size-4'} />
          </Button>
        </form>
          </div>
        </motion.div>
        ) : (
          /* Desktop: static right panel */
          <div className="glass-card flex h-full flex-col gap-0 overflow-hidden rounded-none sm:rounded-l-2xl">
            <SheetHeader className="border-b border-border/50 px-4 py-3.5">
              <SheetTitle className="sr-only">Copilote</SheetTitle>
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'linear-gradient(145deg, var(--organic-terracotta-400) 0%, var(--organic-terracotta-600) 100%)' }}
                  />
                  <Sparkles className="relative size-3.5 text-primary-foreground" strokeWidth={2.25} />
                  <span
                    className={cn(
                      'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card',
                      isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
                    )}
                    aria-hidden="true"
                  />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-foreground">Copilote</span>
                  <span className="text-[11px] text-muted-foreground">{isLive ? 'En train de répondre…' : 'En ligne'}</span>
                </div>
              </div>
            </SheetHeader>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Demandez-moi de diagnostiquer un flow, chercher un contact, ou résumer votre activité récente.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((m) => {
                    if (m.role === 'user') {
                      return (
                        <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-[4px] bg-primary/12 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                          {m.text}
                        </div>
                      )
                    }
                    if (m.parts.length === 0) {
                      return (
                        <div key={m.id} className="mr-auto max-w-[85%] rounded-2xl rounded-bl-[4px] border border-border/50 bg-muted/50 px-3.5 py-2.5 text-sm text-foreground">
                          {sending && <Loader2 className="size-3.5 animate-spin" />}
                        </div>
                      )
                    }
                    return (
                      <Fragment key={m.id}>
                        {m.parts.map((part, i) =>
                          part.type === 'text' ? (
                            part.text.trim() && (
                              <div key={i} className="mr-auto max-w-[85%] rounded-2xl rounded-bl-[4px] border border-border/50 bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                                <Streamdown className="copilot-markdown">{part.text}</Streamdown>
                              </div>
                            )
                          ) : (
                            <ToolResultCard key={i} name={part.name} output={part.output} />
                          )
                        )}
                      </Fragment>
                    )
                  })}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); void send(input) }}
              className="flex items-center gap-2 border-t border-border/50 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrire au copilote…"
                disabled={sending || Boolean(pendingConfirm)}
                className="h-9 flex-1 rounded-full border border-border bg-background/80 px-3.5 text-sm outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25"
              />
              <Button type="submit" size="icon" disabled={sending || !input.trim() || Boolean(pendingConfirm)} className="size-9 shrink-0" aria-label="Envoyer">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
