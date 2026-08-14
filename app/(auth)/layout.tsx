import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/components/i18n-provider'
import { getLocale } from '@/lib/i18n/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If the user already has a valid session, skip auth pages entirely
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const locale = await getLocale()

  return (
    <I18nProvider initialLocale={locale}>
      <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/8 via-background to-background px-6 py-12">
        <div className="pointer-events-none absolute -top-24 -start-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -end-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative w-full max-w-[400px]">{children}</div>
      </main>
    </I18nProvider>
  )
}
