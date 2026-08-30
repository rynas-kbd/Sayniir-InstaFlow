import { common } from './common'
import { languagePicker } from './languagePicker'
import { nav } from './nav'
import { appearance } from './appearance'
import { onboarding } from './onboarding'
import { onboardingActivation } from './onboardingActivation'
import { settingsAccount } from './settingsAccount'
import { billing } from './billing'
import { billingBanner } from './billingBanner'
import { copilotSettings } from './copilotSettings'
import { teamMembers } from './teamMembers'
import { auth } from './auth'
import { dashboard } from './dashboard'
import { analytics } from './analytics'
import { accounts } from './accounts'
import { inbox } from './inbox'
import { contacts } from './contacts'
import { flows } from './flows'
import { automation } from './automation'
import { campaigns } from './campaigns'
import { boutique } from './boutique'
import { admin } from './admin'
import { shared } from './shared'
import { errors } from './errors'
import { plans } from './plans'
import { rdv } from './rdv'
import { leads } from './leads'
import { copilot } from './copilot'
import { landing } from './landing'

/**
 * French is the source of truth for the dictionary shape. `en` and `ar`
 * import `Dictionary` from here and TypeScript refuses to compile if either
 * is missing a key — that's the completeness check for this hand-rolled
 * i18n setup (see lib/i18n/translate.ts).
 */
export const fr = {
  common,
  languagePicker,
  nav,
  appearance,
  onboarding,
  onboardingActivation,
  settingsAccount,
  billing,
  billingBanner,
  copilotSettings,
  teamMembers,
  auth,
  dashboard,
  analytics,
  accounts,
  inbox,
  contacts,
  flows,
  automation,
  campaigns,
  boutique,
  admin,
  shared,
  errors,
  plans,
  rdv,
  leads,
  copilot,
  landing,
}

export type Dictionary = typeof fr
