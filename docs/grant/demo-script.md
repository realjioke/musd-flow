# MUSD Flow — Demo Script (≈4 min)

## Setup before recording
- App running (deployed preview or `npm run dev`), MetaMask with Mezo + Mezo testnet
  added and a little testnet BTC via https://faucet.test.mezo.org/
- A second browser profile as "the friend who pays" (or phone).

## Shot list

1. **Landing (0:00–0:30)** — show the verified network matrix. Emphasize: "Everything
   you can click is backed by an official source. BNB Chain says unsupported because
   it is unsupported — that honesty is the product."

2. **Connect & portfolio (0:30–1:00)** — connect wallet, point at network switching,
   Mezo testnet banner, live MUSD + gas balances pulled from the token contract, and
   a deliberate RPC failure row to show the error + retry state.

3. **Send flow (1:00–2:00)** — pick Mezo testnet, enter recipient, request 5 MUSD,
   review screen showing real balances & gas estimate. Send, watch the "tracking
   real receipt" state, land on the confirmed screen with the tx hash and explorer
   link.

4. **Payment request (2:00–3:00)** — create a request for 12 MUSD with a memo; show
   the QR + link. Open the link in the second browser, show the public page, pay,
   paste the hash, show it flipping to "Paid ✓" from server-side verification.

5. **Circle (3:00–4:00)** — create a "Bali trip" circle, join from the second
   browser, send contribution MUSD to the destination and record the hash; show the
   progress bar and Verified list. Close on: "Funds never touch us. Rules stay with
   the group. Everything confirmed is only ever what the chain itself says."
