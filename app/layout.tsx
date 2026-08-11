import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono, Outfit, Figtree } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/app-shell/motion-provider'

// Self-hosted rather than next/font/google: on this Next.js version,
// next/font/google emits a corrupted `unicode-range` (literal "U+??") on
// the @font-face block that covers Basic Latin for Caprasimo, so the
// browser drops that face entirely and every plain-ASCII heading falls
// back to the system font. Confirmed via two independent HTTP clients
// against the compiled dev CSS. Local files below are the same "latin"
// subset Google's own CSS2 API serves for this exact family/weight
// request, just bypassing next/font/google's broken metadata generation.
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
    // Tells the browser this page manages both themes itself, so it stops
    // applying its own forced-dark heuristics (color inversion, native
    // control restyling) on top of the app's already-dark theme.
    'color-scheme': 'light dark',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <MotionProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
