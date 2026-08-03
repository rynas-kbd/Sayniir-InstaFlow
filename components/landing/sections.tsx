"use client"

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  a: 'var(--organic-terracotta-700)',
  s: 'var(--organic-sage-800)',
}
const TONE_AVATAR_BG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-300)',
  s: 'var(--organic-sage-300)',
}
const TONE_AVATAR_FG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-900)',
  s: 'var(--organic-sage-900)',
}

export function LogoMarquee() {
  const loop = [...LOGO_STRIP, ...LOGO_STRIP]
  return (
    <section className="pb-16">
      <p className="mb-5 text-xs font-bold tracking-[.1em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>
        Adopté par plus de 12 000 équipes qui vivent dans leurs DM
      </p>
      <div className="lp-marquee">
        <div className="flex w-max items-baseline gap-[clamp(24px,4vw,56px)]" style={{ animation: 'marquee 36s linear infinite' }}>
          {loop.map((name, i) => (
            <span
              key={i}
              aria-hidden={i >= LOGO_STRIP.length}
              className="font-heading text-xl"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}
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
  return (
    <section className="pb-[88px]">
      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        {METRICS.map((m) => (
          <div key={m.label} data-reveal className="pl-[18px]" style={{ borderLeft: '2.5px solid var(--organic-terracotta)' }}>
            <div data-count className="font-heading text-[clamp(34px,3.2vw,46px)] leading-[1.1]">{m.value}</div>
            <div className="mt-1.5 text-[13px] font-semibold tracking-[.06em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function FeaturesGrid() {
  return (
    <section id="features" className="pb-[88px]">
      <SectionHeader kicker="01 — Pourquoi ça gagne" note="Conçu pour ceux qui vendent en message" />
      <h2 data-reveal className="mb-10 max-w-[20ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
        Pas un chatbot. Un closer.
      </h2>
      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        {FEATURES.map((f) => (
          <div key={f.title} data-reveal className="lp-card card">
            <span
              className="mb-4 grid size-11 place-content-center rounded-full"
              style={{ background: TONE_ICON_BG[f.tone] }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TONE_ICON_FG[f.tone]} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </span>
            <h3 className="mb-2 font-heading text-[17px] leading-[1.2]">{f.title}</h3>
            <p className="m-0 text-[13px] opacity-80">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Channels() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="02 — Canaux" note="API natives · pas de bricolage en zone grise" />
      <h2 data-reveal className="mb-10 max-w-[22ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
        Là où vos clients sont déjà.
      </h2>
      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {CHANNEL_INFO.map((c) => (
          <div key={c.title} data-reveal className="flex items-start gap-4">
            <span
              className="grid size-14 shrink-0 place-content-center rounded-full"
              style={{ background: TONE_ICON_BG[c.tone] }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TONE_ICON_FG[c.tone]} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
              </svg>
            </span>
            <div>
              <h3 className="mb-1.5 font-heading text-xl">{c.title}</h3>
              <p className="m-0 text-[14.5px] leading-[1.6]" style={{ color: 'color-mix(in srgb, var(--organic-text) 74%, transparent)' }}>
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function InboxShowcase() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="03 — L'inbox" note="Fig. 02 · boîte d'équipe partagée" />
      <h2 data-reveal className="mb-3 max-w-[22ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
        L'IA rédige. Vous validez. Elle apprend.
      </h2>
      <p className="mb-9 max-w-[56ch] text-base leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 78%, transparent)' }}>
        Chaque conversation dont l&apos;IA n&apos;est pas sûre arrive ici avec une réponse suggérée et un score de confiance.
        Validez-la, modifiez-la, ou reprenez la main — dans tous les cas, elle progresse.
      </p>
      <div
        data-reveal
        className="overflow-hidden rounded-[calc(var(--radius-lg)*2)] border-[1.5px]"
        style={{ borderColor: 'var(--organic-sand-300)', background: 'var(--organic-bg)', boxShadow: 'var(--organic-shadow-lg)' }}
      >
        <div className="flex items-center gap-2.5 border-b-[1.5px] px-5 py-3.5" style={{ borderColor: 'var(--organic-sand-200)' }}>
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-terracotta-300)' }} />
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-sage-300)' }} />
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-sand-300)' }} />
          <span className="ml-3 text-[13px] font-bold tracking-[.04em]">Instaflow · Inbox</span>
          <span className="tag ml-auto" style={{ background: 'var(--organic-sage-100)', color: 'var(--organic-sage-800)' }}>3 à traiter</span>
        </div>
        <div className="lp-inbox-grid grid min-h-[380px] grid-cols-[300px_minmax(0,1fr)]">
          <div className="border-r-[1.5px] p-3" style={{ borderColor: 'var(--organic-sand-200)' }}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="tag" style={{ background: 'var(--organic-terracotta-100)', color: 'var(--organic-terracotta-800)' }}>Tout · 47</span>
              <span className="tag border" style={{ borderColor: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-700)' }}>Instagram</span>
              <span className="tag border" style={{ borderColor: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-700)' }}>WhatsApp</span>
            </div>
            <div className="mb-2 rounded-2xl p-3.5" style={{ background: 'var(--organic-terracotta-100)' }}>
              <div className="flex justify-between text-[13px]">
                <strong>Maya R.</strong>
                <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>2m</span>
              </div>
              <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                Vous livrez au Canada ? Il me le faut avant…
              </div>
            </div>
            <div className="mb-2 rounded-2xl p-3.5">
              <div className="flex justify-between text-[13px]">
                <strong>Jon B.</strong>
                <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>11m</span>
              </div>
              <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                Traité par l&apos;IA · statut de commande → résolu
              </div>
            </div>
            <div className="rounded-2xl p-3.5">
              <div className="flex justify-between text-[13px]">
                <strong>@petalandstem</strong>
                <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>24m</span>
              </div>
              <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                Traité par l&apos;IA · lead capturé → CRM
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <div className="max-w-[70%] self-start rounded-[16px] rounded-bl-[4px] px-3.5 py-2.5 text-sm" style={{ background: 'var(--organic-sand-200)' }}>
              Vous livrez au Canada ? Il me le faut avant le 14 pour un mariage
            </div>
            <div
              className="mt-auto rounded-[var(--radius-lg)] border-[1.5px] p-4"
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
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="04 — Preuves" note="Agences · e-commerce · créateurs" />
      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} data-reveal className="lp-card card lp-figure m-0">
            <blockquote className="mb-5 font-heading text-[19px] leading-[1.45]" style={{ textIndent: '-0.559em' }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <span
                className="grid size-9 place-content-center rounded-full text-[13px] font-bold"
                style={{ background: TONE_AVATAR_BG[t.tone], color: TONE_AVATAR_FG[t.tone] }}
              >
                {t.initials}
              </span>
              <span className="text-[13.5px] leading-[1.4]">
                <strong>{t.name}</strong>
                <br />
                <span style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export function ComparisonTable() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="05 — Le changement" note="Migration gratuite sur tout plan payant" />
      <h2 data-reveal className="mb-9 max-w-[24ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
        Les outils chatbot historiques datent de 2019.
      </h2>
      <div data-reveal className="overflow-x-auto">
        <table className="table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ width: '30%' }} />
              <th style={{ color: 'var(--organic-terracotta-700)' }}>Instaflow</th>
              <th>Outils chatbot historiques</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([label, us, them]) => (
              <tr key={label}>
                <td style={{ fontWeight: 700 }}>{label}</td>
                <td>{us}</td>
                <td>{them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      <SectionHeader kicker="07 — Questions" note="" />
      <div className="lp-faq-grid grid grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-x-[clamp(24px,5vw,80px)] gap-y-7">
        <h2 className="font-heading text-[clamp(30px,3.4vw,42px)] leading-[1.1]">Les questions qu'on nous pose le plus.</h2>
        <div data-reveal-group className="lp-stagger flex flex-col">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={item.q}
                data-reveal
                className="py-[18px]"
                style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1.5px solid var(--organic-sand-300)' : undefined }}
              >
                <button
                  onClick={() => toggleIndex(i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-base font-bold bg-transparent border-0 p-0 text-inherit hover:opacity-95 focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span style={{ fontFamily: 'Figtree, var(--font-figtree), system-ui, sans-serif' }}>{item.q}</span>
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
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ClosingCta() {
  return (
    <section className="pb-12">
      <div
        data-reveal
        className="relative overflow-hidden rounded-[calc(var(--radius-lg)*2)] p-[clamp(40px,6vw,80px)_clamp(24px,5vw,72px)]"
        style={{ background: 'var(--organic-terracotta-800)' }}
      >
        <div
          className="pointer-events-none absolute -right-[120px] -bottom-[160px] size-[380px] rounded-full"
          style={{ background: 'var(--organic-terracotta-700)' }}
        />
        <span className="text-xs font-bold tracking-[.1em] uppercase" style={{ color: 'var(--organic-terracotta-300)' }}>
          08 — Démarrer
        </span>
        <h2
          className="relative mt-5 max-w-[18ch] font-heading text-[clamp(34px,4.6vw,60px)] leading-[1.08]"
          style={{ color: 'var(--organic-terracotta-100)' }}
        >
          Votre prochain client est en train d'écrire, là, maintenant.
        </h2>
        <p className="relative mt-5 max-w-[52ch] text-[16.5px] leading-[1.65]" style={{ color: 'var(--organic-terracotta-200)' }}>
          Un essai gratuit sur votre vrai compte, vos vrais DM. Si ça ne se rentabilise pas en un mois,
          on vous aide à repasser à votre ancien outil.
        </p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn rounded-full" style={{ background: 'var(--organic-bg)', color: 'var(--organic-text)' }}>
            Essai gratuit
          </Link>
          <Link href="/register" className="btn btn-ghost" style={{ color: 'var(--organic-terracotta-100)', borderColor: 'var(--organic-terracotta-400)' }}>
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </section>
  )
}
