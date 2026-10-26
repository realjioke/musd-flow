import { verifyMessage } from "viem";
import { sql, lt } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/db/client";
import { authNonces, rateLimits } from "@/db/schema";
import { isValidEvmAddress } from "@/lib/format";

/**
 * Wallet challenge auth for state-changing API routes.
 * 1. Client asks for a single-use nonce bound to (address, action).
 * 2. Client signs the full challenge message with the wallet.
 * 3. Server recovers the signer with verifyMessage and rejects any mismatch,
 *    used, or stale nonce.
 */

export const NONCE_TTL_MS = 10 * 60 * 1000;

export function challengeMessage(input: {
  address: string;
  action: string;
  nonce: string;
  payloadHash: string;
}): string {
  return [
    "MUSD Flow wants you to confirm an action.",
    "",
    `action: ${input.action}`,
    `payload hash: ${input.payloadHash}`,
    `nonce: ${input.nonce}`,
    "",
    "This signature is free and only proves you own this wallet address.",
  ].join("\n");
}

export async function issueNonce(address: string, action: string): Promise<string> {
  const db = await getDb();
  const nonce = randomBytes(16).toString("hex");
  await db.insert(authNonces).values({
    nonce,
    address: address.toLowerCase(),
    action,
    expiresAt: Date.now() + NONCE_TTL_MS,
  });
  // opportunistic cleanup of expired nonces
  await db.delete(authNonces).where(lt(authNonces.expiresAt, Date.now() - 86_400_000));
  return nonce;
}

export interface AuthProof {
  address: string;
  action: string;
  nonce: string;
  payloadHash: string;
  signature: string;
}

export async function verifyAuthProof(
  proof: AuthProof
): Promise<{ ok: true; address: string } | { ok: false; reason: string }> {
  if (!isValidEvmAddress(proof.address)) return { ok: false, reason: "invalid address" };
  const db = await getDb();
  const [row] = await db
    .select()
    .from(authNonces)
    .where(
      and(
        eq(authNonces.nonce, proof.nonce),
        eq(authNonces.address, proof.address.toLowerCase()),
        eq(authNonces.action, proof.action)
      )
    )
    .limit(1);

  if (!row) return { ok: false, reason: "nonce not found for this address/action" };
  if (row.used) return { ok: false, reason: "nonce already used" };
  if (row.expiresAt < Date.now()) return { ok: false, reason: "nonce expired" };
  if (row.payloadHash && row.payloadHash !== proof.payloadHash) {
    return { ok: false, reason: "payload hash mismatch" };
  }

  let valid = false;
  try {
    valid = await verifyMessage({
      address: proof.address as `0x${string}`,
      message: challengeMessage({
        address: proof.address,
        action: proof.action,
        nonce: proof.nonce,
        payloadHash: proof.payloadHash,
      }),
      signature: proof.signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: "signature invalid" };

  await db
    .update(authNonces)
    .set({ used: 1 })
    .where(and(eq(authNonces.nonce, proof.nonce), eq(authNonces.action, proof.action)));
  return { ok: true, address: proof.address.toLowerCase() };
}

/** D1-backed fixed-window rate limiter (works across isolates). */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const db = await getDb();
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const key = bucket;

  const rows = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning();

  const row = rows[0];

  // Opportunistic cleanup (same pattern as expired-nonce cleanup in issueNonce):
  // only when this call opened a fresh window for the bucket (count === 1), so
  // steady-state traffic adds no extra statements and cleanup runs at most once
  // per window per bucket. Deletes rows whose window is older than two full
  // windows from the current window start.
  if (row && row.count === 1) {
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, windowStart - 2 * windowMs));
  }

  if (row && row.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((windowStart + windowMs - Date.now()) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}
export function clientBucket(request: Request, scope: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}
