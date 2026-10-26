import { clientBucket, rateLimit } from "@/lib/auth";

export const LIMITS = {
  nonce: [8, 60_000] as const,
  create: [10, 60_000] as const,
  verify: [20, 60_000] as const,
  read: [120, 60_000] as const,
};

export async function nonceRateLimit(request: Request) {
  return rateLimit(clientBucket(request, "nonce"), ...LIMITS.nonce);
}

export async function createRateLimit(request: Request) {
  return rateLimit(clientBucket(request, "create"), ...LIMITS.create);
}

export async function verifyRateLimit(request: Request) {
  return rateLimit(clientBucket(request, "verify"), ...LIMITS.verify);
}

export async function readRateLimit(request: Request) {
  return rateLimit(clientBucket(request, "read"), ...LIMITS.read);
}
