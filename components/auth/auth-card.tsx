import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function AuthCard({
  tagline,
  children,
}: {
  tagline: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-3">
        <div className="mb-8 text-center">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">Sayniir</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{tagline}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.2-5.5l-6.5-5.5C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.1-2.2 4-4 5.5l6.5 5.5C43.1 35.4 44 30 44 24c0-1.3-.1-2.7-.4-3.9z"
      />
    </svg>
  )
}
