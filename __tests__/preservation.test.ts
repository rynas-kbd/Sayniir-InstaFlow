/**
 * Preservation Property Tests — Functional Behavior Unchanged
 *
 * Property 2: Preservation — Functional Behavior Unchanged
 *
 * These tests MUST PASS on unfixed code. They establish the baseline of
 * functional patterns that must survive the visual redesign.
 *
 * Approach: static source-code analysis. Each test scans a file's source for
 * the presence of required functional patterns (auth calls, API calls, routing
 * calls, form attributes, searchParams destructuring). If a pattern is present
 * now, it must remain present after the fix.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..')

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8')
}

function containsPattern(source: string, pattern: string): boolean {
  return source.includes(pattern)
}

// ---------------------------------------------------------------------------
// Preservation checks per file
// ---------------------------------------------------------------------------

/**
 * Each entry describes a file and the functional patterns that MUST be present.
 * Tests assert every pattern exists in the current source.
 */

interface FilePreservationSpec {
  file: string
  description: string
  requiredPatterns: { label: string; pattern: string }[]
}

const PRESERVATION_SPECS: FilePreservationSpec[] = [
  // -------------------------------------------------------------------------
  // app/login/page.tsx — Requirements 3.1, 3.2
  // -------------------------------------------------------------------------
  {
    file: 'app/login/page.tsx',
    description: 'login page auth flow and form attributes',
    requiredPatterns: [
      // Auth call
      { label: 'supabase.auth.signInWithPassword', pattern: 'supabase.auth.signInWithPassword' },
      // Routing
      { label: "router.push('/dashboard')", pattern: "router.push('/dashboard')" },
      // Form submission handler
      { label: 'handleLogin', pattern: 'handleLogin' },
      // Form element attributes
      { label: 'id="email"', pattern: 'id="email"' },
      { label: 'type="email"', pattern: 'type="email"' },
      { label: 'id="password"', pattern: 'id="password"' },
      { label: 'required (email input)', pattern: 'required' },
      { label: 'placeholder="vous@exemple.com"', pattern: 'placeholder="vous@exemple.com"' },
      { label: 'placeholder="••••••••"', pattern: 'placeholder="••••••••"' },
      // Error display
      { label: 'error state display', pattern: '{error &&' },
    ],
  },

  // -------------------------------------------------------------------------
  // app/register/page.tsx — Requirements 3.3
  // -------------------------------------------------------------------------
  {
    file: 'app/register/page.tsx',
    description: 'register page auth flow and form attributes',
    requiredPatterns: [
      // Auth calls
      { label: 'supabase.auth.signUp', pattern: 'supabase.auth.signUp' },
      { label: 'supabase.auth.signInWithOAuth', pattern: 'supabase.auth.signInWithOAuth' },
      // Handlers
      { label: 'handleRegister', pattern: 'handleRegister' },
      { label: 'handleGoogle', pattern: 'handleGoogle' },
      // Google OAuth provider
      { label: "provider: 'google'", pattern: "provider: 'google'" },
      // Auth callback redirect
      { label: 'auth/callback', pattern: 'auth/callback' },
      // Form element attributes
      { label: 'type="email"', pattern: 'type="email"' },
      { label: 'required (register form)', pattern: 'required' },
      { label: 'placeholder="vous@exemple.com"', pattern: 'placeholder="vous@exemple.com"' },
      { label: 'placeholder="Minimum 8 caractères"', pattern: 'placeholder="Minimum 8 caractères"' },
      // Success state
      { label: 'success state', pattern: 'setSuccess(true)' },
      // Error display
      { label: 'error state display', pattern: '{error &&' },
      // Google button id
      { label: 'id="google-signup"', pattern: 'id="google-signup"' },
    ],
  },

  // -------------------------------------------------------------------------
  // app/admin/login/page.tsx — Requirements 3.4
  // -------------------------------------------------------------------------
  {
    file: 'app/admin/login/page.tsx',
    description: 'admin login page auth flow, role check, and form attributes',
    requiredPatterns: [
      // Auth calls
      { label: 'supabase.auth.signInWithPassword', pattern: 'supabase.auth.signInWithPassword' },
      { label: 'supabase.auth.signOut()', pattern: 'supabase.auth.signOut()' },
      // Role check
      { label: "profile.role !== 'admin'", pattern: "profile.role !== 'admin'" },
      // Routing
      { label: "router.push('/admin')", pattern: "router.push('/admin')" },
      // Handler
      { label: 'handleAdminLogin', pattern: 'handleAdminLogin' },
      // Profile query
      { label: ".from('profiles')", pattern: ".from('profiles')" },
      { label: ".select('role')", pattern: ".select('role')" },
      // Form element attributes
      { label: 'id="admin-email"', pattern: 'id="admin-email"' },
      { label: 'type="email"', pattern: 'type="email"' },
      { label: 'id="admin-password"', pattern: 'id="admin-password"' },
      { label: 'required (admin form)', pattern: 'required' },
      { label: 'placeholder="admin@instaflow.app"', pattern: 'placeholder="admin@instaflow.app"' },
      // Error display
      { label: 'error state display', pattern: '{error &&' },
    ],
  },

  // -------------------------------------------------------------------------
  // app/dashboard/page.tsx — Requirements 3.5
  // -------------------------------------------------------------------------
  {
    file: 'app/dashboard/page.tsx',
    description: 'dashboard page Supabase queries and redirect',
    requiredPatterns: [
      // Auth guard
      { label: 'supabase.auth.getUser()', pattern: 'supabase.auth.getUser()' },
      { label: "redirect('/login')", pattern: "redirect('/login')" },
      // Data queries
      { label: ".from('channel_accounts')", pattern: ".from('channel_accounts')" },
      { label: ".from('message_logs')", pattern: ".from('message_logs')" },
      { label: ".from('subscriptions')", pattern: ".from('subscriptions')" },
      { label: ".from('automation_rules')", pattern: ".from('automation_rules')" },
      // Component usage preserved
      { label: 'StatsCard', pattern: 'StatsCard' },
      { label: 'MessageList', pattern: 'MessageList' },
      { label: 'AccountCard', pattern: 'AccountCard' },
      { label: 'ConnectButton', pattern: 'ConnectButton' },
      { label: 'QuickActions', pattern: 'QuickActions' },
    ],
  },

  // -------------------------------------------------------------------------
  // components/dashboard/AutomationClient.tsx — Requirements 3.6
  // -------------------------------------------------------------------------
  {
    file: 'components/dashboard/AutomationClient.tsx',
    description: 'AutomationClient API calls and state management',
    requiredPatterns: [
      // API calls
      { label: "fetch('/api/rules'", pattern: "fetch('/api/rules'" },
      { label: "fetch(`/api/rules/${", pattern: 'fetch(`/api/rules/${' },
      { label: "method: 'POST'", pattern: "method: 'POST'" },
      { label: "method: 'PATCH'", pattern: "method: 'PATCH'" },
      { label: "method: 'DELETE'", pattern: "method: 'DELETE'" },
      // State management
      { label: 'useState (rules)', pattern: 'useState<AutomationRule[]>' },
      { label: 'setRules', pattern: 'setRules' },
      { label: 'setShowModal', pattern: 'setShowModal' },
      // Handlers
      { label: 'handleCreate', pattern: 'handleCreate' },
      { label: 'handleUpdate', pattern: 'handleUpdate' },
      { label: 'handleToggle', pattern: 'handleToggle' },
      { label: 'handleDelete', pattern: 'handleDelete' },
    ],
  },

  // -------------------------------------------------------------------------
  // components/dashboard/AccountCardInteractive.tsx — Requirements 3.7
  // -------------------------------------------------------------------------
  {
    file: 'components/dashboard/AccountCardInteractive.tsx',
    description: 'AccountCardInteractive PATCH /api/accounts/[id] call',
    requiredPatterns: [
      // PATCH call
      { label: 'fetch(`/api/accounts/${account.id}`', pattern: 'fetch(`/api/accounts/${account.id}`' },
      { label: "method: 'PATCH'", pattern: "method: 'PATCH'" },
      { label: 'is_active', pattern: 'is_active' },
      // DELETE call
      { label: "method: 'DELETE'", pattern: "method: 'DELETE'" },
      // router.refresh
      { label: 'router.refresh()', pattern: 'router.refresh()' },
      // Handlers
      { label: 'handleToggle', pattern: 'handleToggle' },
      { label: 'handleDisconnect', pattern: 'handleDisconnect' },
    ],
  },

  // -------------------------------------------------------------------------
  // app/admin/(dashboard)/clients/page.tsx — Requirements 3.8
  // -------------------------------------------------------------------------
  {
    file: 'app/admin/(dashboard)/clients/page.tsx',
    description: 'admin clients page searchParams handling and Supabase queries',
    requiredPatterns: [
      // searchParams destructuring
      { label: 'searchParams', pattern: 'searchParams' },
      { label: 'q = ', pattern: "q = ''" },
      { label: 'roleFilter', pattern: 'roleFilter' },
      // Supabase queries
      { label: ".from('profiles')", pattern: ".from('profiles')" },
      { label: '.order(', pattern: '.order(' },
      { label: '.eq(', pattern: '.eq(' },
      { label: '.or(', pattern: '.or(' },
      // Search query param applied
      { label: 'q.trim()', pattern: 'q.trim()' },
      // Tab filter applied
      { label: "roleFilter !== 'all'", pattern: "roleFilter !== 'all'" },
    ],
  },

  // -------------------------------------------------------------------------
  // components/dashboard/SignOutButton.tsx — Requirements 3.9
  // -------------------------------------------------------------------------
  {
    file: 'components/dashboard/SignOutButton.tsx',
    description: 'SignOutButton calls supabase.auth.signOut() and redirects to /',
    requiredPatterns: [
      { label: 'supabase.auth.signOut()', pattern: 'supabase.auth.signOut()' },
      { label: "router.push('/')", pattern: "router.push('/')" },
      { label: 'handleSignOut', pattern: 'handleSignOut' },
    ],
  },

  // -------------------------------------------------------------------------
  // app/admin/(dashboard)/page.tsx — Requirements 3.5
  // -------------------------------------------------------------------------
  {
    file: 'app/admin/(dashboard)/page.tsx',
    description: 'admin dashboard Supabase count queries',
    requiredPatterns: [
      { label: ".from('subscriptions') totalClients", pattern: ".from('subscriptions')" },
      { label: "count: 'exact'", pattern: "count: 'exact'" },
      { label: ".eq('status', 'active')", pattern: ".eq('status', 'active')" },
      { label: '.lte(', pattern: '.lte(' },
      { label: ".neq('status', 'active')", pattern: ".neq('status', 'active')" },
      // Link to clients
      { label: 'href="/admin/clients"', pattern: 'href="/admin/clients"' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Property-based test: for all files in the preservation spec, every required
// pattern must be present in the source.
// ---------------------------------------------------------------------------

describe('Preservation — Functional Behavior Unchanged', () => {
  /**
   * Property 2 (PBT): For any file in the preservation spec, every required
   * functional pattern must be present in the source.
   *
   * These tests PASS on unfixed code (baseline) and must continue to pass
   * after the visual redesign fix is applied.
   *
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
   */
  it('Property 2: for all files, every required functional pattern is present', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PRESERVATION_SPECS),
        (spec) => {
          const source = readSource(spec.file)
          const missing: string[] = []

          for (const { label, pattern } of spec.requiredPatterns) {
            if (!containsPattern(source, pattern)) {
              missing.push(`  MISSING [${label}]: "${pattern}"`)
            }
          }

          if (missing.length > 0) {
            throw new Error(
              `[PRESERVATION VIOLATION] ${spec.file} is missing required functional patterns:\n${missing.join('\n')}`
            )
          }

          return true
        }
      ),
      { numRuns: PRESERVATION_SPECS.length, verbose: true }
    )
  })

  // -------------------------------------------------------------------------
  // Per-file named tests for clear failure output
  // -------------------------------------------------------------------------

  describe('Per-file preservation checks', () => {
    for (const spec of PRESERVATION_SPECS) {
      describe(spec.file, () => {
        const source = readSource(spec.file)

        for (const { label, pattern } of spec.requiredPatterns) {
          it(`contains "${label}"`, () => {
            expect(
              containsPattern(source, pattern),
              `${spec.file} is missing required pattern [${label}]: "${pattern}"`
            ).toBe(true)
          })
        }
      })
    }
  })

  // -------------------------------------------------------------------------
  // Cross-cutting: supabase.auth.* calls are present in auth files
  // -------------------------------------------------------------------------

  describe('supabase.auth.* calls present in all auth-related files', () => {
    const AUTH_FILES: { file: string; calls: string[] }[] = [
      {
        file: 'app/login/page.tsx',
        calls: ['supabase.auth.signInWithPassword'],
      },
      {
        file: 'app/register/page.tsx',
        calls: ['supabase.auth.signUp', 'supabase.auth.signInWithOAuth'],
      },
      {
        file: 'app/admin/login/page.tsx',
        calls: ['supabase.auth.signInWithPassword', 'supabase.auth.signOut()'],
      },
      {
        file: 'components/dashboard/SignOutButton.tsx',
        calls: ['supabase.auth.signOut()'],
      },
    ]

    it('Property 2 (auth): for all auth files, all supabase.auth.* calls are present', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTH_FILES),
          ({ file, calls }) => {
            const source = readSource(file)
            const missing = calls.filter((call) => !containsPattern(source, call))

            if (missing.length > 0) {
              throw new Error(
                `[AUTH PRESERVATION] ${file} is missing supabase.auth calls:\n  ${missing.join('\n  ')}`
              )
            }

            return true
          }
        ),
        { numRuns: AUTH_FILES.length, verbose: true }
      )
    })
  })

  // -------------------------------------------------------------------------
  // Cross-cutting: fetch('/api/rules/...') calls in AutomationClient
  // -------------------------------------------------------------------------

  describe("fetch('/api/rules/...') calls in AutomationClient", () => {
    it('Property 2 (api): AutomationClient contains all required fetch calls to /api/rules', () => {
      const source = readSource('components/dashboard/AutomationClient.tsx')

      const requiredCalls = [
        { label: 'POST /api/rules', pattern: "fetch('/api/rules'" },
        { label: 'PATCH /api/rules/[id]', pattern: 'fetch(`/api/rules/${' },
        { label: 'DELETE /api/rules/[id]', pattern: 'fetch(`/api/rules/${' },
      ]

      for (const { label, pattern } of requiredCalls) {
        expect(
          containsPattern(source, pattern),
          `AutomationClient is missing required API call [${label}]: "${pattern}"`
        ).toBe(true)
      }
    })

    it('Property 2 (api): AutomationClient uses all three HTTP methods on /api/rules', () => {
      const source = readSource('components/dashboard/AutomationClient.tsx')

      const methods = ["method: 'POST'", "method: 'PATCH'", "method: 'DELETE'"]
      for (const method of methods) {
        expect(
          containsPattern(source, method),
          `AutomationClient is missing HTTP method: "${method}"`
        ).toBe(true)
      }
    })
  })

  // -------------------------------------------------------------------------
  // Cross-cutting: redirect() / router.push() calls
  // -------------------------------------------------------------------------

  describe('redirect() and router.push() calls are present', () => {
    const ROUTING_CHECKS: { file: string; pattern: string; label: string }[] = [
      { file: 'app/login/page.tsx', pattern: "router.push('/dashboard')", label: 'login → /dashboard' },
      { file: 'app/admin/login/page.tsx', pattern: "router.push('/admin')", label: 'admin login → /admin' },
      { file: 'components/dashboard/SignOutButton.tsx', pattern: "router.push('/')", label: 'sign out → /' },
      { file: 'app/dashboard/page.tsx', pattern: "redirect('/login')", label: 'dashboard auth guard → /login' },
      { file: 'app/dashboard/accounts/page.tsx', pattern: "redirect('/login')", label: 'accounts auth guard → /login' },
      { file: 'app/dashboard/settings/page.tsx', pattern: "redirect('/login')", label: 'settings auth guard → /login' },
    ]

    it('Property 2 (routing): for all routing checks, the redirect/push call is present', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ROUTING_CHECKS),
          ({ file, pattern, label }) => {
            const source = readSource(file)

            if (!containsPattern(source, pattern)) {
              throw new Error(
                `[ROUTING PRESERVATION] ${file} is missing routing call [${label}]: "${pattern}"`
              )
            }

            return true
          }
        ),
        { numRuns: ROUTING_CHECKS.length, verbose: true }
      )
    })
  })

  // -------------------------------------------------------------------------
  // Cross-cutting: searchParams / params destructuring
  // -------------------------------------------------------------------------

  describe('searchParams and params destructuring is present', () => {
    it('admin clients page destructures searchParams with q and role', () => {
      const source = readSource('app/admin/(dashboard)/clients/page.tsx')

      expect(containsPattern(source, 'searchParams'), 'searchParams must be present').toBe(true)
      expect(containsPattern(source, "q = ''"), "q = '' default must be present").toBe(true)
      expect(containsPattern(source, 'roleFilter'), 'roleFilter must be present').toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Cross-cutting: form element attributes on all auth forms
  // -------------------------------------------------------------------------

  describe('form element attributes preserved on auth forms', () => {
    const FORM_ATTRIBUTE_CHECKS: {
      file: string
      attributes: { label: string; pattern: string }[]
    }[] = [
      {
        file: 'app/login/page.tsx',
        attributes: [
          { label: 'id="email"', pattern: 'id="email"' },
          { label: 'type="email"', pattern: 'type="email"' },
          { label: 'id="password"', pattern: 'id="password"' },
          { label: 'required', pattern: 'required' },
          { label: 'placeholder email', pattern: 'placeholder="vous@exemple.com"' },
          { label: 'placeholder password', pattern: 'placeholder="••••••••"' },
        ],
      },
      {
        file: 'app/admin/login/page.tsx',
        attributes: [
          { label: 'id="admin-email"', pattern: 'id="admin-email"' },
          { label: 'type="email"', pattern: 'type="email"' },
          { label: 'id="admin-password"', pattern: 'id="admin-password"' },
          { label: 'required', pattern: 'required' },
          { label: 'placeholder admin email', pattern: 'placeholder="admin@instaflow.app"' },
        ],
      },
      {
        file: 'app/register/page.tsx',
        attributes: [
          { label: 'type="email"', pattern: 'type="email"' },
          { label: 'required', pattern: 'required' },
          { label: 'placeholder email', pattern: 'placeholder="vous@exemple.com"' },
          { label: 'placeholder password min', pattern: 'placeholder="Minimum 8 caractères"' },
          { label: 'id="google-signup"', pattern: 'id="google-signup"' },
        ],
      },
    ]

    it('Property 2 (form attrs): for all auth forms, all required attributes are present', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...FORM_ATTRIBUTE_CHECKS),
          ({ file, attributes }) => {
            const source = readSource(file)
            const missing: string[] = []

            for (const { label, pattern } of attributes) {
              if (!containsPattern(source, pattern)) {
                missing.push(`  MISSING [${label}]: "${pattern}"`)
              }
            }

            if (missing.length > 0) {
              throw new Error(
                `[FORM ATTR PRESERVATION] ${file} is missing form attributes:\n${missing.join('\n')}`
              )
            }

            return true
          }
        ),
        { numRuns: FORM_ATTRIBUTE_CHECKS.length, verbose: true }
      )
    })
  })
})
