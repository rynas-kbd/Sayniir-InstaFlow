'use client'

import Link from 'next/link'
import { Workflow, Package, ShoppingCart, Users, Zap, Megaphone } from 'lucide-react'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'
import { Badge } from '@/components/ui/badge'

interface FlowRow {
  id: string
  name: string
  status: string
}

interface ProductRow {
  id: string
  name: string
  kind: string
  price: number
  currency: string
  stock_quantity: number
  is_active: boolean
}

interface OrderRow {
  id: string
  customer_name: string
  product_name: string
  quantity: number
  total_amount: number
  payment_status: string
  shipping_status: string
}

interface ContactRow {
  id: string
  full_name: string | null
  username: string | null
  is_subscribed: boolean
}

interface AutomationRuleRow {
  id: string
  name: string
  trigger_type: string
  is_active: boolean
}

interface CampaignRow {
  id: string
  name: string
  status: string
}

// Mirrors components/flows/flow-row.tsx's status → tone/label mapping.
const FLOW_STATUS: Record<string, { tone: StatusTone; label: string }> = {
  active: { tone: 'success', label: 'Actif' },
  paused: { tone: 'warning', label: 'En pause' },
  draft: { tone: 'neutral', label: 'Brouillon' },
}

// Mirrors components/boutique/order-table.tsx's status → label mapping.
const PAYMENT_STATUS: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: 'warning', label: 'En attente' },
  paid: { tone: 'success', label: 'Payé' },
  failed: { tone: 'destructive', label: 'Échoué' },
  refunded: { tone: 'neutral', label: 'Remboursé' },
}
const SHIPPING_STATUS: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: 'neutral', label: 'À expédier' },
  shipped: { tone: 'primary', label: 'Expédié' },
  delivered: { tone: 'success', label: 'Livré' },
  cancelled: { tone: 'destructive', label: 'Annulé' },
}

const CAMPAIGN_STATUS: Record<string, { tone: StatusTone; label: string }> = {
  draft: { tone: 'neutral', label: 'Brouillon' },
  scheduled: { tone: 'primary', label: 'Planifiée' },
  sending: { tone: 'warning', label: 'Envoi en cours' },
  sent: { tone: 'success', label: 'Envoyée' },
  cancelled: { tone: 'destructive', label: 'Annulée' },
  failed: { tone: 'destructive', label: 'Échouée' },
}

