"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Badge, Card, Skeleton } from "@/components/ui/primitives";
import { getTxs, type ActivityRecord } from "@/lib/local-activity";
import { networkFor, txExplorerUrl } from "@/lib/chains";
import { formatAmount, shortAddress } from "@/lib/format";

export default function ActivityPage() {
  const { address } = useAccount();
  const [txs, setTxs] = useState<ActivityRecord[] | null>(null);
  const [requests, setRequests] = useState<ReqRow[] | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setTxs(getTxs().slice().reverse());
  }, []);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/requests?creator=${address}`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => setRequests([]));
  }, [address]);

  const filteredTxs = useMemo(
    () =>
      (txs ?? []).filter(
        (t) =>
          (filterType === "all" || t.kind === filterType) &&
          (filterStatus === "all" || t.status === filterStatus)
      ),
    [txs, filterType, filterStatus]
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
          Every entry carries a real transaction hash you can open on an explorer. This
          list is local to this browser (kept in localStorage); on-chain state always
          remains the authority.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "send", "contribution", "payment"].map((k) => (
          <FilterChip key={k} active={filterType === k} onClick={() => setFilterType(k)} label={k === "all" ? "All types" : k} />
        ))}
        <span className="w-px bg-[var(--line-strong)]" />
        {["all", "pending", "confirmed", "reverted"].map((k) => (
          <FilterChip key={k} active={filterStatus === k} onClick={() => setFilterStatus(k)} label={k === "all" ? "All states" : k} />
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold">Transactions initiated here</h2>
        {txs === null ? (
          <div className="mt-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredTxs.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            No matching transactions recorded in this browser.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)] text-sm">
            {filteredTxs.map((tx) => {
              const net = networkFor(tx.chainId);
              const explorer = net ? txExplorerUrl(net, tx.txHash) : null;
              return (
                <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="w-24 capitalize text-[var(--ink-soft)]">{tx.kind}</span>
                  <span className="font-mono">
                    {formatAmount(BigInt(tx.amountWei))} MUSD
                  </span>
                  <span className="text-xs text-[var(--ink-faint)]">
                    {tx.kind === "send" ? `to ${shortAddress(tx.to)}` : `from ${shortAddress(tx.from)}`}
                  </span>
                  <Badge tone={tx.status === "confirmed" ? "success" : tx.status === "reverted" ? "danger" : "warn"}>
                    {tx.status}
                  </Badge>
                  {explorer ? (
                    <a href={explorer} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--gold)]">
                      Explorer ↗
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold">Your payment requests</h2>
        {address === undefined ? (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Connect a wallet to see requests you created.</p>
        ) : requests === null ? (
          <div className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">No payment requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)] text-sm">
            {requests.map((r) => {
              const net = networkFor(r.chainId);
              const explorer = r.paidTx && net ? txExplorerUrl(net, r.paidTx) : null;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <a href={`/pay/${r.id}`} className="text-[var(--gold)] underline-offset-2 hover:underline">
                    {r.memo || "Payment request"}
                  </a>
                  <span className="font-mono">{r.amount} MUSD</span>
                  <Badge tone={r.status === "paid" ? "success" : r.status === "open" ? "neutral" : "danger"}>
                    {r.status}
                  </Badge>
                  {explorer ? (
                    <a href={explorer} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--ink-faint)] hover:text-[var(--gold)]">
                      payment tx ↗
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-xs text-[var(--ink-faint)]">
        Fixture data: none. If an entry lives only in this browser, the list above says
        exactly where it came from — chain data is always the authority.
      </p>
    </div>
  );
}

interface ReqRow {
  id: string;
  amount: string;
  memo: string;
  status: string;
  paidTx: string | null;
  chainId: number;
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1 text-xs capitalize ${active ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "border-[var(--line-strong)] text-[var(--ink-soft)]"}`}
    >
      {label}
    </button>
  );
}
