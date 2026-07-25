import type { Metadata } from 'next'
import '@/components/landing/landing.css'
import { RevealScope } from '@/components/landing/reveal-scope'

export const metadata: Metadata = {
  title: 'Instaflow — Sell in the DMs while you sleep',
  description:
    'An AI trained on your brand answers every message in your voice, qualifies the buyer, and files the lead in your CRM — across Instagram, WhatsApp and Messenger.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" style={{ overflowX: 'clip' }}>
      <RevealScope>{children}</RevealScope>
    </div>
  )
}
