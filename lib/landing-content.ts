export const CHANNELS = ['Instagram DMs', 'WhatsApp chats', 'Messenger inbox'] as const

export interface FlowNode {
  id: string
  label: string
  sub: string
  x: number
  y: number
  tone: 'a' | 's'
  desc: string
}

export const FLOW_NODES: FlowNode[] = [
  { id: 'trigger', label: 'Trigger', sub: 'DM shows buying intent', x: 20, y: 60, tone: 'a', desc: 'Fires when a new Instagram DM matches your intent — no keyword lists, the AI reads meaning.' },
  { id: 'ai', label: 'AI reply', sub: 'Trained on your brand', x: 240, y: 20, tone: 'a', desc: 'Answers in your voice with live product data. You approve the tone once; it holds it.' },
  { id: 'qualify', label: 'Qualify', sub: 'Ready to buy?', x: 240, y: 200, tone: 's', desc: 'Scores the conversation. High intent moves on to capture; anything unusual goes to a human.' },
  { id: 'capture', label: 'Capture lead', sub: 'Email → CRM', x: 460, y: 140, tone: 'a', desc: 'Asks naturally for the email and syncs it to your CRM with the full transcript attached.' },
  { id: 'handoff', label: 'Handoff', sub: 'To shared inbox', x: 460, y: 296, tone: 's', desc: 'One tap moves the thread to your team inbox with AI-drafted context waiting.' },
]

export interface FlowStep {
  node: string
  kind: 'in' | 'out' | 'sys'
  text: string
}

export const FLOW_STEPS: FlowStep[] = [
  { node: 'trigger', kind: 'in', text: 'Hi! Price for the ceramic mug set?' },
  { node: 'ai', kind: 'out', text: 'Hey Maya — the set of four is $48, free shipping this week. Want the link?' },
  { node: 'qualify', kind: 'in', text: 'Yes please!' },
  { node: 'capture', kind: 'out', text: 'Sent! Want a 10% code for your next order? Just drop your email.' },
  { node: 'capture', kind: 'in', text: 'maya@homefolk.co' },
  { node: 'capture', kind: 'sys', text: 'Lead captured · synced to CRM' },
]

export const LOGO_STRIP = ['Homefolk', 'Sundial', 'Kettle&Co', 'RELAY SOCIAL', 'Moonrise', 'Fable', 'Petal & Stem']

export const METRICS = [
  { value: '480M', label: 'Messages automated' },
  { value: '+38%', label: 'Average conversion lift' },
  { value: '2.1s', label: 'Median reply time' },
  { value: '82%', label: 'Resolved without a human' },
]

export interface Feature {
  title: string
  body: string
  tone: 'a' | 's'
}

export const FEATURES: Feature[] = [
  { title: 'AI that sounds like you', tone: 'a', body: "Train it on your site, your FAQ and your last hundred conversations. It answers with your prices, your policies, your jokes — not chatbot filler." },
  { title: 'Flows you draw, not code', tone: 's', body: 'Drag five nodes, connect them, go live. What takes an afternoon in legacy tools takes minutes here — and the AI fills the gaps between your branches.' },
  { title: 'Leads that file themselves', tone: 'a', body: 'Emails, phone numbers and buying intent get captured mid-conversation and synced to your CRM with the full transcript. Nothing to export, ever.' },
  { title: 'Broadcasts that re-engage', tone: 's', body: 'Win-back messages, drop announcements and abandoned-cart nudges — sent inside policy windows so your account stays safe and your open rates stay at 80%+.' },
  { title: 'One inbox for the team', tone: 'a', body: 'Every channel lands in one shared inbox. When the AI hands off, your teammate gets the thread with context already drafted — no "as I mentioned above."' },
  { title: 'Analytics in revenue, not clicks', tone: 's', body: 'See which flow made money, which reply lost the sale, and what your audience keeps asking for. Reports your client actually wants to read.' },
]

export interface ChannelInfo {
  title: string
  body: string
  tone: 'a' | 's'
}

