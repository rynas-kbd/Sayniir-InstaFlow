import type { Metadata } from 'next'
import '@/components/landing/landing.css'
import { RevealScope } from '@/components/landing/reveal-scope'
import { I18nProvider } from '@/components/i18n-provider'
import { getLocale } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'Raddlly — Vendez dans vos DM pendant que vous dormez',
  description:
    'Une IA formée sur votre marque répond à chaque message avec votre voix, qualifie l\'acheteur et classe le lead dans votre CRM — sur Instagram, WhatsApp et Messenger.',
}

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <I18nProvider initialLocale={locale}>
      <div style={{ overflowX: 'clip' }}>
        <RevealScope>{children}</RevealScope>
      </div>
    </I18nProvider>
  )
}
