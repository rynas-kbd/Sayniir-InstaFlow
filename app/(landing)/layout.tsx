import type { Metadata } from 'next'
import '@/components/landing/landing.css'
import { RevealScope } from '@/components/landing/reveal-scope'

export const metadata: Metadata = {
  title: 'Instaflow — Vendez dans vos DM pendant que vous dormez',
  description:
    'Une IA formée sur votre marque répond à chaque message avec votre voix, qualifie l\'acheteur et classe le lead dans votre CRM — sur Instagram, WhatsApp et Messenger.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Was `lang="en"`, overriding the root layout's `lang="fr"` for this entire
    // subtree — every screen reader and browser translate prompt treated the
    // (now fully French) landing page as English.
    <div lang="fr" style={{ overflowX: 'clip' }}>
      <RevealScope>{children}</RevealScope>
    </div>
  )
}
