import { I18nProvider } from '@/components/i18n-provider'
import { getLocale } from '@/lib/i18n/server'

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return <I18nProvider initialLocale={locale}>{children}</I18nProvider>
}
