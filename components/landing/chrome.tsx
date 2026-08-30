'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { useLocale, useSetLocale } from '@/components/i18n-provider'
import type { Locale } from '@/lib/i18n/config'
import { RaddllyLogo } from '@/components/raddlly-logo'

const NAV_LINKS = [
  { href: '#product', label: 'Produit' },
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'ar', label: 'AR', flag: '🇩🇿' },
  ]

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-full border text-[11px] font-extrabold"
      style={{
        borderColor: 'color-mix(in srgb, var(--organic-text) 14%, transparent)',
        background: 'color-mix(in srgb, var(--organic-text) 6%, transparent)',
      }}
    >
      {languages.map((lang) => {
        const active = locale === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLocale(lang.code)}
            className="px-2 py-0.5 rounded-full transition-all cursor-pointer select-none flex items-center gap-1"
            style={{
              background: active ? 'var(--organic-terracotta)' : 'transparent',
              color: active ? '#fff' : 'color-mix(in srgb, var(--organic-text) 65%, transparent)',
            }}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Top Scroll Progress Line */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-[2px]"
        style={{
          scaleX: scrollYProgress,
          transformOrigin: '0%',
          background: 'var(--organic-terracotta)',
        }}
      />

      {/* Sleek Scrolled Morphing Navbar Header */}
      <header className="sticky top-0 z-50 w-full pointer-events-none pt-2.5 sm:pt-3.5 pb-2">
        <motion.div
          className="mx-auto pointer-events-auto transition-all duration-300 relative"
          animate={{
            maxWidth: scrolled ? '960px' : '1200px',
            paddingLeft: scrolled ? '20px' : '28px',
            paddingRight: scrolled ? '20px' : '28px',
            paddingTop: scrolled ? '8px' : '14px',
            paddingBottom: scrolled ? '8px' : '14px',
            borderRadius: scrolled ? '9999px' : '24px',
            backgroundColor: scrolled
              ? 'color-mix(in srgb, var(--organic-surface) 90%, transparent)'
              : 'color-mix(in srgb, var(--organic-surface) 35%, transparent)',
            borderColor: scrolled
              ? 'color-mix(in srgb, var(--organic-text) 14%, transparent)'
              : 'color-mix(in srgb, var(--organic-text) 6%, transparent)',
            boxShadow: scrolled
              ? '0 20px 48px -12px rgba(0, 0, 0, 0.16), 0 4px 16px -2px rgba(0, 0, 0, 0.08)'
              : '0 2px 12px rgba(0, 0, 0, 0.02)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          style={{
            backdropFilter: 'blur(20px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
            borderWidth: '1.5px',
            borderStyle: 'solid',
          }}
        >
          {/* Glossy top edge highlight when scrolled */}
          {scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-8 top-0 h-[1px] rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--organic-text) 20%, transparent), transparent)',
              }}
            />
          )}

          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/"
                className="no-underline flex items-center gap-2.5"
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    e.preventDefault()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
              >
                <RaddllyLogo
                  iconSize={scrolled ? 28 : 32}
                  showWordmark
                  text="Raddlly"
                  wordmarkClassName="text-[var(--organic-text)] font-extrabold tracking-tight text-xl transition-all"
                />
              </Link>
            </motion.div>

            {/* Ultra-Fluid Desktop Nav Links with Magnetic Hover Pill */}
            <nav
              className="hidden md:flex items-center gap-1 p-1 rounded-full relative"
              onMouseLeave={() => setHoveredLink(null)}
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  className="relative px-3.5 py-1 text-[13px] font-semibold no-underline transition-colors duration-200 z-10"
                  style={{
                    color: hoveredLink === link.href
                      ? 'var(--organic-text)'
                      : 'color-mix(in srgb, var(--organic-text) 65%, transparent)',
                  }}
                >
                  {hoveredLink === link.href && (
                    <motion.div
                      layoutId="nav-hover-fluid-pill"
                      className="absolute inset-0 rounded-full -z-10"
                      style={{
                        background: 'color-mix(in srgb, var(--organic-text) 8%, transparent)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Minimalist CTA, Language Selector & Mobile Toggle */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.96 }}
                initial="initial"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-wide px-4 py-1.5 rounded-full shadow-sm transition-all hover:shadow-md"
                  style={{
                    background: 'var(--organic-terracotta)',
                    color: '#fff',
                  }}
                >
                  <span>Essai gratuit</span>
                  <motion.span
                    variants={{
                      initial: { x: 0 },
                      hover: { x: 3 },
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    →
                  </motion.span>
                </Link>
              </motion.div>

            {/* Mobile Hamburger Button */}
            <motion.button
              type="button"
              className="md:hidden flex items-center justify-center size-8 rounded-full border cursor-pointer"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              whileTap={{ scale: 0.9 }}
              style={{
                borderColor: 'color-mix(in srgb, var(--organic-text) 14%, transparent)',
                color: 'var(--organic-text)',
                background: 'transparent',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <motion.line
                  x1="1" y1="4" x2="15" y2="4"
                  animate={menuOpen ? { y1: 8, y2: 8, rotate: 45, originX: '50%', originY: '50%' } : { y1: 4, y2: 4, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.line
                  x1="1" y1="8" x2="15" y2="8"
                  animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.15 }}
                />
                <motion.line
                  x1="1" y1="12" x2="15" y2="12"
                  animate={menuOpen ? { y1: 8, y2: 8, rotate: -45, originX: '50%', originY: '50%' } : { y1: 12, y2: 12, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </header>

      {/* Mobile Dropdown Panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-16 left-4 right-4 z-40 rounded-3xl p-5 border shadow-2xl overflow-hidden"
            style={{
              transformOrigin: 'top',
              background: 'color-mix(in srgb, var(--organic-surface) 96%, transparent)',
              backdropFilter: 'blur(24px)',
              borderColor: 'color-mix(in srgb, var(--organic-text) 12%, transparent)',
            }}
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--organic-text)_6%,transparent)]"
                  style={{ color: 'var(--organic-text)' }}
                >
                  {link.label}
                  <span className="text-xs opacity-40">→</span>
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.04 + 0.05 }}
              className="mt-4 pt-4 border-t"
              style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 8%, transparent)' }}
            >
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary w-full text-center py-3 text-xs font-bold rounded-full"
                style={{ display: 'block', background: 'var(--organic-terracotta)', color: '#fff' }}
              >
                Démarrer gratuitement →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating mobile bottom conversion bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28, delay: 0.6 }}
        className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-2xl p-3 shadow-2xl md:hidden border"
        style={{
          background: 'color-mix(in srgb, var(--organic-surface) 96%, transparent)',
          borderColor: 'color-mix(in srgb, var(--organic-text) 14%, transparent)',
          backdropFilter: 'blur(16px)',
          color: 'var(--organic-text)',
        }}
      >
        <div className="flex flex-col pl-1">
          <span className="font-heading text-xs font-extrabold tracking-tight" style={{ color: 'var(--organic-text)' }}>Raddlly</span>
          <span className="text-[10.5px] font-medium" style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}>Essai gratuit · En ligne en 10m</span>
        </div>
        <motion.div whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }}>
          <Link
            href="/register"
            className="btn btn-primary h-9 px-4 text-xs font-bold"
            style={{ borderRadius: 10 }}
          >
            Essai gratuit →
          </Link>
        </motion.div>
      </motion.div>
    </>
  )
}

export function LandingFooter() {
  return (
    <footer
      className="pt-16 pb-12"
      style={{ borderTop: '1.5px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        {/* Brand & Mission column */}
        <div className="flex flex-col items-start gap-4">
          <Link
            href="/"
            className="font-heading text-2xl font-extrabold tracking-tight no-underline"
            style={{ color: 'var(--organic-text)' }}
          >
            Raddlly<span style={{ color: 'var(--organic-terracotta)' }}>.</span>
          </Link>
          <p className="text-[13.5px] leading-[1.65] max-w-[28ch]" style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}>
            L&apos;IA conversationnelle multi-canal qui vend dans vos DM Instagram, WhatsApp et Messenger 24/7.
          </p>

          {/* Operational Status Pill */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] font-semibold"
            style={{
              borderColor: 'color-mix(in srgb, var(--organic-sage-600) 30%, transparent)',
              background: 'var(--organic-sage-100)',
              color: 'var(--organic-sage-900)',
            }}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span>Systèmes 100% opérationnels</span>
          </div>
        </div>

        {/* Column 1: Produit */}
        <div className="flex flex-col gap-3">
          <span className="text-[11.5px] font-extrabold tracking-[.1em] uppercase" style={{ color: 'var(--organic-text)' }}>Produit</span>
          <a href="#product" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Démo interactive</a>
          <a href="#features" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Fonctionnalités</a>
          <a href="#pricing" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Tarifs &amp; Plans</a>
          <Link href="/register" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Créer un compte</Link>
        </div>

        {/* Column 2: Canaux */}
        <div className="flex flex-col gap-3">
          <span className="text-[11.5px] font-extrabold tracking-[.1em] uppercase" style={{ color: 'var(--organic-text)' }}>Canaux</span>
          <a href="#features" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Instagram DM</a>
          <a href="#features" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>WhatsApp Business</a>
          <a href="#features" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Messenger</a>
          <a href="#pricing" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Tarifs & Plans</a>
        </div>

        {/* Column 3: Légal & Support */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11.5px] font-extrabold tracking-[.1em] uppercase" style={{ color: 'var(--organic-text)' }}>Légal & Support</span>
          <Link href="/politique-de-confidentialite" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Confidentialité</Link>
          <Link href="/conditions-utilisation" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Conditions (CGU)</Link>
          <Link href="/suppression-donnees" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Suppression de données</Link>
          <a href="#faq" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Centre d&apos;aide (FAQ)</a>
        </div>
      </div>

      {/* Large subtle watermark brand text */}
      <div className="mt-14 overflow-hidden select-none pointer-events-none text-center">
        <span
          className="font-heading font-black text-[clamp(64px,14vw,160px)] leading-none tracking-tighter uppercase opacity-[0.04]"
          style={{ color: 'var(--organic-text)' }}
        >
          Raddlly
        </span>
      </div>

      {/* Bottom Bar */}
      <div
        className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6"
        style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)' }}
      >
        <span className="text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}>
          © 2026 Raddlly Inc. Tous droits réservés.
        </span>

        <div className="flex items-center gap-4 text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}>
          <LanguageSwitcher />
          <span>·</span>
          <Link href="/register" className="font-semibold no-underline hover:underline" style={{ color: 'var(--organic-terracotta)' }}>
            Commencer l&apos;essai gratuit →
          </Link>
        </div>
      </div>
    </footer>
  )
}

export function SectionHeader({ kicker, note }: { kicker: string; note: string }) {
  return (
    <div data-reveal className="mb-8 flex items-center gap-4">
      <span
        className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md shrink-0"
        style={{
          color: 'var(--organic-text)',
          background: 'color-mix(in srgb, var(--organic-text) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--organic-text) 14%, transparent)',
        }}
      >
        [ {kicker} ]
      </span>
      <div
        className="h-[1px] flex-1"
        style={{
          background: 'linear-gradient(to right, color-mix(in srgb, var(--organic-text) 16%, transparent), transparent)',
        }}
      />
      {note && (
        <span
          className="font-mono text-xs hidden sm:inline-block shrink-0"
          style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}
        >
          // {note}
        </span>
      )}
    </div>
  )
}
