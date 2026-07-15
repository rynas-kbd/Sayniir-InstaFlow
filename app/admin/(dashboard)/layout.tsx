import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/admin-nav'

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pt-4 pb-3">
        <Link
          href="/admin"
          className="mb-5 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-semibold tracking-tight text-sidebar-foreground hover:bg-sidebar-accent/60"
        >
          Sayniir
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Admin</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-px">
          <AdminNav />
        </nav>

        <div className="my-2 h-px bg-sidebar-border" />

        <Link
          href="/dashboard"
          className="flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <ArrowLeft className="size-3.5 shrink-0" strokeWidth={1.75} />
          Mon dashboard
        </Link>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