function CardShell({
  icon: Icon,
  title,
  count,
  isEmpty,
  emptyLabel,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  count: number
  isEmpty: boolean
  emptyLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-[4px] border border-border/50 bg-background/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
        {count > 0 && <span className="text-muted-foreground/60">· {count}</span>}
      </div>
      {isEmpty ? <p className="py-1 text-xs text-muted-foreground">{emptyLabel}</p> : <div className="flex flex-col gap-1.5">{children}</div>}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-2 text-xs">
      {children}
    </div>
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function FlowsCard({ output }: { output: unknown }) {
  const flows: FlowRow[] = isRecord(output) && Array.isArray(output.flows) ? (output.flows as FlowRow[]) : []
  return (
    <CardShell icon={Workflow} title="Flows" count={flows.length} isEmpty={flows.length === 0} emptyLabel="Aucun flow pour le moment.">
      {flows.map((flow) => {
        const status = FLOW_STATUS[flow.status] ?? FLOW_STATUS.draft
        return (
          <Link key={flow.id} href={`/flows/${flow.id}`} className="block">
            <Row>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{flow.name}</span>
              <StatusDot tone={status.tone} label={status.label} className="shrink-0" />
            </Row>
          </Link>
        )
      })}
    </CardShell>
  )
}

function ProductsCard({ output }: { output: unknown }) {
  const products: ProductRow[] = Array.isArray(output) ? (output as ProductRow[]) : []
  return (
    <CardShell icon={Package} title="Produits" count={products.length} isEmpty={products.length === 0} emptyLabel="Aucun produit pour le moment.">
      {products.map((p) => (
        <Row key={p.id}>
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{p.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground">
              {p.price} {p.currency}
            </span>
            {!p.is_active && (
              <Badge variant="secondary" className="text-[10px]">
                Inactif
              </Badge>
            )}
          </div>
        </Row>
      ))}
    </CardShell>
  )
}

function OrdersCard({ output }: { output: unknown }) {
  const orders: OrderRow[] = Array.isArray(output) ? (output as OrderRow[]) : []
  return (
    <CardShell icon={ShoppingCart} title="Commandes" count={orders.length} isEmpty={orders.length === 0} emptyLabel="Aucune commande pour le moment.">
      {orders.map((o) => {
        const payment = PAYMENT_STATUS[o.payment_status] ?? PAYMENT_STATUS.pending
        const shipping = SHIPPING_STATUS[o.shipping_status] ?? SHIPPING_STATUS.pending
        return (
          <Row key={o.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{o.customer_name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {o.product_name} × {o.quantity} — {o.total_amount}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusDot tone={payment.tone} label={payment.label} />
              <StatusDot tone={shipping.tone} label={shipping.label} />
            </div>
          </Row>
        )
      })}
    </CardShell>
  )
}

function ContactsCard({ output }: { output: unknown }) {
  const contacts: ContactRow[] = isRecord(output) && Array.isArray(output.contacts) ? (output.contacts as ContactRow[]) : []
  return (
    <CardShell icon={Users} title="Contacts" count={contacts.length} isEmpty={contacts.length === 0} emptyLabel="Aucun contact trouvé.">
      {contacts.map((c) => (
        <Row key={c.id}>
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
            {c.full_name ?? (c.username ? `@${c.username}` : 'Sans nom')}
          </span>
          <StatusDot
            tone={c.is_subscribed ? 'success' : 'neutral'}
            label={c.is_subscribed ? 'Abonné' : 'Désabonné'}
            className="shrink-0"
          />
        </Row>
      ))}
    </CardShell>
  )
}

function AutomationRulesCard({ output }: { output: unknown }) {
  const rules: AutomationRuleRow[] = isRecord(output) && Array.isArray(output.rules) ? (output.rules as AutomationRuleRow[]) : []
  return (
    <CardShell icon={Zap} title="Règles d'automatisation" count={rules.length} isEmpty={rules.length === 0} emptyLabel="Aucune règle pour le moment.">
      {rules.map((rule) => (
        <Link key={rule.id} href="/automation" className="block">
          <Row>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">{rule.name}</span>
            <StatusDot
              tone={rule.is_active ? 'success' : 'neutral'}
              label={rule.is_active ? 'Active' : 'Inactive'}
              className="shrink-0"
            />
          </Row>
        </Link>
      ))}
    </CardShell>
  )
}

function CampaignsCard({ output }: { output: unknown }) {
  const campaigns: CampaignRow[] = isRecord(output) && Array.isArray(output.campaigns) ? (output.campaigns as CampaignRow[]) : []
  return (
    <CardShell icon={Megaphone} title="Campagnes" count={campaigns.length} isEmpty={campaigns.length === 0} emptyLabel="Aucune campagne pour le moment.">
      {campaigns.map((c) => {
        const status = CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.draft
        return (
          <Link key={c.id} href="/campaigns" className="block">
            <Row>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{c.name}</span>
              <StatusDot tone={status.tone} label={status.label} className="shrink-0" />
            </Row>
          </Link>
        )
      })}
    </CardShell>
  )
}

/**
 * Renders a structured card for the handful of read-only "list/search"
 * tools the model can call (see DISPLAYABLE_TOOLS in lib/ai/loop.ts).
 * Every other tool name falls through to `null` — deliberately silent,
 * exactly like before this component existed (see copilot-panel.tsx).
 */
export function ToolResultCard({ name, output }: { name: string; output: unknown }) {
  switch (name) {
    case 'list_flows':
      return <FlowsCard output={output} />
    case 'list_products':
      return <ProductsCard output={output} />
    case 'list_orders':
      return <OrdersCard output={output} />
    case 'search_contacts':
    case 'list_contacts':
      return <ContactsCard output={output} />
    case 'list_automation_rules':
      return <AutomationRulesCard output={output} />
    case 'list_campaigns':
      return <CampaignsCard output={output} />
    default:
      return null
  }
}
