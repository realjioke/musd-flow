import { desc, inArray, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { circles, circleMembers } from "@/db/schema";
import { circleCreateSchema, authProofSchema } from "@/lib/validation";
import { verifyAuthProof } from "@/lib/auth";
import { createRateLimit, readRateLimit } from "@/lib/route-limits";
import { readJson, apiError, json, newPublicId } from "@/lib/api-helpers";
import { NETWORKS } from "@/lib/chains";
import { z } from "zod";

const fullCreateSchema = circleCreateSchema.extend({ auth: authProofSchema });

export async function GET(request: Request) {
  const rl = await readRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const db = await getDb();
  const rows = await db
    .select()
    .from(circles)
    .where(eq(circles.status, "active"))
    .orderBy(desc(circles.createdAt))
    .limit(50);

  const ids = rows.map((r) => r.id);
  const members = ids.length
    ? await db.select().from(circleMembers).where(inArray(circleMembers.circleId, ids))
    : [];

  const byCircle = new Map<string, number>();
  for (const m of members) byCircle.set(m.circleId, (byCircle.get(m.circleId) ?? 0) + 1);

  return json({
    circles: rows.map((r) => ({ ...r, memberCount: byCircle.get(r.id) ?? 0 })),
  });
}

export async function POST(request: Request) {
  const rl = await createRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const parsed = await readJson(request, fullCreateSchema);
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);
  const { auth, ...input } = parsed.data;

  const net = NETWORKS.find((n) => n.id === input.chainId);
  if (!net || !net.musdAddress) {
    return apiError("unsupported_chain", "Circle MUSD contributions require a verified MUSD chain", 422);
  }

  const verified = await verifyAuthProof(auth);
  if (!verified.ok) return apiError("unauthorized", verified.reason, 401);

  const id = newPublicId();
  const now = Date.now();
  const db = await getDb();
  await db.insert(circles).values({
    id,
    name: input.name,
    description: input.description,
    creator: verified.address,
    chainId: input.chainId,
    token: net.musdAddress,
    targetAmount: input.targetAmount,
    deadline: input.deadline,
    status: "active",
    payoutAddress: input.payoutAddress.toLowerCase(),
    rulesNote: input.rulesNote,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(circleMembers).values({
    circleId: id,
    address: verified.address,
    displayName: "",
    joinedAt: now,
  });

  return json({ circle: { id } }, 201);
}

export type CircleCreate = z.infer<typeof fullCreateSchema>;
