'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#product', label: 'Produit' },
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav
        className="sticky top-0 z-30 flex min-h-16 items-center gap-6"
        style={{
          backdropFilter: 'blur(18px) saturate(1.6)',
          background: 'color-mix(in srgb, var(--organic-bg) 88%, transparent)',
          borderBottom: '1.5px solid color-mix(in srgb, var(--organic-text) 7%, transparent)',
          padding: '13.2px max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
        }}
      >
        {/* Clickable logo */}
        <Link
          href="/"
          className="lp-brand mr-auto font-heading text-xl font-bold tracking-tight no-underline"
          style={{
            color: 'var(--organic-text)',
            transition: 'opacity .2s ease',
          }}
        >
          Instaflow
        </Link>

        {/* Desktop nav links */}
        <div className="lp-nav-links flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="lp-nav-link relative text-sm no-underline"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 80%, transparent)', transition: 'color .18s ease' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link href="/register" className="btn btn-primary lp-nav-cta">
          Essai gratuit
        </Link>

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
      </nav>

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
    </>
  )
}

export function LandingFooter() {
  return (
    <footer
      className="py-12"
      style={{ borderTop: '1.5px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
    >
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-16 gap-y-8" style={{ gridTemplateColumns: 'auto 1fr' }}>
        {/* Brand column */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="font-heading text-xl font-bold tracking-tight no-underline"
            style={{ color: 'var(--organic-text)' }}
          >
            Instaflow
          </Link>
          <p className="text-[13px] leading-[1.6] max-w-[22ch]" style={{ color: 'color-mix(in srgb, var(--organic-text) 58%, transparent)' }}>
            L&apos;IA qui vend dans vos DM pendant que vous dormez.
          </p>
        </div>

        {/* Links columns */}
        <div className="flex flex-wrap justify-end gap-x-12 gap-y-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold tracking-[.09em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}>Produit</span>
            <a href="#product"   className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>Démo</a>
            <a href="#features"  className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>Fonctionnalités</a>
            <a href="#pricing"   className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>Tarifs</a>
            <a href="#faq"       className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>FAQ</a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold tracking-[.09em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}>Légal</span>
            <Link href="/politique-de-confidentialite" className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>Confidentialité</Link>
            <Link href="/conditions-utilisation"       className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>CGU</Link>
            <Link href="/suppression-donnees"          className="text-[13.5px] no-underline hover:text-[var(--organic-terracotta)]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)', transition: 'color .15s' }}>Suppression</Link>
          </div>
        </div>
      </div>

      <div
        className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-6"
        style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)' }}
      >
        <span className="text-[12.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}>
          © 2026 Instaflow · Fait avec soin ✦
        </span>
        <Link
          href="/register"
          className="btn btn-primary"
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          Essai gratuit →
        </Link>
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
