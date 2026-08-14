/**
 * Browser cookie helpers shared by every client-side preference store
 * (theme, wallpaper, locale…). Preferences in this app deliberately live in
 * a cookie + Supabase `user_metadata`, never `localStorage` — see
 * `components/custom-theme-provider.tsx` for the precedent this mirrors.
 */

export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const matches = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)
  )
  return matches ? decodeURIComponent(matches[1]) : null
}
