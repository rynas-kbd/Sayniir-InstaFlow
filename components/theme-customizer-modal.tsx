'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Check, Moon, Palette, Sun, Monitor, Sparkles, Image as ImageIcon, Sliders, Link as LinkIcon } from 'lucide-react'
import { COLOR_THEMES, useCustomTheme, type ColorTheme, type WallpaperId } from '@/components/custom-theme-provider'
import { WALLPAPER_PRESETS } from '@/components/custom-background'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function ThemeCustomizerModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { theme, setTheme } = useTheme()
  const {
    colorTheme,
    setColorTheme,
    wallpaper,
    setWallpaper,
    bgOpacity,
    setBgOpacity,
    customImageUrl,
    setCustomImageUrl,
  } = useCustomTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-sm"
              style={{
                background: 'linear-gradient(135deg, var(--organic-terracotta), var(--organic-terracotta-700))',
              }}
            >
              <Palette className="size-4" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Personnalisation de l&apos;interface</DialogTitle>
              <DialogDescription className="text-xs">
                Sélectionnez votre mode, palette et fond d&apos;écran personnalisé.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground/80">
              Mode d&apos;affichage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Clair', icon: Sun },
                { id: 'dark', label: 'Sombre', icon: Moon },
                { id: 'system', label: 'Système', icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-all duration-200 active:scale-95',
                    theme === id
                      ? 'border-primary bg-primary/10 text-foreground shadow-xs'
                      : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Selection */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground/80">
              Palette de couleurs
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COLOR_THEMES.map((item) => {
                const isSelected = colorTheme === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setColorTheme(item.id as ColorTheme)}
                    className={cn(
                      'group flex items-center justify-between rounded-2xl border p-2.5 transition-all duration-200 active:scale-[0.98]',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="relative flex size-6 shrink-0 items-center justify-center rounded-xl shadow-xs"
                        style={{ background: item.gradient }}
                      >
                        {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="text-left">
                        <p className={cn('text-xs font-semibold', isSelected ? 'text-foreground' : 'text-foreground/90')}>
                          {item.name}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wallpaper Selection */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                <ImageIcon className="size-3.5 text-primary" />
                Image / Fond d&apos;écran
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected = wallpaper === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setWallpaper(preset.id as WallpaperId)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border p-2.5 text-center transition-all duration-200 active:scale-95',
                      isSelected
                        ? 'border-primary bg-primary/15 font-semibold text-foreground shadow-xs'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-[11.5px]">{preset.name}</span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setWallpaper('custom')}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 rounded-2xl border p-2.5 text-center transition-all duration-200 active:scale-95',
                  wallpaper === 'custom'
                    ? 'border-primary bg-primary/15 font-semibold text-foreground shadow-xs'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                )}
              >
                {wallpaper === 'custom' && (
                  <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
                <span className="text-[11.5px]">Image URL</span>
              </button>
            </div>

            {/* Custom Image URL Field */}
            {wallpaper === 'custom' && (
              <div className="mt-3 space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <LinkIcon className="size-3" /> URL de l&apos;image de fond
                </label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* Opacity Control */}
          {wallpaper !== 'none' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                  <Sliders className="size-3.5 text-primary" />
                  Opacité du fond ({bgOpacity}%)
                </label>
              </div>
              <div className="flex items-center gap-2">
                {[15, 30, 50, 75, 90].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBgOpacity(val)}
                    className={cn(
                      'flex-1 rounded-xl border py-1.5 text-xs font-medium transition-all duration-150',
                      bgOpacity === val
                        ? 'border-primary bg-primary text-primary-foreground font-semibold'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    )}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Component Preview */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              <span>Aperçu en direct</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-xl font-medium">
                Bouton Principal
              </Button>
              <div className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                Badge actif
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-medium"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
