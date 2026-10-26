"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { getTxs, type ActivityRecord } from "@/lib/local-activity";
import { networkFor, txExplorerUrl } from "@/lib/chains";
import { formatAmount } from "@/lib/format";

export function RecentActivity() {
  const [txs, setTxs] = useState<ActivityRecord[] | null>(null);

  useEffect(() => {
    setTxs(getTxs().slice(-6).reverse());
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Recent activity</h2>
        <Link href="/app/activity" className="text-xs text-[var(--ink-soft)] hover:text-[var(--gold)]">
          View all →
        </Link>
      </div>
      {txs === null ? null : txs.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          Transactions you initiate in this browser will appear here with their real
          hash, status and explorer link.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--line)] text-sm">
          {txs.map((t) => {
            const net = networkFor(t.chainId);
            const explorer = net ? txExplorerUrl(net, t.txHash) : null;
            const color =
              t.status === "confirmed"
                ? "var(--success)"
                : t.status === "reverted"
                  ? "var(--danger)"
                  : "var(--warn)";
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="capitalize text-[var(--ink-soft)]">{t.kind}</span>
                <span className="font-mono">
                  {formatAmount(BigInt(t.amountWei))} MUSD
                </span>
                <span className="text-xs" style={{ color }}>
                  {t.status}
                </span>
                {explorer ? (
                  <a
                    href={explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-xs text-[var(--ink-faint)] hover:text-[var(--gold)]"
                  >
                    {t.txHash.slice(0, 10)}… ↗
                  </a>
                ) : (
                  <span className="shrink-0 font-mono text-xs text-[var(--ink-faint)]">
                    {t.txHash.slice(0, 10)}…
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
