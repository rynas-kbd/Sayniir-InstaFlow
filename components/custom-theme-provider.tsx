'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCookie, setCookie } from '@/lib/cookies'

export type ColorTheme = 'terracotta' | 'ocean' | 'emerald' | 'sunset' | 'midnight' | 'custom'
export type WallpaperId = 'none' | 'aurora' | 'cyber' | 'waves' | 'cosmic' | 'sunset' | 'custom'

export interface ColorThemeOption {
  id: ColorTheme
  name: string
  description: string
  primaryColor: string
  gradient: string
  darkGradient: string
  previewBorder: string
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: 'ocean',
    name: 'Océan Cyber',
    description: 'Bleu cobalt & indigo vibrant',
    primaryColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    darkGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    previewBorder: '#3b82f6',
  },
  {
    id: 'terracotta',
    name: 'Ardoise',
    description: 'Sobre & épuré (gris neutre)',
    primaryColor: '#27272a',
    gradient: 'linear-gradient(135deg, #52525b 0%, #27272a 100%)',
    darkGradient: 'linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 100%)',
    previewBorder: '#27272a',
  },
  {
    id: 'emerald',
    name: 'Émeraude',
    description: 'Vert forêt & sauge rafraîchissant',
    primaryColor: '#10b981',
    gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    darkGradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    previewBorder: '#10b981',
  },
  {
    id: 'sunset',
    name: 'Coucher de soleil',
    description: 'Rose vibrant & améthyste',
    primaryColor: '#ec4899',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #d946ef 100%)',
    darkGradient: 'linear-gradient(135deg, #ec4899 0%, #c026d3 100%)',
    previewBorder: '#ec4899',
  },
  {
    id: 'midnight',
    name: 'Minuit Doré',
    description: 'Ambre chaud & onyx élégant',
    primaryColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    darkGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    previewBorder: '#f59e0b',
  },
  {
    id: 'custom',
    name: 'Personnalisé',
    description: 'Vos couleurs sur mesure',
    primaryColor: '#c67139',
    gradient: 'linear-gradient(135deg, var(--custom-primary-color, #c67139) 0%, var(--custom-primary-color, #c67139) 100%)',
    darkGradient: 'linear-gradient(135deg, var(--custom-primary-color, #c67139) 0%, var(--custom-primary-color, #c67139) 100%)',
    previewBorder: 'var(--custom-primary-color, #c67139)',
  },
]

