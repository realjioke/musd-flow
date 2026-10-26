/**
 * Local record of transactions the user *actually initiated in this browser*.
 * This is not a ledger and never a source of truth: balances always come from
 * token contracts, and every record carries the real transaction hash so the
 * status is arbitrary re-derivable from chain data. It exists only to give the
 * user a concrete way back to their own recent activity.
 */
export type TxStatus = "pending" | "confirmed" | "reverted";

export interface ActivityRecord {
  /** unique id: txHash + log index stamp */
  id: string;
  kind: "send" | "contribution" | "payment";
  txHash: string;
  chainId: number;
  from: string;
  to: string;
  amountWei: string;
  createdAt: number;
  status: TxStatus;
  recordKind: "real";
}

const KEY = "musd-flow:activity";

export function getTxs(): ActivityRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t.recordKind === "real");
  } catch {
    return [];
  }
}

function save(txs: ActivityRecord[]) {
  window.localStorage.setItem(KEY, JSON.stringify(txs.slice(-100)));
}

export function addTx(tx: ActivityRecord) {
  const txs = getTxs();
  txs.push(tx);
  save(txs);
}

export function updateTxStatus(id: string, status: TxStatus) {
  const txs = getTxs();
  const next = txs.map((t) => (t.id === id ? { ...t, status } : t));
  save(next);
}
