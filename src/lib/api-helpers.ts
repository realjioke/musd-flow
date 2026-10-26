import { customAlphabet } from "nanoid";
import { z } from "zod";

const idGen = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 18);

export function newPublicId() {
  return idGen();
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function apiError(code: string, message: string, status = 400) {
  return json({ error: { code, message } }, status);
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<
  { ok: true; data: T } | { ok: false; issues: string }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, issues: "Body must be JSON" };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }
  return { ok: true, data: parsed.data };
}
