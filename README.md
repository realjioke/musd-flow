# MUSD Flow

**One stablecoin experience. Multiple chains. Real-world utility.**

MUSD Flow is a non-custodial, multi-chain payments and group-savings app for **MUSD**
— the Bitcoin-backed stablecoin of the **Mezo** ecosystem — with verified support
across **Mezo, Ethereum and Base**, and honest reporting of what is *not* supported
(see [docs/integration-matrix.md](docs/integration-matrix.md)).

Built for the **"Build with MUSD and MEZO" $7,000 grants competition** (track:
*Access & Distribution*).

## Features

| Feature | Status | Notes |
|---|---|---|
| Wallet connect (injected / WalletConnect) | ✅ working | no seed phrases, ever |
| Network detection / switching, testnet banner | ✅ working | verified chain configs |
| Multichain MUSD portfolio | ✅ working | live reads from token contracts, per-network errors + retry |
| Send MUSD with preflight checks | ✅ working | balance, gas estimate + gas-balance checks, review screen, real receipt |
| Receive / QR | ✅ working | per-network QR, warnings |
| Shareable payment requests (`/pay/:id`) | ✅ working | QR + link; status flips **only** after server-side on-chain verification of the payer's tx |
| MUSD Circles (group savings) | ✅ working | non-custodial; memberships by signed wallet; contributions verified from receipts; idempotent records |
| Smart Route (cross-chain planning) | ✅ informational | verified Mezo⇄ETH⇄Base Wormhole NTT routes; no fabricated quotes; no execution by design |
| Mezo ecosystem hub | ✅ working | MUSD/MEZO balance reads, faucet, docs, veMEZO links |
| Activity page | ✅ working | local tx records + your requests, filters, explorer links |

## Architecture

- **Next.js 16 App Router** + TypeScript strict, Tailwind CSS v4 design tokens.
- **wagmi/viem**: wallet connection, chain switching, live contract reads, sends.
- **Drizzle ORM on Cloudflare D1**: payment requests, circles, memberships,
  verified contributions, auth nonces, rate-limit buckets. Ordered idempotent
  bootstrap migrations in `src/db/client.ts`.
- **Server-side on-chain verification** (`src/lib/onchain-verify.ts`): receipts and
  log parsing; the DB never *proves* a transfer by itself.
- **Zod** validation on every API input; **wallet nonce-signature auth** for writes;
  **D1-backed rate limiting**.
- Deployed as an **OpenNext Cloudflare Worker** (Freebuff Sites) with isolated D1.

## Run locally

```bash
npm install
cp .env.example .env          # optional WalletConnect project id
npm run dev                   # http://localhost:3000
```

The app needs a D1 binding for its API routes (`/api/*`). Locally this comes from the
generated Freebuff dev config (`freebuff.wrangler.jsonc`) via
`initOpenNextCloudflareForDev`; without it the pages render and `/api/healthz`
reports `degraded`. `npm run build` for a production build.

Standard next dev without D1 still supports: landing page, wallet connect,
balances, sends, receive, Smart Route, Mezo hub, and read-only views.

## Scripts

```bash
npm run dev       # next dev
npm run build     # next build (production)
npm run lint      # eslint
npx tsc --noEmit  # type check
```

## Environment variables

See [.env.example](.env.example). Nothing is required for a basic run; secrets never
commit to the repo. The D1 binding `DB` is injected by the hosting platform.

## Documentation

- [docs/integration-matrix.md](docs/integration-matrix.md) — every verified chain,
  token address, bridge route + source URLs
- [docs/security-notes.md](docs/security-notes.md) — auth, validation, rate limits,
  and disclosed limitations
- [docs/grant/](docs/grant/) — competition submission package
