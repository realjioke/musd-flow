import { z } from "zod";
import { NETWORKS } from "@/lib/chains";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const DECIMAL = /^\d+(\.\d{1,18})?$/;

export const MUSD_CHAIN_IDS = NETWORKS.filter((n) => n.musdAddress).map((n) => n.id);

export const requestCreateSchema = z.object({
  chainId: z
    .number()
    .int()
    .refine((id) => MUSD_CHAIN_IDS.includes(id), { message: "Unsupported chain for MUSD payments" }),
  amount: z.string().regex(DECIMAL).refine((s) => Number(s) > 0, { message: "Amount must be positive" }).refine((s) => s.length <= 32, { message: "Amount too long" }),
  memo: z.string().max(280).default(""),
});

export const circleCreateSchema = z.object({
  name: z.string().min(3).max(64),
  description: z.string().max(500).default(""),
  chainId: z.number().int().refine((id) => MUSD_CHAIN_IDS.includes(id)),
  targetAmount: z
    .string()
    .regex(DECIMAL)
    .refine((s) => Number(s) > 0),
  deadline: z
    .number()
    .int()
    .refine((ts) => ts > Date.now() && ts < Date.now() + 5 * 366 * 24 * 3600 * 1000),
  payoutAddress: z.string().regex(EVM_ADDRESS),
  rulesNote: z.string().max(500).default(""),
});

export const joinCircleSchema = z.object({
  displayName: z.string().max(40).default(""),
});

export const contributionSubmitSchema = z.object({
  txHash: z.string().regex(TX_HASH),
  memberAddress: z.string().regex(EVM_ADDRESS),
});

export const paymentVerifySchema = z.object({
  txHash: z.string().regex(TX_HASH),
});

export const authProofSchema = z.object({
  address: z.string().regex(EVM_ADDRESS),
  action: z.string().min(4).max(32),
  nonce: z.string().regex(/^[0-9a-f]{32}$/),
  payloadHash: z.string().regex(/^[0-9a-f]{64}$/),
  signature: z.string().min(32).max(200),
});

export const nonceRequestSchema = z.object({
  address: z.string().regex(EVM_ADDRESS),
  action: z.string().min(4).max(32),
  payloadHash: z.string().regex(/^[0-9a-f]{64}$/),
});

export function idSchema() {
  return z.string().regex(/^[a-z0-9]{10,24}$/i);
}
