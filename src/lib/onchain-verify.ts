import { publicClientFor } from "@/lib/rpc-client";
import { ERC20_TRANSFER_SIGNATURE } from "@/lib/erc20";
import { NETWORKS } from "@/lib/chains";

/**
 * Server-side verification of a confirmed ERC-20 transfer.
 * Reads the actual transaction receipt off chain and parses Transfer events.
 * Nothing here trusts client-side claims.
 */
export interface VerifiedTransfer {
  txHash: string;
  chainId: number;
  blockNumber: number;
  transfers: Array<{
    from: string;
    to: string;
    valueRaw: bigint;
    logIndex: number;
  }>;
}

export interface DecideInput {
  chainId: number;
  token: string;
  txHash: string;
  /** expected recipient (lowercase compare) */
  to: string;
  /** expected sender, or null to accept any source */
  from?: string | null;
  /** minimum amount in raw units (bigint) */
  minAmountWei: bigint;
}

export type VerifyResult =
  | { ok: true; proof: { txHash: string; logIndex: number; amount: string; amountRaw: bigint; blockNumber: number } }
  | { ok: false; reason: string };

export async function verifyTransfer(input: DecideInput): Promise<VerifyResult> {
  const net = networkByChainId(input.chainId);
  if (!net || !net.musdAddress) {
    return { ok: false, reason: "Chain does not host a verified MUSD contract" };
  }
  const client = publicClientFor(input.chainId);
  if (!client) return { ok: false, reason: "RPC unavailable for this chain" };

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({
      hash: input.txHash as `0x${string}`,
    });
  } catch {
    return { ok: false, reason: "Transaction not found on this chain yet" };
  }

  if (receipt.status !== "success") {
    return { ok: false, reason: "Transaction reverted — it cannot count" };
  }

  const matches: NonNullable<VerifiedTransfer["transfers"]> = [];
  for (const log of receipt.logs) {
    const topics = log.topics as `0x${string}`[];
    if (!topics[0] || topics[0] !== ERC20_TRANSFER_SIGNATURE) continue;
    if (!topics[1] || !topics[2]) continue;
    if (log.address.toLowerCase() !== input.token.toLowerCase()) continue;
    const from = ("0x" + topics[1].slice(26)) as `0x${string}`;
    const to = ("0x" + topics[2].slice(26)) as `0x${string}`;
    const valueRaw = BigInt(log.data);
    matches.push({ from, to, valueRaw, logIndex: log.logIndex });
  }

  if (matches.length === 0) {
    return { ok: false, reason: "No MUSD Transfer event in this transaction" };
  }

  const candidates = matches.filter(
    (m) =>
      m.to.toLowerCase() === input.to.toLowerCase() &&
      (!input.from || m.from.toLowerCase() === input.from.toLowerCase()) &&
      m.valueRaw >= input.minAmountWei
  );

  if (candidates.length === 0) {
    return {
      ok: false,
      reason:
        "MUSD moved in this transaction, but not to the expected address at/above the expected amount",
    };
  }

  const best = candidates.reduce((a, b) => (b.valueRaw > a.valueRaw ? b : a));
  return {
    ok: true,
    proof: {
      txHash: input.txHash,
      logIndex: best.logIndex,
      amountRaw: best.valueRaw,
      amount: best.valueRaw.toString(),
      blockNumber: Number(receipt.blockNumber),
    },
  };
}

function networkByChainId(chainId: number) {
  const nets = NETWORKS as { id: number; musdAddress: string | null }[];
  return nets.find((n) => n.id === chainId) ?? null;
}
