import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { ContactTable } from '@/components/contacts/contact-table'
import { ManageTagsDialog } from '@/components/contacts/manage-tags-dialog'
import type { Contact, Tag } from '@/components/contacts/types'

export default async function ContactsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: true })

  const account = accounts?.[0]

  if (!account) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Contacts" description="Votre CRM : contacts, tags et historique." />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Users className="size-8 text-muted-foreground/50" strokeWidth={1} />
          <p className="text-sm font-medium text-foreground">Aucun compte connecté</p>
          <p className="max-w-sm text-sm text-muted-foreground">Connectez un compte pour commencer à recevoir des contacts.</p>
        </div>
      </div>
    )
  }

  const [{ data: contacts }, { data: tags }] = await Promise.all([
    supabase
      .from('contacts')
      .select('*, contact_tags(tag_id, tags(id, name, color))')
      .eq('channel_account_id', account.id)
      .order('last_inbound_at', { ascending: false, nullsFirst: false }),
    supabase.from('tags').select('*').eq('channel_account_id', account.id).order('name'),
  ])

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Contacts"
        description={`${contacts?.length ?? 0} contact${(contacts?.length ?? 0) !== 1 ? 's' : ''}`}
        actions={<ManageTagsDialog channelAccountId={account.id} tags={(tags ?? []) as Tag[]} />}
      />
      <div className="p-4 sm:p-6">
        <ContactTable channelAccountId={account.id} initialContacts={(contacts ?? []) as Contact[]} tags={(tags ?? []) as Tag[]} />
      </div>
    </div>
  )
}
