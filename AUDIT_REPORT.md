# MUSD Flow — Engineering Audit Report

Date: 2026-10-25 · Method: direct file inspection, executed checks (tests, build,
local workerd, deployed preview), browser-level verification of the published
environment. No code was modified during this audit — only the two audit
documents (`AUDIT_REPORT.md`, `BUILD_STATUS.md`) were created.

---

## 1. Actual project state — what is genuinely built

MUSD Flow is a complete Next.js 16 (App Router, React 19, Turbopack,
`cacheComponents`) application of **47 TypeScript source files**:

- **Real wallet connectivity** via wagmi 3 + viem 2: connect/disconnect, address
  display, connected-network detection, network switching, explicit
  unsupported-network states (`src/components/wallet/*`, `src/app/app/layout.tsx`).
- **Server side**: 14 route handlers under `src/app/api/*` — auth nonce,
  payment requests (create/list/cancel/verify), circles (create/list/detail/
  join/contribute/contributions), healthz. Zod validation on every input
  (`src/lib/validation.ts`), `no-store` on all JSON responses
  (`src/lib/api-helpers.ts`).
- **Drizzle ORM over Cloudflare D1** (`src/db/*`) with idempotent bootstrap
  migrations; deployed preview has the `DB` binding attached and serving reads.
- **Wallet-signature auth**: single-use nonces bound to (address, action,
  payloadHash), EIP-191 signature recovery via `verifyMessage`, mark-used
  after first verification (`src/lib/auth.ts`).
- **D1-backed fixed-window rate limiting** with per-bucket limits
  (`src/lib/route-limits.ts`: nonce 8/min, create 10/min, verify 20/min,
  read 120/min).
- **Server-side on-chain verification** (`src/lib/onchain-verify.ts`): reads the
  actual transaction receipt over RPC, parses ERC-20 `Transfer` logs against
  chain/token/recipient/minimum-amount; never trusts client claims.
- **Chain registry** (`src/lib/chains.ts`) that explicitly distinguishes
  verified MUSD deployments (Mezo/Ethereum/Base + testnets) from
  bridge-routed-only (BNB via Wormhole NTT for the ETH/BSC governance token)
  and unsupported networks.
- **All required UI surfaces**: landing, dashboard with on-chain MUSD balances
  (24h price indicator etc.), send flow with review screen + receipt tracking,
  receive with QR + payment-request links, public pay page `/pay/[id]`,
  MUSD Circles (create/list/detail/join/contribute), Smart Route explainer,
  Activity, Mezo page. Grant docs under `docs/` (integration matrix verified
  2026-10-25, security notes, test plan + verification record, grant overview,
  demo script).

The repository of record is `musd-flow/` inside the workspace, root documents
`README.md`, `.env.example`, `docs/*`.

## 2. What works — verified by execution or testing

Evidence table (all from actually executed commands):

| Check | Result |
| --- | --- |
| `npm test` (27 unit cases: verification decision matrix, auth-nonce lifecycle, EIP-191 recovery, validation schemas, chain matrix) | **PASS 27/27** exit 0 |
| `npm run build` (Next 16.4.3 + Turbopack + tsc-in-build) | **PASS**, `BUILD_EXIT:0` |
| OpenNext worker packaging (`sites_prepare_next`, adapter 1.20.12) | **PASS**, worker + assets bundled |
| Local workerd (`wrangler dev`, D1+R2+DO bindings) | healthz 200; `GET /api/requests` returned `{"requests":[]}` from D1; invalid unsigned POST → 422 with zod field errors |
| Deploy + publish (receipt `deploy-preview-0001`, `publish-preview-0001`) | **succeeded** |
| Live preview browser run (landing, dashboard, circles detail, pay page) | all pages 200, assets correct MIME, **no console errors** |
| Local dev server (`npm run dev`, OpenNext for-dev) | running on `http://localhost:64973`, `/` → 200, healthz 200, D1 read works |
| `npx tsc --noEmit` | PASS (`TSC_EXIT:0`, earlier same code state) |

Published preview: <https://site-45eb4f5d9a80448b9473ef566e5e4ec9.freebuff.page>

## 3. What is incomplete or mocked

- **Nothing in the product path is mocked.** A repo-wide search for
  `mock|fake|placeholder|TODO|FIXME` over `src/` found only:`<input placeholder>` attributes and marketing copy ("Nothing here is mocked / No fake bridge quotes"). There are no stub services, no fake balances, and no fabricated success states.