export const CHANNEL_INFO: ChannelInfo[] = [
  { title: 'Instagram DM', tone: 'a', body: 'Story replies, comment triggers, DM automation — the whole funnel from a post to a purchase without leaving the app.' },
  { title: 'WhatsApp', tone: 's', body: 'Official Business API — verified sender, catalogs, payments and broadcast templates approved and managed for you.' },
  { title: 'Messenger', tone: 'a', body: 'Page inbox, ad click-to-message and recurring notifications — the quiet workhorse channel your competitors forgot about.' },
]

export interface Testimonial {
  quote: string
  initials: string
  name: string
  role: string
  tone: 'a' | 's'
}

export const TESTIMONIALS: Testimonial[] = [
  { quote: 'We moved 14 client accounts over in a week. Reply time went from hours to seconds, and our retainers renew themselves now.', initials: 'DK', name: 'Dana K.', role: 'Founder, Relay Social — agency', tone: 'a' },
  { quote: "The AI answered 82% of our DMs during the holiday drop. We didn't hire a single seasonal rep — and sales were up 41%.", initials: 'TR', name: 'Tomás R.', role: 'Co-founder, Sundial Goods — e-commerce', tone: 's' },
  { quote: "I post, I sleep, my DMs sell the course. It genuinely sounds like me — my audience can't tell, and honestly neither can I.", initials: 'PS', name: 'Priya S.', role: 'Creator, 890k followers', tone: 'a' },
]

export const COMPARISON_ROWS: [string, string, string][] = [
  ['Replies', 'AI-native, in your brand voice', 'Keyword triggers and canned menus'],
  ['Building a flow', 'Draw it in minutes; AI fills the gaps', 'Hours of branching for every edge case'],
  ['Lead capture', 'Automatic, synced to CRM with transcript', 'Manual tags and CSV exports'],
  ['When the bot is stuck', 'Confident handoff to a shared team inbox', '"Sorry, I didn\'t understand that."'],
  ['Pricing', 'Flat plans, predictable', 'Per-contact fees that creep every month'],
]

export interface PricingTier {
  tag: string
  tone: 'neutral' | 'a' | 's'
  priceMonthly: string
  priceAnnual: string
  period: string
  features: string[]
  cta: string
  highlighted?: boolean
}

export const PRICING_TIERS: PricingTier[] = [
  {
    tag: 'Free',
    tone: 'neutral',
    priceMonthly: '$0',
    priceAnnual: '$0',
    period: 'forever · 1 channel',
    features: ['1,000 contacts', 'Visual flow builder', 'Basic AI replies (100/mo)', 'Lead capture'],
    cta: 'Start free',
  },
  {
    tag: 'Pro',
    tone: 'a',
    priceMonthly: '$29',
    priceAnnual: '$24',
    period: 'per month · all 3 channels',
    features: ['10,000 contacts', 'Unlimited flows & broadcasts', 'Full AI replies, trained on your brand', 'CRM sync + integrations', 'Free migration from legacy tools'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    tag: 'Premium',
    tone: 's',
    priceMonthly: '$79',
    priceAnnual: '$65',
    period: 'per month · teams & agencies',
    features: ['Unlimited contacts', 'Shared team inbox, 10 seats', 'Agency workspaces & client reports', 'Priority support & onboarding'],
    cta: 'Book a demo',
  },
]

export const FAQ_ITEMS = [
  {
    q: 'How is this different from ManyChat-style tools?',
    a: 'Legacy tools make you script every branch with keywords. Instaflow starts from an AI that already understands your business — flows steer it, they don\'t replace it. You build in minutes and it handles the questions you never scripted.',
  },
  {
    q: 'Will the AI actually sound like my brand?',
    a: 'You connect your site, FAQ and past conversations, then approve a handful of sample replies. From there it holds your tone — and every edit you make in the inbox trains it further.',
  },
  {
    q: "What happens when the AI can't answer?",
    a: 'It never bluffs. Below its confidence threshold, the thread moves to your shared inbox with a drafted reply and full context. Customers get a human; you get a head start.',
  },
  {
    q: 'Is it compliant with Meta and WhatsApp policies?',
    a: "Yes — we're built on the official APIs only. Messaging windows, template approvals and opt-in rules are enforced by the platform automatically, so your account never gets flagged.",
  },
  {
    q: 'Can I migrate my existing flows?',
    a: 'On any paid plan we migrate them for you — flows, contacts, tags and automations — usually within two business days. Your old bot keeps running until the switch is live.',
  },
]