interface CustomThemeContextType {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  wallpaper: WallpaperId
  setWallpaper: (wallpaper: WallpaperId) => void
  bgOpacity: number
  setBgOpacity: (opacity: number) => void
  customImageUrl: string
  setCustomImageUrl: (url: string) => void
  customPrimaryColor: string
  setCustomPrimaryColor: (color: string) => void
  customSecondaryColor: string
  setCustomSecondaryColor: (color: string) => void
  savePreferences: (updates: {
    colorTheme?: ColorTheme
    wallpaper?: WallpaperId
    bgOpacity?: number
    customImageUrl?: string
    customPrimaryColor?: string
    customSecondaryColor?: string
  }) => Promise<void>
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined)

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('ocean')
  const [wallpaper, setWallpaperState] = useState<WallpaperId>('none')
  const [bgOpacity, setBgOpacityState] = useState<number>(40)
  const [customImageUrl, setCustomImageUrlState] = useState<string>('')
  const [customPrimaryColor, setCustomPrimaryColorState] = useState<string>('#3b82f6')
  const [customSecondaryColor, setCustomSecondaryColorState] = useState<string>('#1d4ed8')
  const [mounted, setMounted] = useState(false)

  const applyColorThemeToDOM = (themeName: ColorTheme) => {
    document.documentElement.setAttribute('data-color-theme', themeName)
  }

  const applyCustomColors = (primary: string, secondary: string) => {
    if (typeof document === 'undefined') return
    document.documentElement.style.setProperty('--custom-primary-color', primary)
    document.documentElement.style.setProperty('--custom-secondary-color', secondary)
  }

  // Load preferences from Supabase User Metadata or cookie on mount (NO localStorage)
  useEffect(() => {
    const supabase = createClient()

    async function loadTheme() {
      // Check cookie fallback first for rapid SSR feel
      const cookieTheme = getCookie('Raddlly_color_theme') as ColorTheme | null
      const cookieWallpaper = getCookie('Raddlly_wallpaper') as WallpaperId | null
      const cookieOpacity = getCookie('Raddlly_bg_opacity')
      const cookieImg = getCookie('Raddlly_custom_bg_url')
      const cookiePrimary = getCookie('Raddlly_custom_primary')
      const cookieSecondary = getCookie('Raddlly_custom_secondary')

      let activePrimary = '#3b82f6'
      let activeSecondary = '#1d4ed8'

      if (cookieTheme && COLOR_THEMES.some((t) => t.id === cookieTheme)) {
        setColorThemeState(cookieTheme)
        applyColorThemeToDOM(cookieTheme)
      }
      if (cookieWallpaper) setWallpaperState(cookieWallpaper)
      if (cookieOpacity) setBgOpacityState(Number(cookieOpacity))
      if (cookieImg) setCustomImageUrlState(cookieImg)
      if (cookiePrimary) {
        setCustomPrimaryColorState(cookiePrimary)
        activePrimary = cookiePrimary
      }
      if (cookieSecondary) {
        setCustomSecondaryColorState(cookieSecondary)
        activeSecondary = cookieSecondary
      }

      applyCustomColors(activePrimary, activeSecondary)

      // Fetch official preferences from Supabase user session
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.theme_preferences) {
        const pref = user.user_metadata.theme_preferences
        if (pref.colorTheme) {
          setColorThemeState(pref.colorTheme)
          applyColorThemeToDOM(pref.colorTheme)
          setCookie('Raddlly_color_theme', pref.colorTheme)
        }
        if (pref.wallpaper) {
          setWallpaperState(pref.wallpaper)
          setCookie('Raddlly_wallpaper', pref.wallpaper)
        }
        if (typeof pref.bgOpacity === 'number') {
          setBgOpacityState(pref.bgOpacity)
          setCookie('Raddlly_bg_opacity', String(pref.bgOpacity))
        }
        if (pref.customImageUrl !== undefined) {
          setCustomImageUrlState(pref.customImageUrl)
          setCookie('Raddlly_custom_bg_url', pref.customImageUrl)
        }
        if (pref.customPrimaryColor) {
          setCustomPrimaryColorState(pref.customPrimaryColor)
          activePrimary = pref.customPrimaryColor
          setCookie('Raddlly_custom_primary', pref.customPrimaryColor)
        }
        if (pref.customSecondaryColor) {
          setCustomSecondaryColorState(pref.customSecondaryColor)
          activeSecondary = pref.customSecondaryColor
          setCookie('Raddlly_custom_secondary', pref.customSecondaryColor)
        }
        applyCustomColors(activePrimary, activeSecondary)
      }
      setMounted(true)
    }

    loadTheme()
  }, [])

  const savePreferences = async (updates: {
    colorTheme?: ColorTheme
    wallpaper?: WallpaperId
    bgOpacity?: number
    customImageUrl?: string
    customPrimaryColor?: string
    customSecondaryColor?: string
  }) => {
    const nextColorTheme = updates.colorTheme ?? colorTheme
    const nextWallpaper = updates.wallpaper ?? wallpaper
    const nextBgOpacity = updates.bgOpacity ?? bgOpacity
    const nextCustomImageUrl = updates.customImageUrl !== undefined ? updates.customImageUrl : customImageUrl
    const nextCustomPrimary = updates.customPrimaryColor ?? customPrimaryColor
    const nextCustomSecondary = updates.customSecondaryColor ?? customSecondaryColor

    setColorThemeState(nextColorTheme)
    setWallpaperState(nextWallpaper)
    setBgOpacityState(nextBgOpacity)
    setCustomImageUrlState(nextCustomImageUrl)
    setCustomPrimaryColorState(nextCustomPrimary)
    setCustomSecondaryColorState(nextCustomSecondary)

    applyColorThemeToDOM(nextColorTheme)
    applyCustomColors(nextCustomPrimary, nextCustomSecondary)

    // Save to Cookies
    setCookie('Raddlly_color_theme', nextColorTheme)
    setCookie('Raddlly_wallpaper', nextWallpaper)
    setCookie('Raddlly_bg_opacity', String(nextBgOpacity))
    setCookie('Raddlly_custom_bg_url', nextCustomImageUrl)
    setCookie('Raddlly_custom_primary', nextCustomPrimary)
    setCookie('Raddlly_custom_secondary', nextCustomSecondary)

    // Save to Supabase User Metadata (persisted across devices & sessions without localStorage)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const existing = user.user_metadata?.theme_preferences || {}
      await supabase.auth.updateUser({
        data: {
          theme_preferences: {
            ...existing,
            colorTheme: nextColorTheme,
            wallpaper: nextWallpaper,
            bgOpacity: nextBgOpacity,
            customImageUrl: nextCustomImageUrl,
            customPrimaryColor: nextCustomPrimary,
            customSecondaryColor: nextCustomSecondary,
          },
        },
      })
    }
  }

  const setColorTheme = (t: ColorTheme) => savePreferences({ colorTheme: t })
  const setWallpaper = (w: WallpaperId) => savePreferences({ wallpaper: w })
  const setBgOpacity = (o: number) => savePreferences({ bgOpacity: o })
  const setCustomImageUrl = (url: string) => savePreferences({ customImageUrl: url })
  const setCustomPrimaryColor = (color: string) => savePreferences({ customPrimaryColor: color })
  const setCustomSecondaryColor = (color: string) => savePreferences({ customSecondaryColor: color })

  return (
    <CustomThemeContext.Provider
      value={{
        colorTheme: mounted ? colorTheme : 'ocean',
        setColorTheme,
        wallpaper,
        setWallpaper,
        bgOpacity,
        setBgOpacity,
        customImageUrl,
        setCustomImageUrl,
        customPrimaryColor,
        setCustomPrimaryColor,
        customSecondaryColor,
        setCustomSecondaryColor,
        savePreferences,
      }}
    >
      {children}
    </CustomThemeContext.Provider>
  )
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext)
  if (!context) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider')
  }
  return context
}
