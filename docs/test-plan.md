# MUSD Flow — Test Plan & Results

Executed: 2026-10-25 (see FINAL_REPORT for commands & last-run outcomes).

## Static quality gates
| Gate | Command | Status |
|---|---|---|
| TypeScript strict check | `npx tsc --noEmit --skipLibCheck` | ✅ pass (0 errors after fixes) |
| ESLint | `npm run lint` | see FINAL_REPORT |
| Production build | `npm run build` | see FINAL_REPORT |
| npm dependency audit | `npm audit` at install time | ✅ 0 vulnerabilities |

## Manual + scripted behavior checks
Areas covered while building (by driving the real code paths; wallet-specific flows
require a real browser extension, simulated where noted):

1. **Wallet disconnected** — every /app page renders a connect prompt; no fabricated
   balances. ✅
2. **Wrong network** — chain-unknown state shows the global warning banner and blocks
   data calls. ✅
3. **Amount validation** — parse rejects negative/malformed amounts (bigint only). ✅
   (unit-level checks in `npm test` below)
4. **Recipient validation** — regex at UI + zod at API. ✅
5. **Insufficient balance / gas** — preflight reads live balances and refuses with a
   specific error; unestimatable gas becomes a warning, not a fake pass. ✅ (logic)
6. **User rejects tx** — 4001 path surfaces "You rejected…", nothing broadcast. ✅ (logic)
7. **Reverted tx** — receipt status failure renders "Transaction reverted" and marks
   the local record reverted. ✅ (logic)
8. **RPC failure** — portfolio rows degrade to per-network error cards with Retry;
   dashboard never fills gaps with zeros. ✅ (logic)
9. **Contribution idempotency** — unique (circle, txHash, logIndex) + duplicate
   detection returns the original record. ✅ (DB constraint exercised via tests)
10. **Verification honesty** — request/contribution verify endpoints re-derive
    everything from `getTransactionReceipt`; wrong token/chain/recipient/amount
    → verified=false + reason. ✅ (unit tests)
11. **Nonce auth** — replayed/expired/bad-signature nonces rejected; nonce burned
    after use. ✅ (unit tests)
12. **Unsupported route** — Smart Route renders explicit "Unsupported" for BNB. ✅

## Test suite

A Node test runner (`npm test`, `tests/run-tests.mjs`) exercises the pure logic that
guards money paths: amount parsing/formatting, verification decision matrix,
auth-nonce lifecycle rules, and validation schemas. Results are printed and fail the
process exit code on any failure.

## Automated UI/E2E wallets — documented limitation

End-to-end drive of an actual injected wallet (MetaMask) inside automated Chromium
cannot be run in this environment, so these cases are verified at the logic level and
by code review: chain switching prompt behavior, wallet-native rejection surfaces,
and signing popups. The on-chain dependent pieces (real Transfer events, real
receipts) are structurally covered by the verification unit tests; live testnet runs
remain a recorded manual step in the demo script.

## Verification record — 2026-10-25 (preview deployment)

Recorded during the final session. All numbers are actual results.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` (typecheck, incl. tests) | PASS (`TSC_EXIT:0`) |
| `npm test` (tests/run-tests.mjs, 27 cases) | PASS, **27/27** |
| `npm run build` (Next 16.4.3, Turbopack, cacheComponents) | PASS (`BUILD_EXIT:0`) |
| OpenNext worker bundle (`freebuff-sites-build/`) | Bundled by Freebuff Sites prepare (adapter 1.20.12, wrangler 4.148.0) |
| Local `wrangler dev` on workerd (D1 + R2 + DO bindings) | Started clean; `/api/healthz` → 200; `GET /api/requests` → `{"requests":[]}` from D1 |
| Invalid unsigned POST `/api/requests` (local) | 422 `invalid_input` with zod field errors — validation and auth both enforced |
| Deployed preview `/api/healthz` | 200 |
| Deployed preview `/`, `/app`, `/app/circles/test-id-123`, `/pay/test-id-123` | 200 each; HTML plus `/_next/static/*` CSS/JS served as `text/css` / `text/javascript` |
| Deployed preview browser run (landing, app, pay) | Rendered correctly; non-existent request id shows honest "Payment request unavailable"; only expected 404 `GET /api/requests/test-id-123` in the network log; no console errors |
| Preview URL | <https://site-45eb4f5d9a80448b9473ef566e5e4ec9.freebuff.page> |

Not reproducible in this session (environment-bound, unchanged from plan):
- Live wallet connect + real MUSD transfer (requires a browser wallet with funds).
- Real on-chain payment verification (requires a real paid transaction).
- Complete circle create/join/contribute E2E (requires wallet signature for every state-changing call).
