import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateRulePageForm } from '@/components/automation/create-rule-page-form'

export default async function NewAutomationRulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_name, phone_number, platform')
    .eq('user_id', user!.id)

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Nouvelle règle" description="Réponse automatique par mot-clé, DM ou commentaire." />
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <Link href="/automation" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Retour aux règles
          </Link>
          <CreateRulePageForm accounts={accounts ?? []} />
        </div>
      </div>
    </div>
  )
}
