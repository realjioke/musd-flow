import { formatUnits, parseUnits } from "viem";

export const MUSD_DECIMALS = 18;

/** Parse a human decimal amount string into raw Wei bigint. Throws on invalid input. */
export function parseTokenAmount(amount: string, decimals = MUSD_DECIMALS): bigint {
  if (!/^\d+(\.\d+)?$/.test(amount.trim())) throw new Error("Invalid amount format");
  const normalized = normalizeDecimalString(amount);
  return parseUnits(normalized, decimals);
}

function normalizeDecimalString(amount: string): string {
  const [int, frac = ""] = amount.trim().split(".");
  if (int === "") return `0.${frac}`;
  if (frac === "") return int;
  return `${int}.${frac}`;
}

export function formatAmount(
  wei: bigint,
  decimals = MUSD_DECIMALS,
  maxFrac = 4
): string {
  const full = formatUnits(wei, decimals);
  const [int, frac] = full.split(".");
  const trimmed = (frac ?? "").replace(/0+$/, "").slice(0, maxFrac);
  if (trimmed === "") {
    return Number(int).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return `${Number(int).toLocaleString("en-US", { maximumFractionDigits: 0 })}.${trimmed}`;
}

/** Exact string value without locale grouping (for inputs, comparisons). */
export function exactAmountString(wei: bigint, decimals = MUSD_DECIMALS): string {
  return formatUnits(wei, decimals);
}

export function isZeroAddress(address: string): boolean {
  return /^0x0{40}$/i.test(address);
}

export function shortAddress(address: string, size = 4): string {
  if (address.length < 12) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function isValidEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}
