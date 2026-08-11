'use client'

import React from 'react'
import { useCustomTheme } from '@/components/custom-theme-provider'

export interface WallpaperOption {
  id: string
  name: string
  description: string
  previewUrl: string
  cssBackground: string
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  {
    id: 'none',
    name: 'Standard',
    description: 'Fond épuré d&apos;origine',
    previewUrl: '',
    cssBackground: 'transparent',
  },
  {
    id: 'aurora',
    name: 'Aurore Boréale',
    description: 'Dégradé fluide & vibrant',
    previewUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=80',
    cssBackground: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.35), transparent 45%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.25), transparent 50%)',
  },
  {
    id: 'cyber',
    name: 'Grille Cyber',
    description: 'Ondes néon & géométrie',
    previewUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80',
    cssBackground: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.4), transparent 75%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
  },
  {
    id: 'waves',
    name: 'Vagues Améthyste',
    description: 'Courbes organiques douces',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    cssBackground: 'radial-gradient(circle at 90% 10%, rgba(192, 38, 211, 0.35), transparent 50%), radial-gradient(circle at 10% 90%, rgba(245, 158, 11, 0.3), transparent 50%)',
  },
  {
    id: 'cosmic',
    name: 'Espace Cosmique',
    description: 'Nébuleuse & étoiles',
    previewUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
    cssBackground: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.4), transparent 60%), radial-gradient(circle at 10% 70%, rgba(14, 165, 233, 0.3), transparent 50%)',
  },
  {
    id: 'sunset',
    name: 'Coucher Doré',
    description: 'Lumière d&apos;or chaude',
    previewUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=400&q=80',
    cssBackground: 'radial-gradient(circle at 50% 100%, rgba(245, 158, 11, 0.4), transparent 60%), radial-gradient(circle at 80% 20%, rgba(225, 29, 72, 0.25), transparent 45%)',
  },
]

export function CustomBackground() {
  const { wallpaper, bgOpacity, customImageUrl } = useCustomTheme()

  if (wallpaper === 'none' && !customImageUrl) return null

  const preset = WALLPAPER_PRESETS.find((w) => w.id === wallpaper)
  const isCustom = wallpaper === 'custom' && customImageUrl

  const backgroundStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    opacity: bgOpacity / 100,
    transition: 'opacity 0.4s ease, background 0.4s ease',
  }

  if (isCustom) {
    backgroundStyle.backgroundImage = `url(${customImageUrl})`
    backgroundStyle.backgroundSize = 'cover'
    backgroundStyle.backgroundPosition = 'center'
    backgroundStyle.backgroundRepeat = 'no-repeat'
  } else if (preset) {
    if (preset.previewUrl && preset.id !== 'none') {
      backgroundStyle.backgroundImage = `${preset.cssBackground}, url(${preset.previewUrl})`
      backgroundStyle.backgroundSize = 'cover'
      backgroundStyle.backgroundPosition = 'center'
    } else {
      backgroundStyle.background = preset.cssBackground
    }
  }

  return <div style={backgroundStyle} className="background-wallpaper-overlay" />
}
