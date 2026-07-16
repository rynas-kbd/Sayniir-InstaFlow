import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import type { BusinessType } from '@/components/app-shell/nav-config'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_type')
    .eq('id', user.id)
    .single()

  const businessType = (profile?.business_type as BusinessType | undefined) ?? 'ecommerce'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar businessType={businessType} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar businessType={businessType} email={user.email ?? null} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
