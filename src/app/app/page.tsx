"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Badge, Button, Card, Skeleton, StatusDot } from "@/components/ui/primitives";
import { useAddressBalances, gasLabel } from "@/hooks/use-balances";
import { formatAmount } from "@/lib/format";
import { addrExplorerUrl, networkFor } from "@/lib/chains";
import { BalanceRefresh } from "@/components/dashboard/balance-refresh";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const balances = useAddressBalances(address);

  if (!isConnected || !address) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <h1 className="text-xl font-semibold">Connect a wallet to begin</h1>
        <p className="max-w-md text-sm text-[var(--ink-soft)]">
          MUSD Flow reads balances straight from verified MUSD token contracts on Mezo,
          Ethereum and Base. Nothing here is mocked — connect to see your real
          holdings.
        </p>
      </Card>
    );
  }

  const rows = balances.data ?? [];
  const anyError = rows.some((r) => r.error);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            MUSD balances across verified networks for{" "}
            <span className="font-mono">{shorten(address)}</span>
          </p>
        </div>
        <BalanceRefresh invalidate={balances.refetch} loading={balances.isFetching} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {balances.isPending && rows.length === 0
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-40" />
                <Skeleton className="mt-3 h-3 w-32" />
              </Card>
            ))
          : rows.map((row) => {
              const explorer = addrExplorerUrl(row.net, address);
              return (
                <Card key={row.net.key} className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{row.net.label}</span>
                    {row.net.testnet ? (
                      <Badge tone="warn">Testnet</Badge>
                    ) : (
                      <Badge tone={row.net.musd === "native" ? "gold" : "neutral"}>
                        {row.net.musd === "native" ? "Native" : "Bridged"}
                      </Badge>
                    )}
                  </div>
                  {row.error ? (
                    <div>
                      <p className="text-sm text-[var(--danger)]">
                        Data unavailable <StatusDot tone="danger" />
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {row.error}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        onClick={() => balances.refetch()}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[26px] leading-none">
                          {row.musdWei !== null
                            ? formatAmount(row.musdWei)
                            : "…"}
                        </span>
                        <span className="text-sm text-[var(--ink-soft)]">MUSD</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--ink-faint)]">
                        <span>
                          Gas: {gasLabel(row.gasWei, row.net)}
                        </span>
                        {explorer && (
                          <a
                            href={explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--gold)]"
                          >
                            Explorer ↗
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
      </div>

      {anyError && (
        <p className="text-xs text-[var(--warn)]">
          One or more RPC endpoints failed. The figures shown are only from
          successfully queried networks — nothing is estimated or filled in.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/app/send" title="Send MUSD" desc="Preflight checks, review, real receipt." />
        <QuickLink href="/app/receive" title="Receive" desc="Address QR and shareable payment requests." />
        <QuickLink href="/app/circles" title="MUSD Circles" desc="Group savings with on-chain verified contributions." />
      </div>

      <RecentActivity />
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="mf-card flex flex-col gap-1 p-5 transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]"
    >
      <span className="font-semibold">{title}</span>
      <span className="text-[13px] text-[var(--ink-soft)]">{desc}</span>
    </Link>
  );
}

function shorten(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
