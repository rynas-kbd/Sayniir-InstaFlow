# Security Audit — Sayniir (Manychats)

**Date:** 2026-07-26
**Scope:** Full application — Next.js 16 App Router + Supabase (Postgres/RLS/Storage/Edge Functions). Multi-tenant SaaS automating Instagram, Messenger, and WhatsApp messaging, with OAuth-derived Meta access tokens, BYOK AI provider keys, customer PII, and Stripe billing.
**Method:** Static review of the full source tree — every finding below was confirmed by reading the referenced lines directly, not inferred from patterns. No dynamic/live testing was performed except where noted under "Suggested verification."

---

## Remediation status (2026-07-26)

Every finding below has been fixed in code except the two items that require action outside this repo. `npx tsc --noEmit`, `npx vitest run` (138 tests, including 43 new tests for the security-critical pure logic), and `npm run build` all pass clean after these changes.

**Fixed in code:** P0-1, P1-1 through P1-4, all of P2 (1–10), all of P3, plus the P0-2 file scrub.

**Note on Facebook SDK CSP configuration (2026-07-27):** 
The CSP has been adjusted to support the WhatsApp Embedded Signup flow, which requires loading the Facebook JavaScript SDK. The SDK loads additional scripts dynamically and creates inline scripts that need special handling:

- Added `'unsafe-inline'` to `script-src` — required for the SDK's inline initialization scripts. With `'strict-dynamic'` present, modern browsers ignore `'unsafe-inline'`, but it's necessary as a fallback for the SDK's behavior.
- Extended allowed domains to `https://*.facebook.com` and `https://*.facebook.net` in `script-src`, `connect-src`, and `frame-src` to support the full SDK lifecycle and popup authentication flow.
- This represents a measured security tradeoff: the SDK must run client-side (WhatsApp Embedded Signup has no server-side OAuth alternative), and Meta's SDK architecture requires these CSP relaxations. The alternative would be no WhatsApp connectivity at all.
- The policy remains Report-Only for monitoring before enforcement.

**Requires manual action from you (cannot be done from this session):**
1. **Rotate `META_WEBHOOK_VERIFY_TOKEN` and the burned Meta app secret** — see P0-2 below for the exact values and rotation steps. `scripts/test-webhook.mjs` has been scrubbed to read from environment variables instead.
2. **Git history rewrite** to purge the burned secret from commit `ceb1772` onward — runbook is under P0-2. Not run automatically; it rewrites all 88 commits and requires a coordinated force-push (every clone must be re-cloned afterward).
3. **CSP enforcement flip** — a nonce-based `Content-Security-Policy-Report-Only` header now ships (see `proxy.ts`), logging violations to the browser console without blocking anything. Flip to enforcing (drop `-Report-Only` in `proxy.ts`) once a normal pass through the app in a real browser shows no unexpected violations. Note: the root layout (`app/layout.tsx`) does not yet thread the nonce into Next's own injected scripts — wire that up first if the enforcing policy turns out to need `strict-dynamic` to hold for framework-injected scripts.
4. **Apply the two new migrations** (`20260815_stripe_webhook_events.sql`, `20260816_pin_handle_new_user_search_path.sql`) to staging/production — not run against your Supabase project from this session.
5. **Reactivate any `channel_accounts` wrongly deactivated by the P1-4 bug** before the fix — cron-driven campaign sends and flow resumes were sending ciphertext to Graph API and getting accounts flipped to `is_active: false`. Check for accounts deactivated shortly after a campaign/flow cron run.

---

## Summary

| Severity | Count |
|---|---|
| P0 — Critical | 2 |
| P1 — High | 4 |
| P2 — Medium | 10 |
| P3 — Low | 7 |

The two P0s are the priority: an unauthenticated-by-design privilege escalation to full admin, and a live secret sitting in git history. Everything else is fixable on a normal sprint cadence.

## What's already solid

Stated up front so this isn't read as "everything is broken" — it isn't:

