import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { sql } from "drizzle-orm";

/**
 * D1 via the OpenNext Cloudflare context. In `next dev` this resolves through
 * initOpenNextCloudflareForDev local bindings; in the deployed Worker, through
 * the real binding.
 */
type CfEnv = { DB: D1Database };

function getEnv(): CfEnv {
  // Loaded lazily so the module stays server-only.
  const mod = require("@opennextjs/cloudflare") as {
    getCloudflareContext: () => { env: CfEnv };
  };
  const ctx = mod.getCloudflareContext();
  if (!ctx?.env?.DB) {
    throw new Error(
      "D1 binding DB is unavailable. Did you run sites_prepare_next and enable initOpenNextCloudflareForDev?"
    );
  }
  return ctx.env;
}

let dbPromise: Promise<DrizzleD1Database> | null = null;

export function getDb(): Promise<DrizzleD1Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = drizzle(getEnv().DB);
      await ensureMigrated(db);
      return db;
    })();
    dbPromise.catch(() => {
      // allow a later retry if bootstrap fails once
      dbPromise = null;
    });
  }
  return dbPromise;
}

let migratedThisIsolate = false;

/**
 * Ordered, idempotent bootstrap migration. Runs at most once per isolate and
 * is safe (IF NOT EXISTS) across concurrent isolates.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS payment_requests (
     id TEXT PRIMARY KEY,
     creator TEXT NOT NULL,
     chain_id INTEGER NOT NULL,
     token TEXT NOT NULL,
     amount TEXT NOT NULL,
     memo TEXT NOT NULL DEFAULT '',
     status TEXT NOT NULL DEFAULT 'open',
     paid_tx TEXT,
     paid_by TEXT,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS payment_requests_creator_idx ON payment_requests (creator)`,
  `CREATE TABLE IF NOT EXISTS circles (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     creator TEXT NOT NULL,
     chain_id INTEGER NOT NULL,
     token TEXT NOT NULL,
     target_amount TEXT NOT NULL,
     deadline INTEGER NOT NULL,
     status TEXT NOT NULL DEFAULT 'active',
     payout_address TEXT NOT NULL,
     rules_note TEXT NOT NULL DEFAULT '',
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS circle_members (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
     address TEXT NOT NULL,
     display_name TEXT NOT NULL DEFAULT '',
     joined_at INTEGER NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS circle_members_unique ON circle_members (circle_id, address)`,
  `CREATE INDEX IF NOT EXISTS circle_members_circle_idx ON circle_members (circle_id)`,
  `CREATE TABLE IF NOT EXISTS contributions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
     tx_hash TEXT NOT NULL,
     log_index INTEGER NOT NULL,
     member TEXT NOT NULL,
     amount TEXT NOT NULL,
     chain_id INTEGER NOT NULL,
     block_number INTEGER NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS contributions_tx_unique ON contributions (circle_id, tx_hash, log_index)`,
  `CREATE INDEX IF NOT EXISTS contributions_circle_idx ON contributions (circle_id)`,
  `CREATE TABLE IF NOT EXISTS auth_nonces (
     nonce TEXT PRIMARY KEY,
     address TEXT NOT NULL,
     action TEXT NOT NULL,
     payload_hash TEXT,
     expires_at INTEGER NOT NULL,
     used INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
     key TEXT NOT NULL,
     window_start INTEGER NOT NULL,
     count INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (key, window_start)
   )`,
];

export async function ensureMigrated(db: DrizzleD1Database): Promise<void> {
  if (migratedThisIsolate) return;
  for (const stmt of MIGRATIONS) {
    await db.run(sql.raw(stmt));
  }
  migratedThisIsolate = true;
}
