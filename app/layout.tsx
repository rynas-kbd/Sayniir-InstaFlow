import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono, Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { CustomThemeProvider } from '@/components/custom-theme-provider'
import { CustomBackground } from '@/components/custom-background'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/app-shell/motion-provider'


const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Raddlly',
  description: "Automatisation conversationnelle multi-canal pilotée par l'IA.",
  icons: {
    icon: '/raddlly-logo.png',
    apple: '/raddlly-logo.png',
  },
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
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){try{var cookies=document.cookie.split('; ').reduce(function(acc,c){var p=c.split('=');acc[p[0]]=decodeURIComponent(p[1]||'');return acc},{});var theme=cookies['Raddlly_color_theme']||'ocean';document.documentElement.setAttribute('data-color-theme', theme);var prim=cookies['Raddlly_custom_primary']||'#3b82f6';var sec=cookies['Raddlly_custom_secondary']||'#1d4ed8';document.documentElement.style.setProperty('--custom-primary-color', prim);document.documentElement.style.setProperty('--custom-secondary-color', sec);var locale=cookies['Raddlly_locale']||'fr';document.documentElement.lang=locale;document.documentElement.dir=(locale==='ar')?'rtl':'ltr';}catch(e){} })();",
          }}
          suppressHydrationWarning
        />
      </head>
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
