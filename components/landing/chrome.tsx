'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll } from 'framer-motion'

const NAV_LINKS = [
  { href: '#product', label: 'Produit' },
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Scroll Progress Bar at the top */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-[3px]"
        style={{
          scaleX: scrollYProgress,
          transformOrigin: '0%',
          background: 'var(--organic-terracotta)',
          boxShadow: '0 1px 6px color-mix(in srgb, var(--organic-terracotta) 45%, transparent)',
        }}
      />

      <motion.nav
        className="sticky top-0 z-30 flex items-center gap-6"
        animate={{
          paddingTop: scrolled ? '10px' : '15px',
          paddingBottom: scrolled ? '10px' : '15px',
          boxShadow: scrolled ? '0 8px 30px rgba(0,0,0,.04)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={{
          backdropFilter: 'blur(18px) saturate(1.6)',
          background: 'color-mix(in srgb, var(--organic-bg) 88%, transparent)',
          borderBottom: '1.5px solid color-mix(in srgb, var(--organic-text) 7%, transparent)',
          paddingLeft: 'max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
          paddingRight: 'max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
        }}
      >
        {/* Clickable logo */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/"
            className="lp-brand font-heading text-xl font-bold tracking-tight no-underline block"
            style={{
              color: 'var(--organic-text)',
            }}
          >
            Instaflow
          </Link>
        </motion.div>

        {/* Desktop nav links */}
        <div className="lp-nav-links flex items-center gap-6 ml-auto mr-1">
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              whileHover={{ y: -1 }}
              className="lp-nav-link relative text-sm no-underline"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 80%, transparent)', transition: 'color .18s ease' }}
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        <motion.div
          whileHover={{ scale: 1.04, y: -0.5 }}
          whileTap={{ scale: 0.96 }}
          className="lp-nav-cta-wrapper"
        >
          <Link href="/register" className="btn btn-primary lp-nav-cta">
            Essai gratuit
          </Link>
        </motion.div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="lp-hamburger ml-1"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 8,
            color: 'var(--organic-text)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="18" y2="18" />
                <line x1="18" y1="4" x2="4" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </>
            )}
          </svg>
        </button>
      </motion.nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="lp-mobile-menu"
          style={{
            position: 'sticky',
            top: 64,
            zIndex: 29,
            background: 'color-mix(in srgb, var(--organic-bg) 97%, transparent)',
            backdropFilter: 'blur(18px)',
            borderBottom: '1.5px solid color-mix(in srgb, var(--organic-text) 7%, transparent)',
            padding: '12px max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'fadeUp .25s ease both',
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 4px',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--organic-text)',
                textDecoration: 'none',
                borderBottom: '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)',
              }}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="btn btn-primary mt-2"
            style={{ alignSelf: 'flex-start' }}
          >
            Essai gratuit
          </Link>
        </div>
      )}

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
          <span className="font-heading text-xs font-extrabold tracking-tight" style={{ color: 'var(--organic-text)' }}>Instaflow</span>
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
            Instaflow<span style={{ color: 'var(--organic-terracotta)' }}>.</span>
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
          <a href="#faq" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)] transition-colors" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>Conformité Meta API</a>
        </div>

        {/* Column 3: Légal & Support */}
        <div className="flex flex-col gap-3">
          <span className="text-[11.5px] font-extrabold tracking-[.1em] uppercase" style={{ color: 'var(--organic-text)' }}>Légal &amp; Support</span>
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
          Instaflow
        </span>
      </div>

      {/* Bottom Bar */}
      <div
        className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6"
        style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)' }}
      >
        <span className="text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}>
          © 2026 Instaflow Inc. Tous droits réservés.
        </span>

        <div className="flex items-center gap-4 text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}>
          <span className="inline-flex items-center gap-1.5">
            <span>🇫🇷</span>
            <span>Français</span>
          </span>
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
    <div data-reveal className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <span className="lp-kicker">{kicker}</span>
      {note && (
        <span
          className="text-[12px] font-medium tracking-[.04em]"
          style={{ color: 'color-mix(in srgb, var(--organic-text) 48%, transparent)' }}
        >
          {note}
        </span>
      )}
    </div>
  )
}
