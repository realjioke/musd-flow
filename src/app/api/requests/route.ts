import { desc, eq } from "drizzle-orm";
import { verifyAuthProof } from "@/lib/auth";
import { createRateLimit, readRateLimit } from "@/lib/route-limits";
import { readJson, apiError, json, newPublicId } from "@/lib/api-helpers";
import { NETWORKS } from "@/lib/chains";
import {
  requestCreateSchema,
  authProofSchema,
} from "@/lib/validation";
import { getDb } from "@/db/client";
import { paymentRequests } from "@/db/schema";
import { z } from "zod";

const fullCreateSchema = requestCreateSchema.extend({
  auth: authProofSchema,
});

export async function GET(request: Request) {
  const rl = await readRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const creator = new URL(request.url).searchParams.get("creator")?.toLowerCase();
  if (creator && !/^0x[a-fA-F0-9]{40}$/.test(creator)) {
    return apiError("invalid_input", "creator must be an EVM address", 422);
  }
  const db = await getDb();
  const rows = creator
    ? await db
        .select()
        .from(paymentRequests)
        .where(eq(paymentRequests.creator, creator))
        .orderBy(desc(paymentRequests.createdAt))
        .limit(50)
    : [];
  return json({ requests: rows });
}

export async function POST(request: Request) {
  const rl = await createRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const parsed = await readJson(request, fullCreateSchema);
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);
  const { auth, ...input } = parsed.data;

  const net = NETWORKS.find((n) => n.id === input.chainId);
  if (!net || !net.musdAddress) {
    return apiError("unsupported_chain", "This chain does not host verified MUSD", 422);
  }

  const verified = await verifyAuthProof(auth);
  if (!verified.ok) return apiError("unauthorized", verified.reason, 401);

  const id = newPublicId();
  const now = Date.now();
  const db = await getDb();
  await db.insert(paymentRequests).values({
    id,
    creator: verified.address,
    chainId: input.chainId,
    token: net.musdAddress,
    amount: input.amount,
    memo: input.memo,
    status: "open",
    createdAt: now,
    updatedAt: now,
    paidTx: null,
    paidBy: null,
  });

  return json({ request: { id, ...input, auth: undefined } }, 201);
}

export type FullCreate = z.infer<typeof fullCreateSchema>;
