import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Shell for /welcome — same aurora-gradient centered-card treatment as
 * app/(auth)/layout.tsx, wider (questionnaire needs more room than a
 * login form), and gated the opposite way: unauthenticated users bounce
 * to /login instead of /dashboard.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/8 via-background to-background px-6 py-12">
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-[560px]">{children}</div>
    </main>
  )
}
