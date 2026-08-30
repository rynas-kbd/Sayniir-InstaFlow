import { LandingNav, LandingFooter } from '@/components/landing/chrome'
import { Hero } from '@/components/landing/hero'
import { FlowDemo } from '@/components/landing/flow-demo'
import { Pricing } from '@/components/landing/pricing'
import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import {
  CommandCenterTrust,
  FeaturesGrid,
  ComparisonTable,
  Faq,
  ClosingCta,
} from '@/components/landing/sections'

import { AuraBackground } from '@/components/landing/aura-background'
import { InteractiveStudio } from '@/components/landing/interactive-studio'
import { PageIntro } from '@/components/landing/page-intro'

export default function LandingPage() {
  return (
    <>
      <PageIntro />
      <AuraBackground />
      <SmoothScroll />
      <div style={{ position: 'relative', zIndex: 1 }}>
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
          <FeaturesGrid />
        </ScrollReveal>
        <ScrollReveal delay={0}>
          <ComparisonTable />
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
      </div>
    </>
  )
}
