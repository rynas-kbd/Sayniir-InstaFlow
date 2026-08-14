export const plans = {
  free: {
    label: 'Free',
    description: 'To discover Instaflow before getting started.',
    features: ['1,000 contacts', 'Visual flow builder', 'Basic AI replies (100/month)', 'Lead capture'],
  },
  starter: {
    label: 'Starter',
    description: 'To get started and automate your first account.',
    features: [
      '1 connected account (Instagram, Messenger, or WhatsApp)',
      'Unified inbox',
      'Unlimited flows',
      'Basic CRM (contacts, tags)',
    ],
  },
  pro: {
    label: 'Pro',
    description: 'For active shops and creators who want AI.',
    features: [
      '3 connected accounts',
      'AI agents (Q&A, qualification, order taking)',
      'Broadcast campaigns',
      'Advanced analytics',
      'Everything in Starter',
    ],
  },
  business: {
    label: 'Business',
    description: 'For agencies and multiple accounts.',
    features: [
      'Unlimited accounts',
      'Multiple users',
      'Priority support',
      'Custom integrations',
      'Everything in Pro',
    ],
  },
}
