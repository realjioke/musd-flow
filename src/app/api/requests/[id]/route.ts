import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { paymentRequests } from "@/db/schema";
import { verifyTransfer } from "@/lib/onchain-verify";
import { paymentVerifySchema } from "@/lib/validation";
import { verifyRateLimit } from "@/lib/route-limits";
import { readJson, apiError, json } from "@/lib/api-helpers";
import { parseTokenAmount, formatAmount } from "@/lib/format";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const [row] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!row) return apiError("not_found", "Payment request not found", 404);
  // Public view exposes only what a payer needs. Creator full address is public
  // by design — it is the payment destination.
  return json({ request: row });
}

/**
 * Anyone may present a payment proof. The server re-derives it from chain data:
 * the receipt must show a Transfer of the requested MUSD token on the request's
 * chain, to the creator, of at least the requested amount.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await verifyRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const { id } = await params;
  const parsed = await readJson(request, paymentVerifySchema);
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);

  const db = await getDb();
  const [row] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!row) return apiError("not_found", "Payment request not found", 404);
  if (row.status === "cancelled") return apiError("cancelled", "Request was cancelled", 409);
  if (row.status === "paid") return json({ alreadyPaid: true, request: row });

  const verify = await verifyTransfer({
    chainId: row.chainId,
    token: row.token,
    txHash: parsed.data.txHash,
    to: row.creator,
    from: null,
    minAmountWei: parseTokenAmount(row.amount),
  });

  if (!verify.ok) {
    return json({ verified: false, reason: verify.reason }, 200);
  }

  const now = Date.now();
  await db
    .update(paymentRequests)
    .set({
      status: "paid",
      paidTx: verify.proof.txHash,
      paidBy: "transfer.log.verify",
      updatedAt: now,
    })
    .where(eq(paymentRequests.id, id));

  return json({
    verified: true,
    amount: formatAmount(verify.proof.amountRaw),
    txHash: verify.proof.txHash,
    blockNumber: verify.proof.blockNumber,
  });
}
