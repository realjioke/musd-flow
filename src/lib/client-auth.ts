"use client";

import type { WalletClient } from "viem";

/**
 * Client-side wallet auth: nonce challenge -> signature -> API call with proof.
 * Signing happens in the user's wallet; nothing secret is ever persisted here.
 */


export async function signedFetch(
  url: string,
  payload: object,
  action: string,
  walletClient: WalletClient,
  method: "POST" | "DELETE" = "POST"
): Promise<Response> {
  if (!walletClient.account) {
    throw new Error("Wallet account unavailable — reconnect and try again");
  }
  const address = walletClient.account.address;
  const hash = await webHash(JSON.stringify(payload));
  const nonceRes = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address, action, payloadHash: hash }),
  });
  if (!nonceRes.ok) {
    const err = await nonceRes.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Could not start sign-in challenge");
  }
  const { nonce } = (await nonceRes.json()) as { nonce: string };
  const signature = await walletClient.signMessage({
    account: walletClient.account,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    message: challengeLines({ address, action, nonce, payloadHash: hash }),
  });
  return fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, auth: { address, action, nonce, payloadHash: hash, signature } }),
  });
}

function challengeLines(i: {
  address: string;
  action: string;
  nonce: string;
  payloadHash: string;
}) {
  return [
    "MUSD Flow wants you to confirm an action.",
    "",
    `action: ${i.action}`,
    `payload hash: ${i.payloadHash}`,
    `nonce: ${i.nonce}`,
    "",
    "This signature is free and only proves you own this wallet address.",
  ].join("\n");
}

async function webHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
