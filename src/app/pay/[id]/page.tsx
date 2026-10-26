"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useSwitchChain } from "wagmi";
import { Badge, Button, Card, StatusDot } from "@/components/ui/primitives";
import { QrCode } from "@/components/qr";
import { useToast } from "@/components/ui/toast";
import { signedFetch } from "@/lib/client-auth";
import { networkFor, txExplorerUrl } from "@/lib/chains";
import { useWalletClient } from "wagmi";

interface Req {
  id: string;
  creator: string;
  chainId: number;
  token: string;
  amount: string;
  memo: string;
  status: "open" | "paid" | "cancelled";
  paidTx: string | null;
  createdAt: number;
}

export default function PayRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const [req, setReq] = useState<Req | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; reason?: string; txHash?: string } | null>(null);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const t = useToast();

  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/requests/${id}`);
    const data = (await res.json()) as { request?: Req; error?: { message: string } };
    if (data.request) setReq(data.request);
    else setLoadErr(data.error?.message ?? "Not found");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!req && !loadErr) {
    return <div className="mx-auto max-w-md"><Card className="p-8"><div className="mf-skeleton h-40 w-full" /></Card></div>;
  }

  if (!req) {
    return (
      <div className="mx-auto max-w-md mt-10">
        <Card className="p-8 text-center">
          <h1 className="text-lg font-semibold">Payment request unavailable</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{loadErr}</p>
        </Card>
      </div>
    );
  }

  const net = networkFor(req.chainId);
  const explorer = req.paidTx && net ? txExplorerUrl(net, req.paidTx) : null;

  const payHere = async () => {
    const sendUrl = `/app/send?chain=${req.chainId}&to=${req.creator}&amount=${req.amount}&requestId=${req.id}`;
    if (!isConnected || !net) {
      if (net) await switchChainAsync({ chainId: net.id }).catch(() => null);
    }
    window.location.href = sendUrl;
  };

  const verify = async () => {
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash.trim())) {
      t.push("Enter the full transaction hash", "error");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`/api/requests/${req.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash: txHash.trim() }),
      });
      const data = await res.json();
      setVerifyResult(data ?? { verified: false, reason: "Unknown server error" });
      if (data?.verified) {
        t.push("Payment verified on chain", "success");
        load();
      }
    } catch (e) {
      t.push(e instanceof Error ? e.message : "Verification failed", "error");
    } finally {
      setVerifying(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : `/pay/${req.id}`;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 p-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
          MUSD payment request
        </span>
        {req.status === "paid" ? (
          <h1 className="text-3xl font-semibold text-[var(--success)]">Paid ✓</h1>
        ) : req.status === "cancelled" ? (
          <h1 className="text-3xl font-semibold text-[var(--danger)]">Cancelled</h1>
        ) : (
          <h1 className="text-4xl font-semibold">
            {req.amount} <span className="text-lg text-[var(--ink-soft)]">MUSD</span>
          </h1>
        )}
        {req.memo ? <p className="text-center text-sm text-[var(--ink-soft)]">{req.memo}</p> : null}
        <Badge tone={net?.testnet ? "warn" : "neutral"}>{net?.label ?? `Chain ${req.chainId}`}</Badge>
        <div className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-[var(--ink-faint)]">Pay to</span>
            <span className="truncate font-mono">{req.creator}</span>
          </div>
          {req.status === "paid" && req.paidTx ? (
            <div className="mt-2 flex justify-between gap-2">
              <span className="text-[var(--ink-faint)]">Confirmed tx</span>
              <span className="truncate font-mono">{req.paidTx.slice(0, 18)}…</span>
            </div>
          ) : null}
        </div>
        {req.status === "open" ? (
          <>
            <Button onClick={payHere} className="w-full" size="lg">
              Pay {req.amount} MUSD
            </Button>
            <QrCode value={shareUrl} size={120} caption="Share this link" />
          </>
        ) : null}
        {explorer ? (
          <a href={explorer} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--gold)]">
            View payment on explorer ↗
          </a>
        ) : null}
      </Card>

      {req.status === "open" ? (
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Already sent? Verify it</h2>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Paste the transaction hash of your MUSD transfer (sent to {req.creator.slice(0, 10)}…
            on {net?.label}). This server reads the actual receipt and confirms it. Nothing is
            “marked paid” from a claim alone.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              className="mf-input font-mono text-xs"
              placeholder="0x… transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
            <Button loading={verifying} onClick={verify}>
              Verify
            </Button>
          </div>
          {verifyResult ? (
            <p role="status" className="mt-2 text-xs">
              {verifyResult.verified ? (
                <span className="text-[var(--success)]">Verified ✓</span>
              ) : (
                <span className="text-[var(--danger)]">{verifyResult.reason}</span>
              )}
            </p>
          ) : null}
        </Card>
      ) : null}

      <p className="text-center text-xs text-[var(--ink-faint)]">
        Powered by <Link href="/" className="underline">MUSD Flow</Link> — status{" "}
        <StatusDot tone={req.status === "paid" ? "success" : "muted"} /> verified from chain data.
      </p>
    </div>
  );
}
