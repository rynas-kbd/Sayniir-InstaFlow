'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'

export function SignOutButton() {
  const t = useT()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="destructive" onClick={handleSignOut}>
      <LogOut className="size-4" /> {t('nav.userMenu.signOut')}
    </Button>
  )
}
