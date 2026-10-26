"use client";

import { useState, type ReactElement } from "react";

/**
 * Centralized wallet brand identity.
 *
 * Resolution order (per spec §6):
 *   1. The icon the wallet SDK supplies via EIP-6963 discovery
 *      (`connector.icon`) — this is the provider's own official asset,
 *      shipped by the wallet itself (MetaMask fox, Talisman ghost, etc.).
 *   2. A bundled geometric SVG for wallets whose mark is simple enough
 *      to reproduce faithfully (Binance diamond grid, OKX cube grid).
 *   3. A clean generic wallet glyph — shown ONLY when no real asset is
 *      available. We never show one wallet's logo for another, never
 *      invent a brand mark, and never leave an empty square.
 */
export function WalletLogo({
  providerId,
  providerName,
  iconUrl,
  size = 36,
}: {
  providerId: string;
  providerName: string;
  iconUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (iconUrl && !failed) {
    return (
      <img
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        aria-hidden
        className="shrink-0 rounded-[7px] border border-[var(--line)] bg-[var(--surface-2)] object-contain p-[3px]"
        onError={() => setFailed(true)}
      />
    );
  }
  if (BUNDLED[providerId]) return <BundledMark id={providerId} size={size} />;
  return <GenericWalletGlyph size={size} title={providerName} />;
}

function BundledMark({ id, size }: { id: string; size: number }) {
  const Mark = BUNDLED[id];
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[7px] border border-[var(--line)] bg-[var(--surface-2)]"
      style={{ width: size, height: size }}
    >
      <svg width={size - 10} height={size - 10} viewBox="0 0 24 24" fill="none">
        <Mark />
      </svg>
    </span>
  );
}

/** Binance Wallet — the BNB diamond arrangement. */
function BinanceMark() {
  return (
    <path
      fill="#F0B90B"
      d="M12 2.2 14.5 4.7 12 7.2 9.5 4.7 12 2.2Z
         M7.2 7.2 9.7 9.7 7.2 12.2 4.7 9.7 7.2 7.2Z
         M16.8 7.2 19.3 9.7 16.8 12.2 14.3 9.7 16.8 7.2Z
         M12 12 14.5 14.5 12 17 9.5 14.5 12 12Z
         M3.4 11.2 5.9 13.7 3.4 16.2 0.9 13.7 3.4 11.2Z"
    />
  );
}

/** OKX Wallet — the five-cube checker arrangement. */
function OkxMark() {
  return (
    <g fill="#8f8d85">
      <rect x="3" y="3" width="5.4" height="5.4" rx="1" />
      <rect x="9.3" y="3" width="5.4" height="5.4" rx="1" />
      <rect x="15.6" y="3" width="5.4" height="5.4" rx="1" />
      <rect x="3" y="9.3" width="5.4" height="5.4" rx="1" />
      <rect x="3" y="15.6" width="5.4" height="5.4" rx="1" />
      <rect x="15.6" y="9.3" width="5.4" height="5.4" rx="1" />
      <rect x="15.6" y="15.6" width="5.4" height="5.4" rx="1" />
    </g>
  );
}

const BUNDLED: Record<string, () => ReactElement> = {
  binancewallet: BinanceMark,
  binance: BinanceMark,
  "io.binance.w3w": BinanceMark,
  okx: OkxMark,
  "com.okex.wallet": OkxMark,
};

/** Clean generic glyph — the last-resort fallback, never a wrong brand. */
export function GenericWalletGlyph({ size = 36, title }: { size?: number; title?: string }) {
  return (
    <span
      role="img"
      aria-label={title ? `Generic wallet icon for ${title}` : "Wallet icon"}
      className="flex shrink-0 items-center justify-center rounded-[7px] border border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--ink-soft)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2.5" y="5.5" width="19" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.6" />
        <rect x="15" y="12.5" width="4" height="3.5" rx="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}

/**
 * Concise, honest per-wallet description for the selector rows. Derived from
 * the provider's reversed domain name — no marketing invented here.
 */
export function walletRow(id: string, name: string): { name: string; desc: string } {
  const key = id.toLowerCase();
  if (key.includes("metamask")) return { name, desc: "Browser wallet" };
  if (key.includes("talisman")) return { name, desc: "Multi-chain wallet" };
  if (key.includes("okx") || key.includes("okex")) return { name, desc: "Web3 wallet" };
  if (key.includes("binance") || key.includes("bnb")) return { name, desc: "Web3 wallet" };
  if (key.includes("coinbase")) return { name, desc: "Browser wallet" };
  if (key.includes("rabby")) return { name, desc: "Browser wallet" };
  if (key.includes("walletconnect")) return { name: "WalletConnect", desc: "Scan with your mobile wallet" };
  if (key.includes("injected")) return { name: name || "Browser wallet", desc: "Detected extension" };
  return {
    name: name || id || "Wallet",
    desc: key.includes("walletconnect") ? "Scan with your mobile wallet" : "Browser wallet",
  };
}
