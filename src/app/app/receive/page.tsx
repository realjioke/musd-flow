"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { Button, Card, CopyButton, Field, Badge } from "@/components/ui/primitives";
import { QrCode } from "@/components/qr";
import { signedFetch } from "@/lib/client-auth";
import { addrExplorerUrl, networkFor, NETWORKS } from "@/lib/chains";
import { useToast as toast } from "@/components/ui/toast";

export default function ReceivePage() {
  const [tab, setTab] = useState<"address" | "request">("request");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Receive</h1>
      <div className="mt-4 flex gap-2">
        {(
          [
            ["request", "Payment request"],
            ["address", "Address only"],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} variant={tab === k ? "secondary" : "ghost"} size="sm" onClick={() => setTab(k)}>
            {label}
          </Button>
        ))}
      </div>
      {tab === "request" ? <MakeRequest /> : <AddressQr />}
    </div>
  );
}

function AddressQr() {
  const { address, chainId } = useAccount();
  const net = networkFor(chainId);
  const { switchChainAsync } = useSwitchChain();

  if (!address) {
    return <Card className="mt-4 p-10 text-center text-sm text-[var(--ink-soft)]">Connect a wallet.</Card>;
  }

  return (
    <Card className="mt-4 flex flex-col items-center gap-4 p-8">
      <Badge tone={net?.testnet ? "warn" : "gold"}>{net?.label ?? "Unknown network"}</Badge>
      <QrCode value={address} caption={net?.label} />
      <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3">
        <span className="truncate font-mono text-xs">{address}</span>
        <CopyButton value={address} label="Copy" />
      </div>
      {net ? (
        <a href={addrExplorerUrl(net, address) ?? "#"} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--gold)]">
          View on explorer ↗
        </a>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {NETWORKS.filter((n) => n.musdAddress).map((n) => (
          <Button key={n.key} variant="ghost" size="sm" onClick={() => switchChainAsync({ chainId: n.id }).catch(() => null)}>
            {n.shortLabel}
          </Button>
        ))}
      </div>
      <p className="text-center text-xs text-[var(--warn)]">
        Share your address only over the network shown. Sending MUSD on another network may
        behave differently — send only MUSD on its supported networks.
      </p>
    </Card>
  );
}

function MakeRequest() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const t = toast();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [targetChain, setTargetChain] = useState<number | null>(null);

  const chain = targetChain ?? chainId;
  const net = networkFor(chain);

  if (!address) return <Card className="mt-4 p-10 text-center text-sm text-[var(--ink-soft)]">Connect a wallet.</Card>;
  if (!walletClient) return <Card className="mt-4 p-10 text-center text-sm text-[var(--ink-soft)]">Reconnecting wallet…</Card>;

  const create = async () => {
    if (!net || !net.musdAddress) {
      t.push("Choose a network that hosts verified MUSD", "error");
      return;
    }
    if (!/^\d+(\.\d{1,18})?$/.test(amount) || Number(amount) <= 0) {
      t.push("Enter a positive decimal amount", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await signedFetch(
        "/api/requests",
        {
          chainId: net.id,
          amount,
          memo: memo.slice(0, 280),
        },
        "create_request",
        walletClient
      );
      const data = (await res.json()) as { request?: { id: string }; error?: { message: string } };
      if (!res.ok || !data.request) throw new Error(data.error?.message ?? "Request creation failed");
      setCreated(data.request.id);
      t.push("Payment request created", "success");
    } catch (e) {
      t.push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${created}`;
    return (
      <Card className="mt-4 flex flex-col items-center gap-4 p-8">
        <h2 className="font-semibold">Request created</h2>
        <QrCode value={url} caption={url} />
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2.5">
            <span className="truncate font-mono text-xs">{url}</span>
            <CopyButton value={url} label="Copy link" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "MUSD payment request", url }).catch(() => null);
              } else {
                navigator.clipboard.writeText(url).then(
                  () => t.push("Link copied", "success"),
                  () => t.push("Copy failed", "error")
                );
              }
            }}
          >
            Share
          </Button>
          <Button variant="ghost" onClick={() => { setCreated(null); }}>
            Create another
          </Button>
        </div>
        <a href={`/pay/${created}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--gold)]">
          Open request page ↗
        </a>
      </Card>
    );
  }

  return (
    <Card className="mt-4 flex flex-col gap-4 p-6">
      <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
        Shares a public page at <span className="font-mono">/pay/…</span>. Anyone can open
        it; payment is only marked after the MUSD transfer to your address is verified on
        chain by this server.
      </p>
      <div>
        <span className="mf-label">Network</span>
        <div className="flex flex-wrap gap-2">
          {NETWORKS.filter((n) => n.musdAddress).map((n) => (
            <button
              key={n.key}
              onClick={() => setTargetChain(n.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                chain === n.id
                  ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]"
                  : "border-[var(--line-strong)] text-[var(--ink-soft)]"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="Amount (MUSD)">
        <input
          className="mf-input"
          inputMode="decimal"
          placeholder="25.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Note (shown publicly)">
        <input
          className="mf-input"
          maxLength={280}
          placeholder="October invoice, coffee plan, teacher gift…"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </Field>
      <Button size="lg" loading={busy} onClick={create}>
        Sign & create request
      </Button>
    </Card>
  );
}
