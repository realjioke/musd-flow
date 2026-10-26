import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { circles, circleMembers, contributions } from "@/db/schema";
import { apiError, json, readJson } from "@/lib/api-helpers";
import { authProofSchema } from "@/lib/validation";
import { clientBucket, verifyAuthProof, rateLimit } from "@/lib/auth";
import { readRateLimit } from "@/lib/route-limits";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await readRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const { id } = await params;
  const db = await getDb();
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return apiError("not_found", "Circle not found", 404);

  const members = await db
    .select({
      address: circleMembers.address,
      displayName: circleMembers.displayName,
      joinedAt: circleMembers.joinedAt,
    })
    .from(circleMembers)
    .where(eq(circleMembers.circleId, id))
    .orderBy(asc(circleMembers.joinedAt));

  const contribs = await db
    .select()
    .from(contributions)
    .where(eq(contributions.circleId, id))
    .orderBy(asc(contributions.createdAt));

  return json({ circle, members, contributions: contribs });
}

/**
 * Creator-only circle cancellation. The signature proves wallet ownership of
 * the creator address and is bound to this exact route call via payload hash;
 * cancellation is refused once any contribution is recorded so members'
 * on-chain transfers are never silently erased.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await rateLimit(clientBucket(request, "cancel"), 10, 60_000);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const parsed = await readJson(request, z.object({ auth: authProofSchema }));
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);

  const { id } = await params;
  const db = await getDb();
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return apiError("not_found", "Circle not found", 404);
  if (circle.status !== "active") {
    return apiError("inactive", "Circle is already closed or cancelled", 409);
  }

  const verified = await verifyAuthProof(parsed.data.auth);
  if (!verified.ok) return apiError("unauthorized", verified.reason, 401);
  if (verified.address !== circle.creator.toLowerCase()) {
    return apiError("forbidden", "Only the circle creator can cancel it", 403);
  }

  const [anyContribution] = await db
    .select({ id: contributions.id })
    .from(contributions)
    .where(eq(contributions.circleId, id))
    .limit(1);
  if (anyContribution) {
    return apiError(
      "has_contributions",
      "This circle has verified contributions and cannot be cancelled",
      409
    );
  }

  await db
    .update(circles)
    .set({ status: "cancelled", updatedAt: Date.now() })
    .where(eq(circles.id, id));

  return json({ cancelled: true });
}