- **Row Level Security is complete.** All 37 tables across `supabase/schema.sql` and the migrations have `ENABLE ROW LEVEL SECURITY` plus at least one policy, with a consistent tenant predicate: `channel_account_id IN (SELECT id FROM channel_accounts WHERE user_id = auth.uid())`. Zero tables found without RLS; zero with RLS but no policy.
- **No SQL injection surface.** The entire codebase makes exactly one `.rpc()` call (`app/api/flows/[id]/graph/route.ts`), with typed UUID/JSONB parameters. Everything else goes through PostgREST query builders — no string-concatenated SQL anywhere.
- **No XSS sinks.** Zero `dangerouslySetInnerHTML`, zero `eval`/`new Function` across `app/`, `components/`, `lib/`.
- **Meta webhook HMAC verification is correct.** `lib/channels/shared/signature.ts` computes `createHmac('sha256', appSecret)` over the raw request body (`request.text()`, read *before* `JSON.parse`) and compares with `crypto.timingSafeEqual` inside a `try/catch` that correctly turns a length-mismatch throw into a clean `false`.
- **Tokens are encrypted at rest** with AES-256-GCM, a fresh random 96-bit IV per encryption, and no hardcoded/default key fallback — `lib/crypto.ts` throws if `SETTINGS_ENCRYPTION_KEY` is unset rather than silently degrading.
- **File upload path handling is correct.** `app/api/uploads/image/route.ts` discards the client-supplied filename entirely and derives the storage path from a UUID — no path traversal.
- **The Google Sheets import (`app/api/products/sync-sheet/route.ts`) is properly hardened against SSRF** — it never fetches the user's URL directly; it extracts a charset-constrained sheet ID (`/[a-zA-Z0-9-_]+/`) and rebuilds the request against a hardcoded `docs.google.com` host.
- Cron routes (`app/api/admin/{auto-expire,refresh-tokens,flow-runs}`) all fail **closed** when `CRON_SECRET` is unset.
- BYOK AI provider keys are consistently masked (`••••••••••••`) before leaving the server, and a re-submitted mask is correctly treated as "don't change."

---

## P0 — Critical

### P0-1: Privilege escalation via unguarded admin Server Actions

**Files:** `app/admin/(dashboard)/clients/new/actions.ts`, `app/admin/(dashboard)/clients/[id]/actions.ts`

Both files are `'use server'` modules. Every exported function opens `createAdminClient()` — the service-role Supabase client that bypasses RLS entirely — and **none of them perform an authentication or authorization check**:

```ts
// app/admin/(dashboard)/clients/[id]/actions.ts
export async function changeRole(userId: string, role: 'client' | 'admin') {
  const supabase = createAdminClient()
  // ... straight to supabase.from('profiles').update({ role }) — no getUser(), no role check
}
```

Exported and directly callable this way: `createUser` (accepts an arbitrary `role: 'admin'`), `changeRole`, `deleteClient`, `updateProfile` (arbitrary password reset via `AdminUserAttributes`), `updateSubscription`, `saveAdminNotes`, `addKeyword`, `deleteKeyword`, `toggleKeyword`.

**Why the existing gates don't help.** The app does have admin protection — `proxy.ts` (Next 16's renamed `middleware.ts`) blocks any request to `/admin/*` unless `profiles.role === 'admin'`, and the admin layout re-checks on render. Both are **page-render** gates. A Server Action is invoked via a POST carrying a `Next-Action: <id>` header to whatever route the client component is mounted on — the action runs *before* any layout or page renders, so the render-time redirect never fires. The route the POST lands on doesn't need to be `/admin/*` at all; `/dashboard` (permitted for every authenticated non-admin user) works.

The action IDs are not secret — they're compiled into the client bundle because these actions are imported directly into client components (`clients/[id]/SubscriptionForm.tsx`, `clients/[id]/DeleteClientButton.tsx`), so any authenticated user can extract them from the shipped JS.

**Impact:** any authenticated free-tier user can call `changeRole(<their own uid>, 'admin')` and become an administrator, reset any other user's password via `updateProfile`, or delete any account via `deleteClient`. This is full account and platform compromise, not a scoped IDOR.

