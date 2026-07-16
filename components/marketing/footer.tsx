import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { href: '/fonctionnalites', label: 'Fonctionnalités' },
      { href: '/pricing', label: 'Tarifs' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/register', label: 'Créer un compte' },
      { href: '/login', label: 'Se connecter' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary">
                <MessageCircle className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold tracking-tight">Sayniir</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Automatisation conversationnelle pour Instagram, Messenger et WhatsApp.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Sayniir</span>
          <span>Instagram · Messenger · WhatsApp</span>
        </div>
      </div>
    </footer>
  )
}
