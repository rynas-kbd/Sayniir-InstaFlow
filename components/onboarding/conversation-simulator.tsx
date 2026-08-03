'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Celebration } from '@/components/onboarding/celebration'

interface SimulatedMessage {
  from: 'user' | 'bot'
  text: string
}

const PLATFORM_GRADIENT: Record<string, string> = {
  instagram: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
  whatsapp: 'bg-[#25D366]',
  messenger: 'bg-[#00B2FF]',
}

const SUGGESTIONS = ['Bonjour', 'Salut, vous vendez quoi ?', 'Combien ça coûte ?']

/**
 * The onboarding "moment aha": types a message, it runs through the real
 * inbound pipeline in a sandbox (see lib/channels/sandbox.ts and
 * app/api/onboarding/simulate/route.ts), and the reply comes back exactly
 * as a real contact would see it — without ever touching Meta or leaving
 * a row in message_logs/contacts/flow_runs.
 */
export function ConversationSimulator({
  platform,
  onActivated,
}: {
  platform: 'instagram' | 'whatsapp' | 'messenger' | null
  onActivated: () => void
}) {
  const [messages, setMessages] = useState<SimulatedMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)

  const gradient = platform ? PLATFORM_GRADIENT[platform] : 'bg-primary'

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setMessages((prev) => [...prev, { from: 'user', text: trimmed }])
    setInput('')
    setHint(null)
    setSending(true)

    try {
      const res = await fetch('/api/onboarding/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setHint(data.error ?? 'Une erreur est survenue.')
        return
      }

      const replies: Array<{ text: string }> = data.messages ?? []
      if (replies.length === 0) {
        setHint(data.hint ?? null)
        return
      }

      setMessages((prev) => [...prev, ...replies.map((m) => ({ from: 'bot' as const, text: m.text }))])

      const completeRes = await fetch('/api/onboarding/complete', { method: 'PATCH' })
      if (completeRes.ok) {
        setCelebrating(true)
        setTimeout(onActivated, 2200)
      }
    } catch {
      setHint('Impossible de contacter le serveur — réessayez.')
    } finally {
      setSending(false)
    }
  }

  if (celebrating) return <Celebration />

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
      <div className="mb-3 flex min-h-[64px] flex-col gap-2.5 px-1">
        {messages.length === 0 && (
          <p className="py-2 text-center text-[11.5px] text-muted-foreground">
            Écrivez comme le ferait un vrai client — l&apos;automatisation active répondra en direct.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex items-end gap-2', m.from === 'user' ? 'flex-row-reverse self-end' : 'self-start')}
            >
              {m.from === 'bot' && (
                <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white', gradient)}>
                  {platform ? platform[0].toUpperCase() : 'A'}
                </div>
              )}
              {m.from === 'user' && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <User className="size-3" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-[14px] px-3 py-2 text-xs leading-relaxed',
                  m.from === 'user'
                    ? 'rounded-br-[3px] bg-primary/10 text-foreground'
                    : 'rounded-bl-[3px] border border-border/50 bg-muted/50 text-foreground'
                )}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <div className="flex items-center gap-1.5 self-start px-1 text-[11px] text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
            en train de répondre…
          </div>
        )}
      </div>

      {hint && <p className="mb-2 rounded-md bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">{hint}</p>}

      {messages.length === 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez un message…"
          disabled={sending}
          maxLength={500}
          className="h-9 text-xs"
        />
        <Button type="submit" size="icon-sm" disabled={sending || !input.trim()} className="h-9 w-9 shrink-0" aria-label="Envoyer">
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  )
}