- **Incomplete (by design, disclosed):** end-to-end wallet flows. Wallet connect,
  signed transfer, signed circle contributions, and verification of a *real*
  paid transaction cannot be executed in this headless environment; the logic is
  unit-tested and code-reviewed, and the gap is recorded in
  `docs/test-plan.md` (verification record) rather than silently checked off.
- **Activity page** blends server-synced request/circle data with a
  device-local activity log (`local-activity.ts`) — local-only items are labeled
  as such; not a data-integrity risk but a UX limitation.
- **BNB Chain** is deliberately receive/monitor-only (`/app/route` explains why
  a live MUSD transfer route is not executed against); this is disclosed
  in-product, not hidden.

## 4. What is broken

**Nothing currently broken.** No failing builds, tests, or runtime checks remain
from this code state. Historical issues fixed earlier this session (documented in
`BUILD_STATUS.md`): wrong `cloudflare` package installed instead of
`@opennextjs/cloudflare`; OpenNext 1.20 `cloudflare-context` import path;
Next 16 cache-components prerender configuration (client-page route-config
exports moved to server layouts, Suspense boundaries added). All resolved.

## 5. Security concerns — highest priority

1. **API key rotation**: `POST /api/requests` accepts the payer-provided txHash
   and verifies server-side; a malicious client can DDoS verification via RPC
   but the 20/min verify limit bounds it — **verify endpoint is unauthenticated
   by design (payers aren't signed in)**; watch for abuse (already rate-limited).
2. **No session revocation**: auth is per-request signed proof, not sessions —
   good for replay safety (nonce mark-used), but there is no admin/creator
   authentication for circle closure; closure follows data-owned rules rather
   than signature-of-creator. **Confirm on-chain rules if circles ever hold funds** (they currently do not — non-custodial tracking only, which is the safe pattern).
3. **D1 write amplification**: rate limiter inserts one row per bucket/window;
   unbounded growth possible if buckets (`clientBucket`) are spoofed (IP-derived
   under proxy headers). **Not a fund/security bug, but database-growth
   hygiene is needed** (TTL cleanup exists for nonces, not rate rows).
4. **Secrets**: `.env.example` documents keys without values; the deployed
   worker uses only platform-injected bindings — no secrets in repo or chat
   (audited grep-clean).

None of these block the grant submission; items 1–3 are roadmap-grade notes.

## 6. Build and test results — commands actually executed

```
cd musd-flow && npm test                    # PASS, Passed: 27 Failed: 0, exit 0
cd musd-flow && npm run build               # PASS, BUILD_EXIT:0
ls freebuff-sites-build/{manifest.json,entry.js,deploy-entry.js,assets} # all present
npm run dev                                 # RUNNING on http://localhost:64973
curl http://localhost:64973/api/healthz     # 200
curl http://localhost:64973/api/requests    # 200 {"requests":[]}
(earlier same code state) npx tsc --noEmit  # TSC_EXIT:0
(earlier same code state) wrangler dev + curl checks # healthz 200, D1 reads, 422 on invalid signed POST
(sites) deployment + publish receipts       # succeeded
```

## 7. Recommended next task

**One specific implementation task:** add rate-limit-row TTL cleanup in
`src/lib/auth.ts` (`rateLimit()`), deleting rows older than 2 windows in the same
upsert path that opportunistic-cleans old auth nonces today. Reason: prevents
unbounded D1 growth on a free-tier database under abusive traffic, matching the
existing hygiene pattern already used for `authNonces`, with a ~10-line change
and no API/behavior impact.

## 8. Continuation instructions (exact next prompt)

> In `musd-flow/src/lib/auth.ts`, extend the D1 fixed-window rate limiter to
> opportunistically delete `rate_limits` rows whose `window_start` is older
> than two full windows from now (same delete-on-write pattern already used for
> expired `auth_nonces`). Add a unit test in `tests/run-tests.mjs` mirroring the
> cleanup rule. Run `npm test` and `npm run build`; commit only if both pass.
> Do not change any public API shapes.

## 9. Audit artifacts

- `musd-flow/AUDIT_REPORT.md` (this file)
- `musd-flow/BUILD_STATUS.md`
- Supporting logs kept in the workspace outside `musd-flow/`:
  `musd-audit-tests.log`, `musd-build8.log`, `musd-dev.log`, `musd-wrangler.log`
