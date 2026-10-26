import { issueNonce } from "@/lib/auth";
import { readJson, apiError, json } from "@/lib/api-helpers";
import { nonceRequestSchema } from "@/lib/validation";
import { nonceRateLimit } from "@/lib/route-limits";

export async function POST(request: Request) {
  const parsed = await readJson(request, nonceRequestSchema);
  if (!parsed.ok) return apiError("invalid_input", parsed.issues, 422);

  const rl = await nonceRateLimit(request);
  if (!rl.ok) return apiError("rate_limited", `Retry in ${rl.retryAfterSec}s`, 429);

  const nonce = await issueNonce(parsed.data.address, parsed.data.action);
  return json({ nonce });
}
