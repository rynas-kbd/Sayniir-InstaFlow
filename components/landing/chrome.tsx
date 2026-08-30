'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { RaddllyLogo } from '@/components/raddlly-logo'

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
        className="sticky top-0 z-30 flex items-center justify-between gap-6 relative"
        animate={{
          paddingTop: scrolled ? '10px' : '15px',
          paddingBottom: scrolled ? '10px' : '15px',
        }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={{
          background: 'transparent',
          paddingLeft: 'max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
          paddingRight: 'max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
        }}
      >
        {/* Short centered thin line at the bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 lg:w-72 h-[1px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--organic-text)_25%,transparent)] to-transparent pointer-events-none" />
        {/* Clickable logo */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/"
            className="no-underline block"
            onClick={(e) => {
              // If already on the landing page, smooth scroll to top instead of hard nav
              if (window.location.pathname === '/') {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            <RaddllyLogo
              iconSize={30}
              showWordmark
              wordmarkClassName="text-[var(--organic-text)]"
            />
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

        {/* Mobile hamburger — animated morphing button */}
        <motion.button
          type="button"
          className="lp-hamburger"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
          style={{
            display: 'none',
            background: 'none',
            border: '1.5px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: 10,
            color: 'var(--organic-text)',
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <motion.line
              x1="1" y1="4" x2="15" y2="4"
              animate={menuOpen ? { y1: 8, y2: 8, rotate: 45, originX: '50%', originY: '50%' } : { y1: 4, y2: 4, rotate: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.line
              x1="1" y1="8" x2="15" y2="8"
              animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.line
              x1="1" y1="12" x2="15" y2="12"
              animate={menuOpen ? { y1: 8, y2: 8, rotate: -45, originX: '50%', originY: '50%' } : { y1: 12, y2: 12, rotate: 0 }}
              transition={{ duration: 0.25 }}
            />
          </svg>
        </motion.button>
      </motion.nav>

      {/* Mobile dropdown — animated fullscreen panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 56,
              left: 0,
              right: 0,
              zIndex: 29,
              transformOrigin: 'top',
              background: 'color-mix(in srgb, var(--organic-bg) 98%, transparent)',
              backdropFilter: 'blur(24px)',
              borderBottom: '1.5px solid color-mix(in srgb, var(--organic-text) 8%, transparent)',
              padding: '8px max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px))) 20px',
            }}
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--organic-text)',
                  textDecoration: 'none',
                  borderBottom: '1px solid color-mix(in srgb, var(--organic-text) 7%, transparent)',
                }}
              >
                {link.label}
                <span style={{ opacity: 0.3, fontSize: 12 }}>→</span>
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.05 + 0.05 }}
              className="mt-5"
            >
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary w-full text-center"
                style={{ display: 'block' }}
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
