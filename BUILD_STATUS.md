# MUSD Flow — Build Status

Last updated: 2026-10-25 (audit session). All entries below are from commands
actually executed in this session or the immediately preceding build session.

## Verified this session (audit)

| # | Command | Result |
| --- | --- | --- |
| 1 | `cd musd-flow && npm test` | **PASS** — `Passed: 27 Failed: 0`, exit 0 (log: `../musd-audit-tests.log`) |
| 2 | Local dev server `npm run dev` (Next 16.4.3 + OpenNext for-dev bindings) | **RUNNING** — Ready on `http://localhost:64973`, `/` → 200 |
| 3 | `GET http://localhost:64973/api/healthz` | **200** |
| 4 | `GET http://localhost:64973/api/requests` | **200** `{"requests":[]}` — live D1 read through local workerd-for-dev bindings |

## Verified this session (from the same code state, minutes before the audit)

| # | Command / check | Result |
| --- | --- | --- |
| 5 | `npm test` (tests/run-tests.mjs) | **PASS 27/27**, exit 0 |
| 6 | `npm run build` (Next 16.4.3, Turbopack, cacheComponents, TypeScript check) | **PASS** `BUILD_EXIT:0` (log: `../musd-build8.log`) |
| 7 | OpenNext/Freebuff worker packaging via `sites_prepare_next` | **PASS** — adapter `@opennextjs/cloudflare` 1.20.12, wrangler 4.148.0; manifest `freebuff-sites-build/manifest.json` |
| 8 | `npx tsc --noEmit` | **PASS** (`TSC_EXIT:0`, prior session) |
| 9 | Local `wrangler dev` on workerd with D1/R2/DO bindings | **PASS** — healthz 200, D1-backed API reads, unsigned POST `/api/requests` → 422 `invalid_input` with zod field errors |
| 10 | Deploy to preview + publish | **PASS** — receipts `deploy-preview-0001` and `publish-preview-0001` state `succeeded` |
| 11 | Live preview checks | healthz 200; `/`, `/app`, `/app/circles/test-id-123`, `/pay/test-id-123` all 200; `/_next/static/*` CSS/JS correct content types; browser run with no console errors |

## Published preview environment

<https://site-45eb4f5d9a80448b9473ef566e5e4ec9.freebuff.page>

- Site id: `7f3a2c64-91de-4f0a-8b31-5c9d2e6a1b47`, environment: preview (published 2026-10-25).
- D1 binding `DB` attached (resource `site-cbd92b280e0e4520bce2afd7ac235543`).
- Production environment: configured but **not deployed/published** (awaiting authorization).

## Known environment-bound gaps (cannot be executed here)

- Live browser-wallet connect and a real signed MUSD transfer (needs a wallet with funds).
- Real on-chain payment verification against a real Transfer event.
- Full circle create/join/contribute E2E (each write requires a wallet signature).

These are documented, not silently omitted — see `docs/test-plan.md` verification record.
