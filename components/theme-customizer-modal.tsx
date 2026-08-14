'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Check, Moon, Palette, Sun, Monitor, Sparkles, Image as ImageIcon, Sliders, Link as LinkIcon } from 'lucide-react'
import { COLOR_THEMES, useCustomTheme, type ColorTheme, type WallpaperId } from '@/components/custom-theme-provider'
import { WALLPAPER_PRESETS } from '@/components/custom-background'
import { LanguagePicker } from '@/components/settings/language-picker'
import { useT } from '@/components/i18n-provider'
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
  const t = useT()
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
    customPrimaryColor,
    setCustomPrimaryColor,
    customSecondaryColor,
    setCustomSecondaryColor,
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
              <DialogTitle className="text-base font-bold">{t('appearance.cardTitle')}</DialogTitle>
              <DialogDescription className="text-xs">{t('appearance.modalDescription')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Language */}
          <LanguagePicker />

          {/* Mode Selection */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground/80">{t('appearance.displayMode')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: t('appearance.light'), icon: Sun },
                { id: 'dark', label: t('appearance.dark'), icon: Moon },
                { id: 'system', label: t('appearance.system'), icon: Monitor },
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
            <label className="mb-2 block text-xs font-semibold text-foreground/80">{t('appearance.colorPalette')}</label>
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
                      <div className="text-start">
                        <p className={cn('text-xs font-semibold', isSelected ? 'text-foreground' : 'text-foreground/90')}>
                          {t(`appearance.themes.${item.id}.name`)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {colorTheme === 'custom' && (
              <div className="mt-4 space-y-4 rounded-2xl border border-border/50 bg-muted/10 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  {/* Primary Color Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('appearance.primaryColor')}
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2">
                      <div
                        className="relative size-7 shrink-0 rounded-lg shadow-sm border border-black/10 overflow-hidden cursor-pointer"
                        style={{ backgroundColor: customPrimaryColor }}
                      >
                        <input
                          type="color"
                          value={customPrimaryColor}
                          onChange={(e) => setCustomPrimaryColor(e.target.value)}
                          className="absolute inset-0 size-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold uppercase">{customPrimaryColor}</span>
                    </div>
                  </div>

                  {/* Secondary Color Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('appearance.secondaryColor')}
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2">
                      <div
                        className="relative size-7 shrink-0 rounded-lg shadow-sm border border-black/10 overflow-hidden cursor-pointer"
                        style={{ backgroundColor: customSecondaryColor }}
                      >
                        <input
                          type="color"
                          value={customSecondaryColor}
                          onChange={(e) => setCustomSecondaryColor(e.target.value)}
                          className="absolute inset-0 size-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold uppercase">{customSecondaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wallpaper Selection */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                <ImageIcon className="size-3.5 text-primary" />
                {t('appearance.wallpaper')}
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
                      <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-[11.5px]">{t(`appearance.wallpapers.${preset.id}`)}</span>
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
                  <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
                <span className="text-[11.5px]">{t('appearance.wallpaperImageUrlTile')}</span>
              </button>
            </div>

            {/* Custom Image URL Field */}
            {wallpaper === 'custom' && (
              <div className="mt-3 space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <LinkIcon className="size-3" /> {t('appearance.customImageUrlLabel')}
                </label>
                <Input
                  type="url"
                  placeholder={t('appearance.customImageUrlPlaceholder')}
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
                  {t('appearance.opacity', { value: bgOpacity })}
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
              <span>{t('appearance.livePreview')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-xl font-medium">
                {t('appearance.previewButton')}
              </Button>
              <div className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {t('appearance.previewBadge')}
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
            {t('appearance.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
