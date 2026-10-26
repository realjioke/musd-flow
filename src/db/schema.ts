import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";

/**
 * Amounts are stored as exact decimal strings ("12.5") of the human-unit token.
 * Wei conversion happens only at the edges with bigint math — never floats.
 */

export const paymentRequests = sqliteTable(
  "payment_requests",
  {
    id: text("id").primaryKey(),
    creator: text("creator").notNull(),
    chainId: integer("chain_id").notNull(),
    token: text("token").notNull(),
    amount: text("amount").notNull(),
    memo: text("memo").notNull().default(""),
    status: text("status", { enum: ["open", "paid", "cancelled"] })
      .notNull()
      .default("open"),
    paidTx: text("paid_tx"),
    paidBy: text("paid_by"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("payment_requests_creator_idx").on(t.creator)]
);

export const circles = sqliteTable("circles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  creator: text("creator").notNull(),
  chainId: integer("chain_id").notNull(),
  token: text("token").notNull(),
  targetAmount: text("target_amount").notNull(),
  deadline: integer("deadline").notNull(),
  status: text("status", { enum: ["active", "cancelled", "closed"] })
    .notNull()
    .default("active"),
  /** Destination owned by the circle creator (never by this app) */
  payoutAddress: text("payout_address").notNull(),
  rulesNote: text("rules_note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const circleMembers = sqliteTable(
  "circle_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    circleId: text("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    displayName: text("display_name").notNull().default(""),
    joinedAt: integer("joined_at").notNull(),
  },
  (t) => [
    uniqueIndex("circle_members_unique").on(t.circleId, t.address),
    index("circle_members_circle_idx").on(t.circleId),
  ]
);

export const contributions = sqliteTable(
  "contributions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    circleId: text("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    txHash: text("tx_hash").notNull(),
    logIndex: integer("log_index").notNull(),
    member: text("member").notNull(),
    amount: text("amount").notNull(),
    chainId: integer("chain_id").notNull(),
    blockNumber: integer("block_number").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("contributions_tx_unique").on(t.circleId, t.txHash, t.logIndex),
    index("contributions_circle_idx").on(t.circleId),
  ]
);

export const authNonces = sqliteTable("auth_nonces", {
  nonce: text("nonce").primaryKey(),
  address: text("address").notNull(),
  action: text("action").notNull(),
  payloadHash: text("payload_hash"),
  expiresAt: integer("expires_at").notNull(),
  used: integer("used").notNull().default(0),
});

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ name: "rate_limits_pk", columns: [t.key, t.windowStart] })]
);