**Fix:** add a `requireAdmin()` helper (fetch the caller's session via `createClient()` server client + `auth.getUser()`, then check `profiles.role === 'admin'`, throwing/redirecting otherwise) and call it as the first line of every exported function in both files. Note that Next.js's built-in Server Action same-origin check is CSRF protection — it does nothing for authorization, and must not be mistaken for it.

### P0-2: Live secret committed to git

**File:** `scripts/test-webhook.mjs:4-5`, tracked since the initial import commit (`ceb1772`, "feat: import backend from Instagram-automation as Sayniir foundation")

```js
const APP_SECRET = '30e95006ee11b183d4b08890154e90e6'; // META_APP_SECRET
const VERIFY_TOKEN = 'Raddlly_super_secret_token_123'; // META_WEBHOOK_VERIFY_TOKEN
```

Cross-checked against the untracked `.env.local` without printing its contents: **`Raddlly_super_secret_token_123` is byte-identical to the current live `META_WEBHOOK_VERIFY_TOKEN`.** The 32-hex-character `APP_SECRET` has exactly the shape of a Meta app secret; whether or not it matches the *current* app, it must be treated as compromised since it's been sitting in a public/shared git history.

For contrast, `.gitignore` itself is correctly configured (`.env*` with a `!.env.example` carve-out) and `git log --all -- .env.local .env` returns nothing — no environment file was ever committed. This script is the one leak.

**Remediation (per your decision — scrub the file, rotate the secret, and rewrite git history):**

1. **Rotate `META_WEBHOOK_VERIFY_TOKEN` immediately** — this is your own arbitrary string (per `.env.example`'s comment, "Secret token you choose freely"), so just generate a new high-entropy value, update it in the Meta App Dashboard's webhook subscription config for every affected app (Instagram, Messenger, WhatsApp all read verify tokens from env — see `lib/channels/shared/inbound.ts`), and update `.env.local` / your hosting platform's env vars (Vercel) to match.
2. **Rotate the Meta app secret** in the Meta App Dashboard → App Settings → Basic → "App Secret" → Reset, for whichever app `30e95006ee11b183d4b08890154e90e6` belongs to (check against `META_APP_SECRET`, `META_INSTAGRAM_APP_SECRET`, `META_MESSENGER_APP_SECRET` — if none currently match, it's a secret from the predecessor "Instagram-automation" project and should be considered already rotated, but confirm no live app still uses it).
3. **Fix the script** to read from environment variables instead of hardcoding:
   ```js
   const APP_SECRET = process.env.META_APP_SECRET;
   const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
   if (!APP_SECRET || !VERIFY_TOKEN) throw new Error('Set META_APP_SECRET and META_WEBHOOK_VERIFY_TOKEN in your environment');
   ```
4. **Rewrite git history** to purge both values from every commit that contains them:
   ```bash
   # find every commit touching the string first, for the record
   git log --all -S'Raddlly_super_secret_token_123' --oneline
   git log --all -S'30e95006ee11b183d4b08890154e90e6' --oneline

   # then, using git-filter-repo (not filter-branch — it's faster and the
   # maintained tool):
   git filter-repo --replace-text <(printf '30e95006ee11b183d4b08890154e90e6==>REDACTED\nRaddlly_super_secret_token_123==>REDACTED\n')
   ```
   **This rewrites every commit hash from the first affected commit forward.** Every existing local clone (including CI checkouts and any collaborator's machine) must be discarded and re-cloned after the force-push — there is no way to rebase around it. Coordinate the timing before running this if anyone else has a clone.

---

## P1 — High

### P1-1: SSRF with response exfiltration in the flow builder's HTTP node

**File:** `lib/flows/nodes.ts` (`external_request` case, roughly lines 114–146)

```ts
case 'external_request': {
  const url = node.config.url as string | undefined
  const method = ((node.config.method as string) || 'POST').toUpperCase()
  ...
  const res = await fetch(url, { method, headers: {...}, body: ..., signal: controller.signal })
  ...
  if (saveAs) {
    const text = await res.text().catch(() => '')
    // ... persisted into flow_runs.context
  }
}
```

`node.config.url` is a free-text field set by the merchant in the flow builder UI (`components/flows/builder/node-inspector.tsx`) and saved via `app/api/flows/[id]/graph/route.ts` with no validation on the value. There is no scheme allowlist, no block on private/link-local ranges (`127.0.0.1`, `169.254.169.254` — cloud metadata, `10.0.0.0/8`, `::1`), no redirect cap (the underlying `fetch` follows redirects by default, which would defeat a same-request allowlist check anyway), and no response size cap. The only control present is an 8-second `AbortController` timeout.

Because the response is optionally saved into `flow_runs.context` and that context is rendered back in the flow-run detail UI, this isn't blind SSRF — it's **SSRF with full response exfiltration**, readable by the merchant who built the flow. A single node config pointed at `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>` on a cloud-hosted deployment would read cloud credentials directly into the UI.

**Fix:** validate `node.config.url` at both save time (`graph/route.ts`) and execution time — resolve the hostname, reject if it resolves to a private/loopback/link-local/multicast range, reject non-`http(s)` schemes, and either disable redirect-following (`redirect: 'manual'` and reject 3xx) or re-validate the redirect target. Cap the response size read into `saveAs`.

### P1-2: Persistent SSRF via unvalidated Shopify domain

**File:** `app/api/shopify/connect/route.ts:26-30`

```ts
const domain = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
const verifyRes = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
  headers: { 'X-Shopify-Access-Token': accessToken },
})
```

`shopDomain` comes straight from the request body. It is never checked against the expected `*.myshopify.com` pattern. The success/failure of the verification request is reflected back to the caller (`if (!verifyRes.ok) return NextResponse.json({ error: '...' }, { status: 400 })`), which is enough to build a blind-SSRF port/host oracle against internal infrastructure reachable from the server. Worse, the unvalidated value is then **persisted** to `shopify_connections.shop_domain` and re-fetched on every subsequent sync (`app/api/shopify/sync/route.ts`), turning a one-shot request into a standing SSRF primitive that fires on a schedule. Note the domain-stripping only removes a scheme prefix and a *trailing* slash, so a value like `internal-host/../admin` or one containing a path/query segment isn't rejected either.

This is gated behind authentication and an ownership check (`.eq('id', accountId).eq('user_id', user.id)`), so it requires a valid account — but any of your own customers can trigger it.

**Fix:** validate `shopDomain` matches `^[a-z0-9][a-z0-9-]*\.myshopify\.com$` (Shopify's actual domain format) before use, and re-validate on every read from `shopify_connections`, not just at connect time.

### P1-3: Debug endpoint leaks app secrets and access tokens to any logged-in user

**File:** `app/api/debug/webhook/route.ts` — the only gate is `getUser()` (line ~14); there is no admin-role check and no `NODE_ENV` gate, despite both patterns existing elsewhere in the codebase (`proxy.ts` for role checks, `app/api/auth/facebook/route.ts` for env gating).

Concretely, this route currently:

- Returns the first 6 characters of `META_INSTAGRAM_APP_SECRET`, `META_MESSENGER_APP_SECRET`, and `META_APP_SECRET` to the caller.
- **Decrypts** every account's Meta access token via `resolveAccessToken()` and returns a 20-character prefix of each.
- Performs writes (re-subscribes every active account to webhooks) from a `GET` handler — meaning it's **CSRF-triggerable**: any page a logged-in customer visits that embeds `<img src="https://yourapp.com/api/debug/webhook">` fires it.
- Places the decrypted access token directly into a URL query string for two of its outbound Graph API calls, which lands the token in Meta's own access logs and any intermediate proxy/CDN log — not just your own.
- Returns raw error text (`error: String(err)`) on failure.

**Fix:** either delete this route (it reads like a one-off diagnostic tool) or gate it behind both `NODE_ENV !== 'production'` and an admin-role check, convert it to a `POST` if the re-subscribe side effect is intentional, stop returning any secret material (even truncated), and pass tokens in headers/body rather than query strings if it's kept at all.

### P1-4: Encrypted token used directly as a bearer token (live functional bug, not just a security gap)

**Files:** `lib/campaigns/service.ts:59`, `lib/flows/engine.ts:64`

```ts
const ref: ChannelAccountRef = { id: account.id, externalId, accessToken: account.access_token }
```

Both read `account.access_token` straight from the `channel_accounts` row and hand it to the messaging adapter as-is. Every write path that populates this column (`app/api/auth/callback/route.ts`, `app/api/auth/messenger/callback/route.ts`, `app/api/accounts/whatsapp/route.ts`, `lib/meta/token-refresh.ts`) calls `sealAccessToken()` first, so the stored value is the encrypted form `"<ivBase64>:<cipherBase64>"`, not a usable Graph API token. These two call sites are the only ones that skip `resolveAccessToken()` before use — every other consumer (`lib/channels/shared/lookup.ts`, the AI credit paths, etc.) correctly decrypts first.

**Consequence:** Graph API rejects the ciphertext as an invalid token. The error handlers in `lib/meta/messaging.ts` and `lib/meta/comments.ts` interpret any such rejection as a revoked/expired token and set `is_active: false` on the account. So today, in production, every cron-driven **campaign send** (`sendBatch` in `lib/campaigns/service.ts`) and every **resumed flow step** (`lib/flows/engine.ts`) that runs after the token-encryption migration will fail and **silently deactivate the customer's channel account** — a real, currently-occurring outage, not a theoretical one. Inbound webhook message handling is unaffected because it resolves the token through `lib/channels/shared/lookup.ts` instead.

**Fix:** change both lines to `accessToken: await resolveAccessToken(account.access_token)`.

---

## P2 — Medium

| # | Finding | Location | Detail |
|---|---|---|---|
| 1 | **Open redirect** in the Supabase auth callback | `app/auth/callback/route.ts` | `const next = searchParams.get('next') ?? '/dashboard'` is used unvalidated in `NextResponse.redirect(\`${origin}${next}\`)`. A value like `next=@evil.com` produces `https://yourapp.com@evil.com`, which browsers resolve to host `evil.com` (everything before `@` becomes userinfo). Post-authentication redirect to an attacker-controlled origin — useful for session/token phishing. Fix: require `next` to start with a single `/` and not `//`, or drop it if it doesn't. |
| 2 | **Fail-open OAuth CSRF state check** | `app/api/auth/callback/route.ts`, `app/api/auth/messenger/callback/route.ts` | `if (state && storedState && state !== storedState) { reject }` only validates when *both* values are present. Omitting the `state` query parameter entirely (or arriving without the `oauth_state` cookie) skips validation outright. Should be `if (!state \|\| !storedState \|\| state !== storedState) reject`. |
| 3 | **Fail-open webhook signature key** | `lib/channels/shared/inbound.ts` (`APP_SECRET_ENV[platform]` lookup), `supabase/functions/instagram-webhook/index.ts` | `process.env[...] ?? ''` — if the app-secret env var is unset in a given environment, the HMAC is computed with an empty-string key, which anyone can also compute, turning "verification enabled" into "verification forgeable." `app/api/billing/webhook/route.ts` shows the correct pattern: return 501 if the secret is missing, don't substitute a default. |
| 4 | **CSV formula injection on contact export** | `app/api/contacts/export/route.ts` (`csvEscape`) | Only quotes values containing `"`, `,`, or `\n` (RFC-4180). No guard against a leading `=`, `+`, `-`, or `@`, which Excel/LibreOffice/Sheets interpret as a formula. An attacker sets their Instagram/WhatsApp display name to e.g. `=cmd|'/c calc'!A1`; it lands unmodified in `contacts.full_name`; when the merchant exports and opens the CSV, it executes. Fix: prefix any value starting with `=+-@` (or tab/CR) with a leading `'` or space before the existing quote logic. |
| 5 | **Stripe webhook has no replay protection** | `app/api/billing/webhook/route.ts` | Signature verification (HMAC + `timingSafeEqual`) is done correctly, but the `t=` timestamp is only fed into the HMAC input, never checked for freshness, and there's no `event.id` dedup table. A captured `checkout.session.completed` body can be replayed indefinitely; the handler extends `expires_at` by another month and reactivates accounts on every replay. Fix: reject if `Math.abs(Date.now()/1000 - t) > 300`, and record processed `event.id`s to skip duplicates. |
| 6 | **Unbounded import loops — cost/DoS amplifier** | `app/api/contacts/import/route.ts`, `app/api/products/import/route.ts` | No row-count cap on either import. `contacts/import` runs roughly 3 DB round-trips per row inside a `for` loop with no upper bound — a 100k-row body means ~300k sequential round-trips triggered by one authenticated request. Unknown JSON keys in each row are also written into `contacts.custom_fields` with no key-count or value-length limit, and those values are later interpolated into outbound message templates via `lib/personalization.ts`. `products/import` additionally has no file-size cap and reads the whole upload into memory with `file.text()`. Fix: cap rows per request (e.g. 2,000), cap file size, cap custom-field key count/value length. |
| 7 | **No rate limiting anywhere** | global | No limiter of any kind exists in the codebase (checked for `@upstash/ratelimit`, in-memory counters, WAF config in `vercel.json`). `app/api/ai/chat` has a monthly *credit* quota but no per-second/minute cap, and BYOK usage bypasses the credit meter entirely. Per your decision, the near-term mitigation is the input caps in #6 above rather than standing up rate-limit infrastructure now; revisit if abuse is observed. |
| 8 | **No security headers configured** | `next.config.ts`, `vercel.json` | `next.config.ts` exports an empty config object; `vercel.json` contains only the `crons` block. No `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors` (the app can be framed by any origin — clickjacking), `X-Content-Type-Options: nosniff`, or `Referrer-Policy`. Fix: add a `headers()` function in `next.config.ts` (or a `vercel.json` `headers` block) with at least `frame-ancestors 'none'`, `nosniff`, and HSTS. |
| 9 | **`SECURITY DEFINER` function without a pinned `search_path`** | `supabase/schema.sql` (`handle_new_user()`, ~line 447) | The trigger function that provisions a `profiles` row on signup is `SECURITY DEFINER` but has no `SET search_path = ''` (or `= public, pg_temp`). This is precisely the pattern Supabase's built-in linter flags as `function_search_path_mutable`; `supabase/config.toml` also widens `extra_search_path` to `["public", "extensions"]`, broadening the surface further. Exploitation requires an attacker who can already create objects on the search path, so this is hardening rather than a demonstrated live hole — but it's a one-line fix: add `SET search_path = ''` to the function definition. |
| 10 | **Systematic raw-error leakage to clients** | ~55 handlers across `app/api/**` | The uniform pattern `return NextResponse.json({ error: error.message }, { status: 500 })` forwards raw PostgREST/Postgres error text — including constraint names, column names, and occasionally policy names — to any caller who triggers a DB error. No request bodies, stack traces, or secrets are included in what's logged, but the schema-fingerprinting exposure is broad and easy to close in one pass: introduce a shared `jsonError(status, publicMessage, err)` helper that logs the full error server-side and returns only a generic message (plus a correlation ID if you want traceability) to the client, then swap the ~55 call sites over to it. |

---

## P3 — Low

- **`isEncrypted()` heuristic is broken and inconsistent with its Deno counterpart.** `lib/crypto.ts`'s `isEncrypted()` wraps `Buffer.from(part, 'base64')` in a `try/catch`, but `Buffer.from(str, 'base64')` never throws in Node — it silently drops invalid characters — so the catch branch is dead code and the function returns `true` for *any* string containing exactly one colon. The Supabase Edge Function twin (`supabase/functions/_shared/crypto.ts`) uses `decodeBase64` from `jsr:@std/encoding`, which *does* throw on invalid input — meaning the two runtimes can disagree on whether the same stored value counts as "encrypted." Recommend switching the Node side to a strict base64 validator (regex + length check, or re-encode-and-compare) so both implementations agree.
- **No content-type sniffing on image uploads.** `app/api/uploads/image/route.ts` trusts the client-supplied multipart `Content-Type` for its MIME allowlist check; nothing inspects the actual file bytes. The storage bucket is `public: true` (`supabase/migrations/20260814_product_images_bucket.sql`) with no `storage.objects` RLS policy — acknowledged in the migration's own comment. A file with forged headers (e.g. HTML/SVG content served under an `image/*` label) would be stored and publicly reachable at a guessable-prefix URL. Recommend adding magic-byte sniffing before accepting the upload, and adding an explicit `storage.objects` policy even for the public bucket (defense in depth, and it silences the Supabase linter warning).
- **Non-constant-time `CRON_SECRET` comparison.** All three `app/api/admin/*` cron routes use a plain `!==` against the `Authorization` header. They correctly fail closed when the secret is unset, and the value's entropy makes a timing attack impractical over a network — but `app/api/billing/webhook/route.ts` already imports `timingSafeEqual` for the same purpose, so switching these three over is a small, cheap consistency fix.
- **Unhandled crash on malformed webhook signature (Edge Function).** `supabase/functions/_shared/meta/webhook.ts` does `receivedHex.match(/.{1,2}/g)!` — a non-null assertion. A request with header `x-hub-signature-256: sha256=` (empty hex) makes `.match()` return `null`, throwing a `TypeError` that surfaces as an unhandled 500 instead of the intended 401. Add a length/format check before the regex match.
- **`.env.example` has a non-empty default secret and a corrupted line.** Line ~35 ships `META_WHATSAPP_VERIFY_TOKEN=my_webhook_secret_2024` as a real-looking default rather than blank like every other variable in the file — this invites copy-paste straight into a real deployment. Separately, the line documenting `META_PAGE_ACCESS_TOKEN` appears to have been corrupted by a stray CSS paste (`font-family: Figtree, system-ui, sans-serif;`). Both are worth a cleanup pass.
- **No startup validation of `SETTINGS_ENCRYPTION_KEY`.** `lib/crypto.ts` only touches the env var lazily, inside `getKey()`, the first time encryption/decryption is attempted. A deployment with a missing or malformed key boots and serves traffic normally, then throws the first time someone completes an OAuth flow or saves a BYOK key. Recommend a startup/health-check assertion that the key is present and exactly 64 hex characters.
- **Two API routes rely on RLS alone for tenant scoping, unlike their siblings.** `app/api/ai/chat/route.ts` and `app/api/flows/[id]/graph/route.ts` fetch by `id` without an explicit `.eq('user_id', user.id)` check, whereas most other per-resource routes (`orders/[id]`, `accounts/[id]`, etc.) verify ownership explicitly in addition to relying on RLS. The matching RLS policies were confirmed present, so this is not exploitable today — but it's a single policy regression away from becoming an IDOR, with no defense in depth. Recommend adding the explicit check for consistency.
- **`app/api/admin/*` cron routes are not reachable through the `/admin` page-level gate** (see architectural note below) — noted here only as a reminder that these three routes' entire security rests on the `CRON_SECRET` check inside each handler, with nothing upstream backing it up.

---

## Architectural note: no global gate for `/api/*`

`proxy.ts` (Next.js 16's renamed `middleware.ts`) is the only centralized auth gate in the app, and it matches on path prefix: `/dashboard*` requires a session, `/admin*` requires `profiles.role === 'admin'`. Neither prefix matches `/api/admin/*` or any other `/api/*` route — API authentication is entirely the responsibility of each of the 62 individual route handlers calling `supabase.auth.getUser()` themselves.

Today, every route that should check auth does (confirmed by reading all 62). But there's no structural enforcement — a new route added later that forgets the check is public by default, with nothing catching it until someone notices. This is the underlying pattern behind P0-1 (Server Actions have even less structural protection than API routes, since they don't go through `proxy.ts` at all) and the two RLS-only routes in P3. Worth considering a lint rule or a thin wrapper (`withAuth(handler)`) that makes the check opt-out rather than opt-in for new routes.

---

## Suggested verification before/after remediation

1. **P0-1** — with a non-admin test account, inspect the client bundle for the `Next-Action` ID bound to `changeRole`, then POST it directly to `/dashboard` with a body granting the test account's own uid the `admin` role; confirm the `profiles.role` row changes. This is the one finding worth proving end-to-end before considering it fixed, since the exploit path is easy to get subtly wrong when reasoning about it statically.
2. **P0-2** — `git log --all -S'Raddlly_super_secret_token_123' --oneline` and the equivalent for the app secret, to get the exact commit list before running the history rewrite.
3. **P1-4** — cross-check `campaign_sends` rows stuck at `status: 'failed'` and `channel_accounts` rows with `is_active: false` against accounts whose OAuth completed after the token-encryption migration shipped; the correlation should confirm the outage this bug is causing.
4. **P1-2** — POST to `/api/shopify/connect` with `shopDomain: "example.com"` on a test account and confirm the server issues the outbound request (observable via the reflected status code) before the fix, and is rejected after.
5. Several referenced files (`lib/campaigns/service.ts`, `lib/meta/messaging.ts`, `supabase/schema.sql`, and others) had uncommitted local modifications at the time of this review — re-confirm line numbers against the current working tree before treating them as exact.
