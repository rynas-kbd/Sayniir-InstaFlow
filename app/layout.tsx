import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono, Outfit, Figtree } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { CustomThemeProvider } from '@/components/custom-theme-provider'
import { CustomBackground } from '@/components/custom-background'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/app-shell/motion-provider'

const caprasimo = localFont({
  src: './fonts/caprasimo-400.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-caprasimo',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Instaflow',
  description: "Automatisation conversationnelle multi-canal pilotée par l'IA.",
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'color-scheme': 'light dark',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5ead8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1714' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${caprasimo.variable} ${outfit.variable} ${figtree.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider>
            <CustomBackground />
            <MotionProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </MotionProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
