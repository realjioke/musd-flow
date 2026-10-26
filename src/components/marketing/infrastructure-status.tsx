"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NETWORKS, musdNetworks, networkFor } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { StatusDot } from "@/components/ui/primitives";

type Health =
  | { state: "checking" }
  | { state: "ok"; ms: number }
  | { state: "degraded"; detail: string };

export function InfrastructureStatus() {
  const { isConnected, address, chainId } = useAccount();
  const [health, setHealth] = useState<Health>({ state: "checking" });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/healthz");
        const body = (await res.json()) as {
          checks?: { db?: { ok?: boolean; note?: string } };
          ms?: number;
        };
        if (cancelled) return;
        if (res.ok && body.checks?.db?.ok) {
          setHealth({ state: "ok", ms: body.ms ?? 0 });
        } else {
          setHealth({ state: "degraded", detail: body.checks?.db?.note ?? "Health check failed" });
        }
      } catch {
        if (!cancelled) setHealth({ state: "degraded", detail: "Health check unreachable" });
      }
    };
    check();
    const h = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", h);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", h);
    };
  }, []);

  const net = networkFor(chainId);
  const verifiedMusd = musdNetworks().length;
  const mainnetCount = NETWORKS.filter((n) => !n.testnet).length;

  return (
    <section
      aria-label="MUSD Flow infrastructure status"
      className="mf-card-tech mf-enter flex w-full flex-col gap-3 p-5 sm:rounded-xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <span className="mf-flow-label">MUSD infrastructure</span>
        <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em]">
          {health.state === "checking" ? (
            <>
              <StatusDot tone="warn" />
              <span className="text-[var(--warn)]">Checking…</span>
            </>
          ) : health.state === "ok" ? (
            <>
              <span className="mf-dot-live inline-flex">
                <StatusDot tone="success" />
              </span>
              <span className="text-[var(--success)]">Operational</span>
              <span className="font-mono text-xs text-[var(--ink-faint)]">
                {health.ms} ms
              </span>
            </>
          ) : (
            <>
              <StatusDot tone="danger" />
              <span className="text-[var(--danger)]">Degraded</span>
              <span className="hidden max-w-[220px] truncate text-xs text-[var(--ink-faint)] sm:inline">
                {health.detail}
              </span>
            </>
          )}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <div>
          <dt className="mf-flow-label mb-1">Networks</dt>
          <dd className="text-[13px] font-medium">
            {mainnetCount} live ·{" "}
            <span className="font-semibold text-[var(--success)]">{verifiedMusd} verified MUSD</span>
          </dd>
        </div>
        <div>
          <dt className="mf-flow-label mb-1">Settlement</dt>
          <dd className="text-[13px] font-medium">
            {health.state === "ok" ? (
              <span className="text-[var(--success)]">On-chain · operational</span>
            ) : health.state === "checking" ? (
              <span className="text-[var(--ink-faint)]">Verifying…</span>
            ) : (
              <span className="text-[var(--danger)]">Check below</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="mf-flow-label mb-1">Registry</dt>
          <dd className="text-[13px] font-medium">Chain config verified</dd>
        </div>
        <div>
          <dt className="mf-flow-label mb-1">Wallet</dt>
          <dd className="truncate text-[13px] font-medium">
            {isConnected && address ? (
              <span className="flex items-center gap-1.5">
                <StatusDot tone="success" />
                <span className="font-mono">{shortAddress(address)}</span>
                {net && <span className="text-[var(--ink-faint)]">· {net.shortLabel}</span>}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[var(--ink-faint)]">
                <StatusDot tone="muted" />
                Not connected
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
