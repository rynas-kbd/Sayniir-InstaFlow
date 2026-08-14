import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { getT } from '@/lib/i18n/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { ContactTable } from '@/components/contacts/contact-table'
import { ManageTagsDialog } from '@/components/contacts/manage-tags-dialog'
import { ContactsCsvActions } from '@/components/contacts/contacts-csv-actions'
import type { Contact, Tag } from '@/components/contacts/types'

export default async function ContactsPage() {
  const supabase = await createClient()
  const t = await getT()
  const { active: account } = await resolveActiveAccount()

  if (!account) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader title={t('contacts.pageTitle')} description={t('contacts.pageDescription')} />
        <NoAccountState description={t('contacts.noAccount')} />
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
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t('contacts.pageTitle')}
        description={t.plural('contacts.count', contacts?.length ?? 0)}
        actions={
          <div className="flex items-center gap-1.5">
            <ContactsCsvActions channelAccountId={account.id} />
            <ManageTagsDialog channelAccountId={account.id} tags={(tags ?? []) as Tag[]} />
          </div>
        }
      />
      <div className="flex-1 p-4 sm:p-6">
        <ContactTable channelAccountId={account.id} initialContacts={(contacts ?? []) as Contact[]} tags={(tags ?? []) as Tag[]} />
      </div>
    </div>
  )
}
