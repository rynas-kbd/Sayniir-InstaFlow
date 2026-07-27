'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Loader2, ShieldAlert } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ProgressIndicator, ThinkingIndicator } from './progress-indicator'
import { cn } from '@/lib/utils'
import type { AiStreamEvent } from '@/lib/ai/types'
import type { AiContext } from '@/lib/ai/context/types'

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface PendingConfirm {
  id: string
  name: string
  preview: string
}

async function readNdjsonStream(res: Response, onEvent: (event: AiStreamEvent) => void): Promise<void> {
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
      onEvent(JSON.parse(line) as AiStreamEvent)
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
    setMessages((prev) => [...prev, { id, role: 'assistant', text: '' }])
    return id
  }

  function applyEvent(event: AiStreamEvent, assistantId: string) {
    if (event.t === 'text') {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + event.delta } : m)))
      // Clear progress indicators when text starts streaming
      setProgressStep(null)
      setIsThinking(false)
    } else if (event.t === 'error') {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text || event.message } : m)))
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
    // tool_start / tool_result stay silent for read/write_reversible tools by design (§1.2); credits update the settings-page meter on next load.
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
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text || 'Une erreur est survenue.' } : m)))
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
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: 'Action annulée.' }])
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
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text || 'Une erreur est survenue.' } : m)))
    } finally {
      setConfirming(false)
      setProgressStep(null)
      setIsThinking(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" /> Copilote
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Demandez-moi de diagnostiquer un flow, chercher un contact, ou résumer votre activité récente.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('rounded-lg px-3 py-2 text-sm text-foreground', m.role === 'user' ? 'ml-8 bg-primary/10' : 'mr-8 bg-muted')}
                >
                  {m.text || (sending && m.role === 'assistant' ? <Loader2 className="size-3.5 animate-spin" /> : '')}
                </div>
              ))}

              {/* Progress indicator - shown when a tool is being executed */}
              {progressStep && (
                <div className="mr-8">
                  <ProgressIndicator step={progressStep.step} detail={progressStep.detail} />
                </div>
              )}

              {/* Thinking indicator - shown when waiting for LLM response */}
              {isThinking && !progressStep && (
                <div className="mr-8">
                  <ThinkingIndicator />
                </div>
              )}

              {pendingConfirm && (
                <div className="mr-8 rounded-lg border border-primary/30 bg-card p-3 shadow-sm ring-1 ring-primary/20">
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
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrire au copilote…"
            disabled={sending || Boolean(pendingConfirm)}
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim() || Boolean(pendingConfirm)}
            className="size-9 shrink-0"
            aria-label="Envoyer"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
