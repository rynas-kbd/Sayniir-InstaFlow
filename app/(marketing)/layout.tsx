import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // dir="ltr": this page is French-only and untranslated, but the root
    // layout's inline script still flips <html dir> to "rtl" for any visitor
    // whose locale cookie is "ar" — without this override the French copy
    // here would render mirrored. See app/(landing)/layout.tsx for the same fix.
    <div dir="ltr" lang="fr" className="min-h-dvh bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
