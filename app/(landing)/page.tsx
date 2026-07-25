import { LandingNav, LandingFooter } from '@/components/landing/chrome'
import { Hero } from '@/components/landing/hero'
import { FlowDemo } from '@/components/landing/flow-demo'
import { Pricing } from '@/components/landing/pricing'
import {
  LogoMarquee,
  MetricsBand,
  FeaturesGrid,
  Channels,
  InboxShowcase,
  Testimonials,
  ComparisonTable,
  Faq,
  ClosingCta,
} from '@/components/landing/sections'

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-[1160px] px-[clamp(20px,5vw,64px)]">
        <Hero />
        <FlowDemo />
        <LogoMarquee />
        <MetricsBand />
        <FeaturesGrid />
        <Channels />
        <InboxShowcase />
        <Testimonials />
        <ComparisonTable />
        <Pricing />
        <Faq />
        <ClosingCta />
        <LandingFooter />
      </div>
    </>
  )
}
