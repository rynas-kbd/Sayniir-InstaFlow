import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'
import { createUser } from './actions'

export default async function NewClientPage() {
  const t = await getT()

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('admin.clients.new.title')} description={t('admin.clients.new.description')} />
      <div className="p-4 sm:p-6">
        <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {t('admin.clients.new.backLink')}
        </Link>

        <Card>
          <CardContent className="pt-6">
            <form
              action={async (formData: FormData) => {
                'use server'
                await createUser({
                  full_name: formData.get('full_name') as string,
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
                  role: formData.get('role') as 'client' | 'admin',
                })
              }}
              className="flex flex-col gap-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="full_name">{t('admin.clients.new.fullNameLabel')}</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('admin.clients.new.emailLabel')}</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('admin.clients.new.passwordLabel')}</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.clients.new.roleLabel')}</Label>
                <Select name="role" defaultValue="client">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">{t('admin.clients.new.roleClientOption')}</SelectItem>
                    <SelectItem value="admin">{t('admin.clients.new.roleAdminOption')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="mt-1">
                {t('admin.clients.new.submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
