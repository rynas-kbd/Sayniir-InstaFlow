'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CopilotPanel } from './copilot-panel'
import { CopilotFAB } from './copilot-fab'
import type { AiContext } from '@/lib/ai/context/types'

interface CopilotContextValue {
  /** Opens the panel, optionally sending `prompt` immediately (used by the command menu's Actions fallback). */
  openCopilot: (prompt?: string) => void
}

const CopilotContext = createContext<CopilotContextValue | null>(null)

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext)
  if (!ctx) throw new Error('useCopilot must be used within CopilotProvider')
  return ctx
}

export function CopilotProvider({
  channelAccountId,
  children,
}: {
  channelAccountId: string | null
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>()

  const openCopilot = useCallback((prompt?: string) => {
    setPendingPrompt(prompt)
    setOpen(true)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Support both Ctrl+I and Ctrl+K
      if ((e.key === 'i' || e.key === 'k') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const pathname = usePathname()
  // Hide the FAB on mobile on the flow builder — it clashes with the canvas
  // "+" button and the node palette. On desktop it stays visible at all times.
  const hideOnMobile = pathname?.includes('/flows/') ?? false

  return (
    <CopilotContext.Provider value={{ openCopilot }}>
      {children}
      {channelAccountId && (
        <>
          {!open && (
            <CopilotFAB
              onClick={() => setOpen((prev) => !prev)}
              hideOnMobile={hideOnMobile}
            />
          )}
          <CopilotPanel
            channelAccountId={channelAccountId}
            open={open}
            onOpenChange={setOpen}
            initialMessage={pendingPrompt}
            onInitialMessageSent={() => setPendingPrompt(undefined)}
          />
        </>
      )}
    </CopilotContext.Provider>
  )
}

export type { AiContext }
