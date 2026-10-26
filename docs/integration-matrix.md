# MUSD Flow — Verified Integration Matrix

All facts below were verified on **2026-10-25** against official sources. Anything
that could not be verified is marked **UNVERIFIED** and is treated as unavailable in
the product. Sources:

- Mezo docs — connect wallet: <https://mezo.org/docs/users/getting-started/connect/>
- Mezo contracts reference: <https://mezo.org/docs/users/resources/contracts-reference/>
- Mezo mainnet bridges overview: <https://mezo.org/docs/users/mainnet/bridges/>
- Mezo MUSD x402 reference: <https://mezo.org/docs/developers/getting-started/musd-payments-x402/>
- Mezo testnet FAQ (faucet): <https://faucet.test.mezo.org/> & testnet FAQ
- Explorer verification: Etherscan, BaseScan token pages for the MUSD address
- MEZO token / veMEZO: <https://mezo.org/docs/users/mezo>, <https://mezo.org/docs/users/mezo-earn/lock/vemezo>
- Wormhole/Mezo multichain announcement: <https://mezo.org/blog/mezo-and-musd-go-multichain-with-wormhole/>

## Networks

| Network | Chain ID | RPC (public) | Gas token | Explorer | Source |
|---|---|---|---|---|---|
| Mezo | 31612 | `https://mezo-mainnet.boar.network` (also imperator, ValidationCloud) | BTC (18 dec) | <https://explorer.mezo.org> | Mezo docs |
| Mezo Testnet | 31611 | `https://rpc.test.mezo.org` | testnet BTC | not verified — not linked in UI | Mezo docs/FAQ |
| Ethereum | 1 | `https://ethereum-rpc.publicnode.com` | ETH | etherscan.io | public RPC |
| Base | 8453 | `https://base-rpc.publicnode.com` | ETH | basescan.org | public RPC |
| BNB Chain | 56 | `https://bsc-rpc.publicnode.com` | BNB | bscscan.com | public RPC |

## Token support matrix

| Network | MUSD | MUSD contract (verified) | MEZO token | Notes |
|---|---|---|---|---|
| Mezo (31612) | **native** | `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` (18 dec) | **native** `0x7B7c000000000000000000000000000000000001` | MUSD is the Bitcoin-backed stablecoin of Mezo |
| Mezo Testnet (31611) | **native** | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` (18 dec) | unsupported | faucet: <https://faucet.test.mezo.org/> |
| Ethereum (1) | **supported** (bridged) | `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` | bridgeable, address UNVERIFIED → not used | via Wormhole NTT |
| Base (8453) | **supported** (bridged) | `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` | bridgeable, address UNVERIFIED → not used | via Wormhole NTT; cave: Mezo's bridge page is internally inconsistent about Base directions — confirmed contract exists on Base, treated as supported with live-UI check recommended before transfer |
| BNB Chain (56) | **unsupported** | none verified | bridgeable, address UNVERIFIED → not used | no MUSD deployment or route found in any official source |

## Bridge facts

- MUSD moves between Mezo ⇄ Ethereum and Mezo ⇄ Base with **Wormhole Native Token
  Transfers (NTT)**. Official UI: **Portal** (<https://portalbridge.com/>) — MUSD Flow
  links out, it does not execute bridge transactions.
- The MEZO token is bridgeable Mezo ⇄ Ethereum, Base, BSC (and Solana) via Wormhole NTT.
- No official route or deployment for **MUSD on BNB Chain** was found → the app offers
  no MUSD operations on BNB; only the documented MEZO-token routing note appears there.

## What this means in MUSD Flow

- Balances/payments/circles run only on networks with a verified MUSD contract.
- Smart Route only shows the Mezo⇄Ethereum⇄Base MUSD path and explicitly marks BNB
  Chain as unsupported (no fabricated quotes, fees, or execution).
- MEZO token: balance display on Mezo mainnet + documented bridge/veMEZO links. No
  minting, staking, pricing or rewards are implemented because we hold no authority
  over the token and would be fabricating utility.
