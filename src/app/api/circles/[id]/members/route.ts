import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { circles, circleMembers } from "@/db/schema";
import { authProofSchema, joinCircleSchema } from "@/lib/validation";
import { verifyAuthProof, rateLimit } from "@/lib/auth";
import { clientBucket } from "@/lib/auth";
import { readJson, apiError, json } from "@/lib/api-helpers";
import { z } from "zod";

const fullJoinSchema = joinCircleSchema.extend({ auth: authProofSchema });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await rateLimit(clientBucket(request, "join"), 10, 60_000);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const { id } = await params;
  const parsed = await readJson(request, fullJoinSchema);
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);
  const { auth, ...input } = parsed.data;

  const db = await getDb();
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return apiError("not_found", "Circle not found", 404);
  if (circle.status !== "active") return apiError("inactive", "Circle is not accepting members", 409);
  if (circle.deadline < Date.now()) {
    return apiError("deadline_passed", "Contribution deadline has passed", 409);
  }

  const verified = await verifyAuthProof(auth);
  if (!verified.ok) return apiError("unauthorized", verified.reason, 401);

  try {
    await db.insert(circleMembers).values({
      circleId: id,
      address: verified.address,
      displayName: input.displayName,
      joinedAt: Date.now(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/unique/i.test(msg)) {
      return apiError("already_member", "This wallet already joined", 409);
    }
    console.error("join failed", e);
    return apiError("internal", "Could not join circle", 500);
  }

  return json({ joined: true }, 200);
}
