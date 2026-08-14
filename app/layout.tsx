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
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var cookies=document.cookie.split('; ').reduce(function(acc,c){var p=c.split('=');acc[p[0]]=decodeURIComponent(p[1]||'');return acc},{});var theme=cookies['instaflow_color_theme']||'ocean';document.documentElement.setAttribute('data-color-theme', theme);var prim=cookies['instaflow_custom_primary']||'#3b82f6';var sec=cookies['instaflow_custom_secondary']||'#1d4ed8';document.documentElement.style.setProperty('--custom-primary-color', prim);document.documentElement.style.setProperty('--custom-secondary-color', sec);var locale=cookies['instaflow_locale']||'fr';document.documentElement.lang=locale;document.documentElement.dir=(locale==='ar')?'rtl':'ltr';}catch(e){} })();" }} />
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
