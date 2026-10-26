import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { circles, circleMembers, contributions } from "@/db/schema";
import { contributionSubmitSchema } from "@/lib/validation";
import { verifyTransfer } from "@/lib/onchain-verify";
import { verifyRateLimit } from "@/lib/route-limits";
import { readJson, apiError, json } from "@/lib/api-helpers";
import { formatAmount } from "@/lib/format";

/**
 * Submit a tx hash claiming a member contributed to the circle's payout
 * address. The server loads the receipt from chain and only records real
 * MUSD Transfer events from exactly that member to the payout address.
 * A (circleId, txHash, logIndex) unique index makes recording idempotent.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await verifyRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const { id } = await params;
  const parsed = await readJson(request, contributionSubmitSchema);
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);
  const { txHash, memberAddress } = parsed.data;
  const member = memberAddress.toLowerCase();

  const db = await getDb();
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return apiError("not_found", "Circle not found", 404);
  if (circle.status !== "active") {
    return apiError("inactive", "Circle is not accepting contributions", 409);
  }
  if (circle.deadline < Date.now()) {
    return apiError("deadline_passed", "The contribution deadline has passed", 409);
  }

  const [membership] = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.address, member)))
    .limit(1);
  if (!membership) {
    return apiError("not_member", "This address has not joined the circle", 403);
  }

  const verify = await verifyTransfer({
    chainId: circle.chainId,
    token: circle.token,
    txHash,
    to: circle.payoutAddress,
    from: member,
    minAmountWei: 0n,
  });
  if (!verify.ok) return json({ verified: false, reason: verify.reason });

  const existing = await db
    .select()
    .from(contributions)
    .where(
      and(
        eq(contributions.circleId, id),
        eq(contributions.txHash, txHash),
        eq(contributions.logIndex, verify.proof.logIndex)
      )
    )
    .limit(1);

  if (existing.length > 0) return json({ verified: true, duplicate: true, contribution: existing[0] });

  await db.insert(contributions).values({
    circleId: id,
    txHash,
    logIndex: verify.proof.logIndex,
    member,
    amount: formatAmount(verify.proof.amountRaw),
    chainId: circle.chainId,
    blockNumber: verify.proof.blockNumber,
    createdAt: Date.now(),
  });

  return json({
    verified: true,
    contribution: {
      txHash,
      amount: formatAmount(verify.proof.amountRaw),
      member,
      blockNumber: verify.proof.blockNumber,
    },
  });
}
