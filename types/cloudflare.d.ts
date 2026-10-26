/**
 * Minimal D1 surface used by drizzle-orm/d1. Full @cloudflare/workers-types
 * come with @opennextjs/cloudflare during Sites preparation; these keep `next
 * dev` typechecking independently.
 */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: unknown[]): Promise<unknown[]>;
  exec(query: string): Promise<void>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta: unknown }>;
  raw<T>(): Promise<T[]>;
  run(): Promise<{ success: boolean; meta: unknown }>;
}
