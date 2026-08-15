"use client"

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  LOGO_STRIP,
  METRICS,
  FEATURES,
  CHANNEL_INFO,
  TESTIMONIALS,
  COMPARISON_ROWS,
  FAQ_ITEMS,
} from '@/lib/landing-content'
import { SectionHeader } from './chrome'

const TONE_ICON_BG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-100)',
  s: 'var(--organic-sage-100)',
}
const TONE_ICON_FG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-600)',
  s: 'var(--organic-sage-700)',
}
const TONE_AVATAR_BG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-200)',
  s: 'var(--organic-sage-200)',
}
const TONE_AVATAR_FG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-800)',
  s: 'var(--organic-sage-800)',
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14,
    },
  },
}

/** Animates a numeric value from 0 up to `target` once the element is in view */
function useCountUp(target: number, duration = 1.4, decimals = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target, duration, decimals])

  return { ref, value }
}

export function LogoMarquee() {
  const loop = [...LOGO_STRIP, ...LOGO_STRIP]
  return (
    <section className="pb-16">
      <p className="mb-5 text-center text-xs font-bold tracking-[.12em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}>
        Adopté par plus de 12 000 équipes qui vivent dans leurs DM
      </p>
      <div className="lp-marquee">
        <div className="flex w-max items-baseline gap-[clamp(24px,4vw,56px)]" style={{ animation: 'marquee 36s linear infinite' }}>
          {loop.map((name, i) => (
            <span
              key={i}
              aria-hidden={i >= LOGO_STRIP.length}
              className="font-heading text-xl font-bold tracking-tight"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MetricsBand() {
  const metrics = [
    { label: 'DM traités / mois', target: 2400000, suffix: '', prefix: '', decimals: 0, display: (v: number) => `${(v/1000000).toFixed(1)}M+` },
    { label: 'Taux de réponse IA', target: 94, suffix: '%', prefix: '', decimals: 0, display: (v: number) => `${Math.round(v)}%` },
    { label: 'Temps de réponse', target: 3, suffix: 's', prefix: '<', decimals: 0, display: (v: number) => `<${Math.round(v)}s` },
    { label: 'Équipes actives', target: 12000, suffix: '+', prefix: '', decimals: 0, display: (v: number) => `${(v/1000).toFixed(0)}k+` },
  ]

  return (
    <section className="pb-[88px]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-8%" }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3.5"
      >
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </motion.div>
    </section>
  )
}

function MetricCard({ metric }: { metric: { label: string; target: number; decimals: number; display: (v: number) => string } }) {
  const { ref, value } = useCountUp(metric.target, 1.6, metric.decimals)
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="lp-card card p-6 cursor-pointer"
      style={{ borderLeft: '3px solid var(--organic-terracotta)' }}
    >
      <span
        ref={ref}
        className="font-heading text-[clamp(32px,3.2vw,44px)] leading-[1.08] font-bold block"
        style={{ color: 'var(--organic-text)' }}
      >
        {metric.display(value)}
      </span>
      <div className="mt-2 text-[12.5px] font-semibold tracking-[.06em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
        {metric.label}
      </div>
    </motion.div>
  )
}

export function FeaturesGrid() {
  const ICONS: React.ReactNode[] = [
    <svg key="i" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    <svg key="ii" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    <svg key="iii" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.81 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 7.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    <svg key="iv" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    <svg key="v" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    <svg key="vi" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  ]

  return (
    <section id="features" className="pb-[88px]">
      <SectionHeader kicker="Pourquoi ça gagne" note="Conçu pour ceux qui vendent en message" />
      <motion.h2 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 max-w-[20ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        Pas un chatbot. Un closer.
      </motion.h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-8%" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {FEATURES.map((f, idx) => (
          <motion.div
            key={f.title}
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lp-card card cursor-pointer"
          >
            <span
              className="mb-4 grid size-10 place-content-center rounded-xl shrink-0"
              style={{ background: TONE_ICON_BG[f.tone], color: TONE_ICON_FG[f.tone] }}
            >
              {ICONS[idx % ICONS.length]}
            </span>
            <h3 className="mb-2 font-heading text-[16px] leading-[1.25]">{f.title}</h3>
            <p className="m-0 text-[13.5px] leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 72%, transparent)' }}>{f.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export function Channels() {
  const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    'DM Instagram': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
    WhatsApp:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
    Messenger: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  }

  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="Canaux" note="API natives · pas de bricolage" />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 max-w-[22ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        Là où vos clients sont déjà.
      </motion.h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-8%" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {CHANNEL_INFO.map((c) => (
          <motion.div
            key={c.title}
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lp-card card flex-row items-start gap-4 p-6 cursor-pointer"
          >
            <span
              className="grid size-12 shrink-0 place-content-center rounded-xl"
              style={{ background: TONE_ICON_BG[c.tone], color: TONE_ICON_FG[c.tone] }}
            >
              {CHANNEL_ICONS[c.title] ?? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /></svg>
              )}
            </span>
            <div>
              <h3 className="mb-1.5 font-heading text-[17px]">{c.title}</h3>
              <p className="m-0 text-[13.5px] leading-[1.6]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                {c.body}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export function InboxShowcase() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="L'inbox partagée" note="Boîte d'équipe collaborative" />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3 max-w-[22ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        L'IA rédige. Vous validez. Elle apprend.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-9 max-w-[56ch] text-base leading-[1.65]" 
        style={{ color: 'color-mix(in srgb, var(--organic-text) 76%, transparent)' }}
      >
        Chaque conversation dont l&apos;IA n&apos;est pas sûre arrive ici avec une réponse suggérée et un score de confiance.
        Validez-la, modifiez-la, ou reprenez la main — dans tous les cas, elle progresse.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ type: 'spring', stiffness: 70, damping: 14 }}
        className="overflow-hidden rounded-2xl border-[1.5px]"
        style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)', background: 'var(--organic-bg)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
      >
        <div className="flex items-center gap-2.5 border-b-[1.5px] px-5 py-3.5" style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 8%, transparent)' }}>
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-terracotta-300)' }} />
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-sage-300)' }} />
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-sand-300)' }} />
          <span className="ml-3 text-[13px] font-bold tracking-[.04em]">Instaflow · Inbox</span>
          <span className="tag ml-auto" style={{ background: 'var(--organic-sage-100)', color: 'var(--organic-sage-800)' }}>3 à traiter</span>
        </div>
        
        <div className="lp-inbox-grid grid min-h-[380px] grid-cols-[300px_minmax(0,1fr)]">
          {/* Left panel chat items */}
          <div className="border-r-[1.5px] p-3" style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 8%, transparent)' }}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="tag" style={{ background: 'var(--organic-terracotta-100)', color: 'var(--organic-terracotta-800)' }}>Tout · 47</span>
              <span className="tag border" style={{ borderColor: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-700)' }}>Instagram</span>
              <span className="tag border" style={{ borderColor: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-700)' }}>WhatsApp</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-xl p-3.5"
                style={{ background: 'var(--organic-terracotta-100)' }}
              >
                <div className="flex justify-between text-[13px]">
                  <strong>Maya R.</strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>2m</span>
                </div>
                <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  Vous livrez au Canada ? Il me le faut avant…
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="rounded-xl p-3.5"
              >
                <div className="flex justify-between text-[13px]">
                  <strong>Jon B.</strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>11m</span>
                </div>
                <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  Traité par l&apos;IA · statut de commande → résolu
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="rounded-xl p-3.5"
              >
                <div className="flex justify-between text-[13px]">
                  <strong>@petalandstem</strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>24m</span>
                </div>
                <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  Traité par l&apos;IA · lead capturé → CRM
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Right panel chat message mockup */}
          <div className="flex flex-col gap-3 p-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.2 }}
              className="max-w-[70%] self-start rounded-[16px] rounded-bl-[4px] px-3.5 py-2.5 text-sm"
              style={{ background: 'var(--organic-sand-200)' }}
            >
              Vous livrez au Canada ? Il me le faut avant le 14 pour un mariage
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 85, damping: 14, delay: 0.38 }}
              className="mt-auto rounded-xl border-[1.5px] p-4"
              style={{ borderColor: 'var(--organic-terracotta-300)', background: 'var(--organic-terracotta-100)' }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-[.1em] uppercase" style={{ color: 'var(--organic-terracotta-700)' }}>
                  Réponse suggérée par l&apos;IA
                </span>
                <span className="tag" style={{ background: 'var(--organic-terracotta-200)', color: 'var(--organic-terracotta-800)' }}>94% de confiance</span>
              </div>
              <p className="mb-3 text-sm leading-[1.6]">
                Oui ! On livre au Canada en 3 à 5 jours ouvrés — commandez avant jeudi et ça arrivera bien avant le
                14. Je vous réserve un mot cadeau ?
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary">Valider &amp; envoyer</button>
                <button type="button" className="btn btn-ghost">Modifier</button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="Preuves & Avis" note="Agences · e-commerce · créateurs" />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-8%" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {TESTIMONIALS.map((t) => (
          <motion.figure
            key={t.name}
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lp-card card m-0 cursor-pointer"
          >
            <div className="lp-stars mb-3" aria-label="5 étoiles">★★★★★</div>
            <blockquote className="mb-5 text-[14.5px] leading-[1.6]" style={{ fontStyle: 'italic', color: 'color-mix(in srgb, var(--organic-text) 88%, transparent)' }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3 mt-auto">
              <span
                className="grid size-9 shrink-0 place-content-center rounded-full text-[12px] font-bold"
                style={{ background: TONE_AVATAR_BG[t.tone], color: TONE_AVATAR_FG[t.tone] }}
              >
                {t.initials}
              </span>
              <span className="text-[13px] leading-[1.4]">
                <strong className="block">{t.name}</strong>
                <span style={{ color: 'color-mix(in srgb, var(--organic-text) 58%, transparent)' }}>{t.role}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  )
}

