import { LandingNav, LandingFooter } from '@/components/landing/chrome'
import { Hero } from '@/components/landing/hero'
import { FlowDemo } from '@/components/landing/flow-demo'
import { Pricing } from '@/components/landing/pricing'
import { CursorGlow } from '@/components/landing/cursor-glow'
import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import {
  LogoMarquee,
  MetricsBand,
  CommandCenterTrust,
  FeaturesGrid,
  Channels,
  InboxShowcase,
  Testimonials,
  ComparisonTable,
  Faq,
  ClosingCta,
} from '@/components/landing/sections'

import { WebGLShaderBg } from '@/components/landing/webgl-shader-bg'
import { InteractiveStudio } from '@/components/landing/interactive-studio'
import { VisualDuel } from '@/components/landing/visual-duel'

export default function LandingPage() {
  return (
    <>
      <WebGLShaderBg />
      <SmoothScroll />
      <CursorGlow />
      <LandingNav />
      <div className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,64px)]">
        <Hero />
        <ScrollReveal delay={0}>
          <FlowDemo />
        </ScrollReveal>
        <ScrollReveal delay={0.05}>
          <CommandCenterTrust />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <VisualDuel />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <FeaturesGrid />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <Channels />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <InboxShowcase />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <Testimonials />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <Pricing />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <Faq />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <ClosingCta />
        </ScrollReveal>
        <LandingFooter />
      </div>
    </>
  )
}
