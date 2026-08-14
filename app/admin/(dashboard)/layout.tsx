import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/admin-nav'
import { I18nProvider } from '@/components/i18n-provider'
import { getLocale, getT } from '@/lib/i18n/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const locale = await getLocale()
  const t = await getT()

  return (
    <I18nProvider initialLocale={locale}>
      <div className="app-shell-root flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
        {/* Below md: the 232px fixed sidebar left ~140px for content on a 375px
            viewport, and a 6-column table inside that. Only 2 nav items exist
            today (see AdminNav), so a horizontal top bar covers it without a
            drawer/sheet component. */}
        <div className="flex items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-3 py-2 md:hidden">
          <Link href="/admin" className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-sidebar-foreground">
            Instaflow
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t('admin.layout.badge')}</span>
          </Link>
          <nav className="flex items-center gap-1">
            <AdminNav />
          </nav>
          <Link href="/dashboard" className="flex items-center gap-1 text-[12px] text-sidebar-foreground/65" aria-label={t('admin.layout.backToDashboardAria')}>
            <ArrowLeft className="size-3.5 shrink-0 rtl:-scale-x-100" strokeWidth={1.75} />
          </Link>
        </div>

        <aside className="hidden w-[232px] shrink-0 flex-col border-e border-sidebar-border bg-sidebar px-3 pt-4 pb-3 md:flex">
          <Link
            href="/admin"
            className="mb-5 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-semibold tracking-tight text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            Instaflow
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t('admin.layout.badge')}</span>
          </Link>

          <nav className="flex flex-1 flex-col gap-px">
            <AdminNav />
          </nav>

          <div className="my-2 h-px bg-sidebar-border" />

          <Link
            href="/dashboard"
            className="flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-3.5 shrink-0 rtl:-scale-x-100" strokeWidth={1.75} />
            {t('admin.layout.backToDashboard')}
          </Link>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto min-h-0">{children}</main>
      </div>
    </I18nProvider>
  )
}
