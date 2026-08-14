export const onboardingActivation = {
  checklist: {
    title: "Let's get your automation running",
    stepCounter: 'Three steps, {current}/{total} — you\'ll see a real reply go out at the end.',
    exploreSelf: 'Explore on my own',
    skipIntro: 'Skip the introduction',
  },
  steps: {
    connectChannel: {
      title: 'Connect a channel',
      description: 'Instagram, Messenger, or WhatsApp — just one is enough to get started.',
    },
    createAutomation: {
      title: 'Create your first automation',
      description: 'A pre-filled template based on your goal, ready in one click.',
    },
    testIt: {
      title: 'Test it: watch the reply go out',
      description: 'Simulate an incoming message and watch your automation reply live.',
    },
  },
  simulator: {
    emptyHint: "Write as a real customer would — your active automation will reply live.",
    sending: 'replying…',
    inputPlaceholder: 'Write a message…',
    sendAriaLabel: 'Send',
    genericError: 'Something went wrong.',
    networkError: 'Could not reach the server — please try again.',
    suggestions: {
      hello: 'Hello',
      whatDoYouSell: 'Hi, what do you sell?',
      howMuch: 'How much does it cost?',
    },
  },
  celebration: {
    title: 'It works!',
    description: 'Your automation just replied. This is exactly what will happen with your real customers.',
  },
  pulseSurvey: {
    question: 'What held you back the most this week?',
    dismissAriaLabel: 'Dismiss',
    choices: {
      connectChannel: 'Connecting my channels',
      automationSetup: 'Setting up my automations',
      understandingProduct: 'Understanding how everything works',
    },
  },
}
