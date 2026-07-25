import Link from 'next/link'

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-30 flex min-h-16 items-center gap-6"
      style={{
        backdropFilter: 'blur(14px) saturate(1.3)',
        background: 'color-mix(in srgb, var(--organic-bg) 82%, transparent)',
        borderBottom: '1.5px solid color-mix(in srgb, var(--organic-text) 8%, transparent)',
        padding: '13.2px max(clamp(20px,5vw,64px), calc((100% - 1160px) / 2 + clamp(20px,5vw,64px)))',
      }}
    >
      <span className="mr-auto font-heading text-lg">Instaflow</span>
      <div className="lp-nav-links flex items-center gap-6">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="text-sm text-[var(--organic-text)] no-underline hover:text-[var(--organic-terracotta)]">
            {link.label}
          </a>
        ))}
      </div>
      <Link href="/register" className="btn btn-primary">
        Book a demo
      </Link>
    </nav>
  )
}

export function LandingFooter() {
  return (
    <footer
      className="flex flex-wrap items-baseline justify-between gap-5 py-8"
      style={{ borderTop: '2px solid var(--organic-sand-300)' }}
    >
      <span className="font-heading text-lg">Instaflow</span>
      <div className="flex flex-wrap gap-6 text-[13.5px]">
        <a href="#product" className="no-underline">Product</a>
        <a href="#features" className="no-underline">Features</a>
        <a href="#pricing" className="no-underline">Pricing</a>
        <a href="#faq" className="no-underline">FAQ</a>
      </div>
      <span className="text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>
        © 2026 Instaflow. Every DM answered.
      </span>
    </footer>
  )
}

export function SectionHeader({ kicker, note }: { kicker: string; note: string }) {
  return (
    <div
      data-reveal
      className="mb-7 flex items-baseline justify-between pt-4"
      style={{ borderTop: '2px solid var(--organic-text)' }}
    >
      <span className="text-xs font-bold tracking-[.1em] uppercase text-[var(--organic-terracotta-700)]">{kicker}</span>
      <span
        className="text-xs font-semibold tracking-[.1em] uppercase"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}
      >
        {note}
      </span>
    </div>
  )
}
