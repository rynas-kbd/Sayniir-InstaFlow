'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Palette, Sun, Moon, Monitor, Check, Image as ImageIcon, Sliders, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { COLOR_THEMES, useCustomTheme, type ColorTheme, type WallpaperId } from '@/components/custom-theme-provider'
import { WALLPAPER_PRESETS } from '@/components/custom-background'
import { LanguagePicker } from '@/components/settings/language-picker'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

export function AppearanceCard() {
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" strokeWidth={1.75} />
          <div>
            <CardTitle className="text-sm">{t('appearance.cardTitle')}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">{t('appearance.cardDescription')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language */}
        <LanguagePicker />

        {/* Mode switch */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-foreground/80">{t('appearance.displayMode')}</label>
          <div className="grid grid-cols-3 gap-2.5">
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
                  'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-all duration-150 active:scale-95',
                  theme === id
                    ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-foreground/80">{t('appearance.colorPalette')}</label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {COLOR_THEMES.map((opt) => {
              const isSelected = colorTheme === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColorTheme(opt.id as ColorTheme)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border p-3 text-start transition-all duration-150 active:scale-[0.98]',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-7 items-center justify-center rounded-xl shadow-xs"
                      style={{ background: opt.gradient }}
                    >
                      {isSelected && <Check className="size-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t(`appearance.themes.${opt.id}.name`)}</p>
                      <p className="text-[11px] text-muted-foreground">{t(`appearance.themes.${opt.id}.description`)}</p>
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

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {WALLPAPER_PRESETS.map((preset) => {
              const isSelected = wallpaper === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setWallpaper(preset.id as WallpaperId)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all duration-200 active:scale-95',
                    isSelected
                      ? 'border-primary bg-primary/15 font-semibold text-foreground shadow-xs'
                      : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  )}
                >
                  {isSelected && (
                    <span className="absolute end-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  )}
                  <span className="text-xs">{t(`appearance.wallpapers.${preset.id}`)}</span>
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setWallpaper('custom')}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all duration-200 active:scale-95',
                wallpaper === 'custom'
                  ? 'border-primary bg-primary/15 font-semibold text-foreground shadow-xs'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
              )}
            >
              {wallpaper === 'custom' && (
                <span className="absolute end-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
              <span className="text-xs">{t('appearance.wallpaperImageUrlTile')}</span>
            </button>
          </div>

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
            <div className="mb-2 flex items-center justify-between">
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
                    'flex-1 rounded-xl border py-2 text-xs font-medium transition-all duration-150',
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
      </CardContent>
    </Card>
  )
}
