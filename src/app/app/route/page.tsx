"use client";

import { useState } from "react";
import { Badge, Card } from "@/components/ui/primitives";
import {
  NETWORKS,
  MUSD_BRIDGE_URL,
  MEZO_BRIDGE_DOCS_URL,
  type NetworkDescriptor,
  type TokenSupport,
} from "@/lib/chains";

/**
 * Smart Route is deliberately informational in v1:
 * executing bridges requires provider quotes, approvals and validated
 * parameters we do not yet integrate. We compare VERIFIED routes only and
 * never simulate a successful transfer.
 */

type Matrix = Record<string, { musd: TokenSupport; route?: string; mezo: TokenSupport }>;

const matrixOf = (): Matrix => {
  const m: Matrix = {};
  const byKey = (k: string) => NETWORKS.find((n) => n.key === k) as NetworkDescriptor;
  for (const a of ["mezo", "ethereum", "base", "bsc"]) {
    for (const b of ["mezo", "ethereum", "base", "bsc"]) {
      if (a === b) continue;
      const A = byKey(a);
      const B = byKey(b);
      if (a === "bsc") {
        // Leaving BSC: MEZO token is bridgeable back; MUSD never had a BSC route.
        m[`${a}:${b}`] = {
          musd: "unsupported",
          mezo: B.mezoToken,
          route: undefined,
        };
      } else if (b === "bsc") {
        m[`${a}:${b}`] = {
          musd: "unsupported",
          mezo: "supported",
          route: undefined,
        };
      } else {
        m[`${a}:${b}`] = {
          musd: "supported",
          mezo: "supported",
          route: `MUSD moves ${A.label} ⇄ ${B.label} via the official Wormhole NTT bridge (Portal).`,
        };
      }
    }
  }
  return m;
};

const MATRIX = matrixOf();

export default function RoutePage() {
  const nets = NETWORKS.filter((n) => n.key !== "mezo-testnet");
  const [from, setFrom] = useState("ethereum");
  const [to, setTo] = useState("mezo");

  const cell = MATRIX[`${from}:${to}`];
  const fromNet = nets.find((n) => n.key === from)!;
  const toNet = nets.find((n) => n.key === to)!;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Smart Route</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
          Transfer-planning that tells the truth. Only routes documented by official
          sources appear here; everything else is labeled unsupported rather than
          invented. Fee and completion-time quotes require a bridge provider we do not
          yet execute against — so we do not fake them.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mf-label">From</span>
            <div className="flex flex-wrap gap-2">
              {nets.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setFrom(n.key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${from === n.key ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "border-[var(--line-strong)] text-[var(--ink-soft)]"}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mf-label">To</span>
            <div className="flex flex-wrap gap-2">
              {nets.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setTo(n.key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${to === n.key ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "border-[var(--line-strong)] text-[var(--ink-soft)]"}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {from === to ? (
          <p className="text-sm text-[var(--ink-soft)]">Pick two different networks.</p>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <span className="font-medium">
                {fromNet.shortLabel} → {toNet.shortLabel}
              </span>
              {cell.musd === "supported" ? (
                <Badge tone="success">Verified route</Badge>
              ) : cell.musd === "monitoring" ? (
                <Badge tone="warn">No MUSD path</Badge>
              ) : (
                <Badge tone="danger">Unsupported</Badge>
              )}
            </div>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <InfoRow k="MUSD capability" v={supportWord(cell.musd)} />
              <InfoRow k="MEZO token capability" v={supportWord(cell.mezo)} />
              <InfoRow k="Route provider" v={cell.route ? "Wormhole NTT — executed via the Portal UI, not by MUSD Flow" : "—"} />
              <InfoRow k="Quote / fees" v={cell.musd === "supported" ? "Available only in the provider UI at execution time" : "N/A"} />
            </dl>
            <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
              {cell.route ?? "No verified route. MUSD Flow will not estimate or execute a transfer that has no documented path."}
            </p>
            {cell.musd === "supported" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={MUSD_BRIDGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center rounded-[10px] bg-[var(--gold)] px-4 text-sm font-medium text-[#161405] hover:bg-[var(--gold-soft)]"
                >
                  Open Portal bridge ↗
                </a>
                <a
                  href={MEZO_BRIDGE_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line-strong)] px-4 text-sm hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]"
                >
                  Read Mezo bridge docs ↗
                </a>
              </div>
            ) : null}
            <p className="text-xs text-[var(--warn)]">
              Bridge execution was intentionally left out of v1: approvals and
              cross-chain messages are security-critical, and we would rather ship a
              planner that is always right than a click-through that can lose funds.
              Documented as a roadmap item.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-1.5">
      <dt className="text-xs text-[var(--ink-faint)]">{k}</dt>
      <dd className="text-right text-[13px]">{v}</dd>
    </div>
  );
}

function supportWord(t: TokenSupport): string {
  switch (t) {
    case "native":
      return "Native";
    case "supported":
      return "Bridged (verified)";
    case "monitoring":
      return "No live token path";
    default:
      return "Unsupported";
  }
}

export function describeNet(net: NetworkDescriptor) {
  return net.musdRoute ?? net.label;
}