export function ComparisonTable() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="Le changement" note="Migration gratuite sur tout plan payant" />
      <motion.h2 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-9 max-w-[24ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        Les outils chatbot historiques datent de 2019.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-x-auto rounded-2xl border-[1.5px]" 
        style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
      >
        <table className="table" style={{ minWidth: 640 }}>
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--organic-bg) 60%, transparent)' }}>
              <th style={{ width: '30%' }} />
              <th className="lp-col-us">Instaflow</th>
              <th className="lp-col-them">Outils historiques</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([label, us, them]) => (
              <tr key={label}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td>
                  <span className="lp-check inline-flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-[13.5px]" style={{ color: 'var(--organic-text)' }}>{us}</span>
                  </span>
                </td>
                <td>
                  <span className="lp-cross inline-flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span className="text-[13.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>{them}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  )
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleIndex = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="pb-[88px]">
      <SectionHeader kicker="Questions fréquentes" note="" />
      <div className="lp-faq-grid grid grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-x-[clamp(24px,5vw,80px)] gap-y-7">
        <h2 className="font-heading text-[clamp(28px,3.2vw,40px)] leading-[1.12]">Les questions qu&apos;on nous pose le plus.</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-8%" }}
          className="flex flex-col"
        >
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={item.q}
                variants={cardVariants}
                className="py-[18px]"
                style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1.5px solid color-mix(in srgb, var(--organic-text) 9%, transparent)' : undefined }}
              >
                <button
                  onClick={() => toggleIndex(i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-base font-bold bg-transparent border-0 p-0 text-inherit hover:opacity-95 focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span style={{ fontFamily: 'var(--organic-body-family), system-ui, sans-serif' }}>{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex size-5 items-center justify-center text-lg font-normal shrink-0"
                    style={{ color: 'var(--organic-terracotta-700)' }}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.25, delay: 0.05 }
                        }
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 76%, transparent)' }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export function ClosingCta() {
  return (
    <section className="pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-5%" }}
        transition={{ type: 'spring', stiffness: 70, damping: 15 }}
        className="relative overflow-hidden rounded-3xl p-[clamp(40px,6vw,80px)_clamp(24px,5vw,72px)] border-[1.5px]"
        style={{
          background: 'var(--organic-surface)',
          borderColor: 'color-mix(in srgb, var(--organic-terracotta) 35%, transparent)',
          boxShadow: '0 8px 32px rgba(0,0,0,.08)',
        }}
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[.12em] uppercase" style={{ color: 'var(--organic-terracotta)' }}>
          ✦ Démarrer aujourd&apos;hui
        </span>
        <h2
          className="relative mt-5 max-w-[18ch] font-heading text-[clamp(32px,4.4vw,56px)] font-extrabold leading-[1.08]"
          style={{ color: 'var(--organic-text)' }}
        >
          Votre prochain client est en train d&apos;écrire, là, maintenant.
        </h2>
        <p className="relative mt-5 max-w-[52ch] text-[16.5px] leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 78%, transparent)' }}>
          Un essai gratuit sur votre vrai compte, vos vrais DM. Si ça ne se rentabilise pas en un mois,
          on vous aide à repasser à votre ancien outil.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Link href="/register" className="btn btn-primary rounded-full px-6">
              Essai gratuit →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Link href="/register" className="btn btn-secondary rounded-full px-6">
              Commencer gratuitement
            </Link>
          </motion.div>
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Sans carte bancaire
          </span>
        </div>
      </motion.div>
    </section>
  )
}
