import { json } from "@/lib/api-helpers";
import { getDb } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; note: string }> = {
    config: { ok: true, note: "chain registry loaded" },
  };

  let dbOk = false;
  try {
    const db = await getDb();
    await db.run(sql`SELECT 1`);
    dbOk = true;
    checks.db = { ok: true, note: "D1 reachable" };
  } catch (e) {
    checks.db = {
      ok: false,
      note: e instanceof Error ? e.message : "D1 binding unavailable",
    };
  }

  return json(
    { status: dbOk ? "ok" : "degraded", checks, ms: Date.now() - started, version: "0.1.0" },
    dbOk ? 200 : 503
  );
}
