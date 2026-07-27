import { describe, it, expect } from 'vitest'
import { selectActiveAccount } from '@/lib/accounts/select-active-account'
import { getAccountLabel } from '@/lib/channels/labels'
import type { ActiveAccount } from '@/lib/accounts/active-account'

function account(overrides: Partial<ActiveAccount> & { id: string }): ActiveAccount {
  return {
    platform: 'instagram',
    page_id: null,
    page_name: null,
    page_picture_url: null,
    instagram_username: null,
    phone_number: null,
    is_active: true,
    ...overrides,
  }
}

describe('selectActiveAccount', () => {
  const accountA = account({ id: 'a' })
  const accountB = account({ id: 'b' })
  const accounts = [accountA, accountB]

  it('returns the account matching a valid cookie value', () => {
    expect(selectActiveAccount(accounts, 'b')).toBe(accountB)
  })

  it('falls back to the first account when the cookie id does not exist', () => {
    expect(selectActiveAccount(accounts, 'does-not-exist')).toBe(accountA)
  })

  it("falls back to the first account when the cookie points at another user's account", () => {
    // `accounts` is always pre-scoped to the current user (see
    // listUserAccounts), so a forged cookie naming a real account id that
    // simply isn't in *this* list must never resolve to it.
    expect(selectActiveAccount(accounts, 'someone-elses-account-id')).toBe(accountA)
  })

  it('falls back to the first account when no cookie is set', () => {
    expect(selectActiveAccount(accounts, undefined)).toBe(accountA)
  })

  it('returns null when the user has no connected accounts', () => {
    expect(selectActiveAccount([], 'b')).toBeNull()
  })
})

describe('getAccountLabel', () => {
  it('labels a WhatsApp account by phone number', () => {
    expect(getAccountLabel(account({ id: 'a', platform: 'whatsapp', phone_number: '+213555010203' }))).toBe('+213555010203')
  })

  it('falls back to the platform label when a WhatsApp account has no phone number', () => {
    expect(getAccountLabel(account({ id: 'a', platform: 'whatsapp', phone_number: null }))).toBe('WhatsApp')
  })

  it('labels an Instagram account with @username', () => {
    expect(getAccountLabel(account({ id: 'a', platform: 'instagram', instagram_username: 'maboutique' }))).toBe('@maboutique')
  })

  it('labels a Messenger account by page name', () => {
    expect(getAccountLabel(account({ id: 'a', platform: 'messenger', page_name: 'Ma Page FB' }))).toBe('Ma Page FB')
  })

  it('falls back to the platform label when nothing more specific is available', () => {
    expect(getAccountLabel(account({ id: 'a', platform: 'messenger' }))).toBe('Messenger')
  })
})
