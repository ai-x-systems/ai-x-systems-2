# Auth, Dashboards, and Credit Ledger

## What exists now

- **Sign-up / sign-in**: `/signup`, `/login`, backed by `app/api/auth/*` and
  `lib/accounts/session.ts`. Sessions are a signed HttpOnly cookie (HMAC,
  `SESSION_SECRET`), not a third-party auth provider.
- **Client dashboard**: `/dashboard` — credit balance, live/demo status, recent
  ledger activity, for the logged-in client's own business.
- **Admin dashboard**: `/admin` — every client account, business, and credit
  balance in one table, plus a manual credit adjustment action.
- **Credit ledger**: `lib/billing/credits.ts` — every top-up, usage deduction,
  and adjustment is a row; balance is the running sum. No payment processor is
  called anywhere. You send a Payment Request Link yourself (Elevate Pay /
  PingPong / Payoneer), and once it's paid you record it in `/admin`, which
  calls `POST /api/admin/clients/[businessId]/credits`.
- **Per-client CRM webhook**: `lib/integrations/webhook.ts` — set
  `integrations.webhookUrl` (or a channel-specific `crm.webhookUrl` /
  `leadManagement.webhookUrl`) on a business, and every lead/booking is also
  POSTed there as JSON. Works with Zapier/Make/n8n catch hooks or any CRM's
  native inbound webhook, with zero new code per client.

## ⚠️ Before this touches a real client

`lib/accounts/store.ts` and `lib/billing/credits.ts` are **local-dev-only**
JSON-file implementations (`data/accounts.json`, `data/credits.json`,
both gitignored). On Vercel the filesystem is read-only outside `/tmp`, and
`/tmp` isn't durable — accounts and balances created this way will
intermittently or permanently disappear in production. This was a deliberate
choice: it gets the interfaces, routes, and pages fully working and testable
locally today, without deciding your database for you.

**To go live**, write one new file per store that implements the same
interface, backed by Supabase (already your stated stack) or another real
database:

- `AccountStore` (`lib/accounts/store.ts`) — 4 methods: `findByEmail`,
  `findById`, `create`, `list`.
- `CreditLedger` (`lib/billing/credits.ts`) — 3 methods: `getBalance`,
  `recordTransaction`, `listAllBalances`.

Swap the exported `accountStore` / `creditLedger` singletons to the new
implementation. No route, page, or component changes — same pattern already
used for `ConversationStore` in `lib/chat/conversation.ts`.

## Setup

1. Set `SESSION_SECRET` (e.g. `openssl rand -hex 32`) — required for any
   sign-in to work at all.
2. Set `ADMIN_BOOTSTRAP_SECRET` to a second random value, then create your
   one admin account:
   ```
   curl -X POST https://<your-deployment>/api/auth/bootstrap-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"you@aixsystems.app","password":"...","secret":"<ADMIN_BOOTSTRAP_SECRET>"}'
   ```
   This route refuses to run again once one admin account exists.
3. Onboard a client the same way you do today (add their
   `data/businesses/<id>.json`), then either create their login yourself or
   have them sign up at `/signup` with the `businessId` you gave them.

## Known gaps, by design (not yet asked for)

- Sessions can't be revoked server-side (no "log out everywhere" / instant
  ban) — see the comment in `lib/accounts/session.ts`.
- No password reset flow yet.
- The admin table has no pagination — fine at current/near-term client
  counts, revisit once it's dozens+.
- The public marketing copy on `/about` currently says *"your team never
  touches a prompt or a dashboard of settings"* — that was true before this
  milestone and is now slightly stale since clients *can* see a dashboard.
  Worth a copy pass once you're ready to mention the dashboard publicly.
