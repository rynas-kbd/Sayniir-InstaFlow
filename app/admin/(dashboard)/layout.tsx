import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
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
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
        <Link href="/admin" className="mb-8 flex items-center gap-3 px-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary">
            <ShieldCheck className="size-4 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[15px] font-extrabold leading-none tracking-tight text-foreground">Sayniir</span>
            <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              Admin
            </span>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <AdminNav />
        </nav>

        <div className="my-3 h-px bg-border" />

        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Mon dashboard
        </Link>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
