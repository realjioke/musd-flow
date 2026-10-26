"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useWalletClient } from "wagmi";
import { Badge, Button, Card, CopyButton, Field, Skeleton, StatusDot } from "@/components/ui/primitives";
import { QrCode } from "@/components/qr";
import { useToast } from "@/components/ui/toast";
import { signedFetch } from "@/lib/client-auth";
import { networkFor, txExplorerUrl, addrExplorerUrl, MUSD_BRIDGE_URL } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { useParams } from "next/navigation";

interface Circle {
  circle: {
    id: string;
    name: string;
    description: string;
    creator: string;
    chainId: number;
    token: string;
    targetAmount: string;
    deadline: number;
    status: string;
    payoutAddress: string;
    rulesNote: string;
    createdAt: number;
  };
  members: { address: string; displayName: string; joinedAt: number }[];
  contributions: {
    id: number;
    txHash: string;
    logIndex: number;
    member: string;
    amount: string;
    chainId: number;
    blockNumber: number;
  }[];
}

export default function CircleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Circle | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { address } = useAccount();
  const t = useToast();

  const load = useCallback(async () => {
    const res = await fetch(`/api/circles/${id}`);
    if (!res.ok) {
      setData(null);
      return;
    }
    setData((await res.json()) as Circle);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <Card className="p-10 text-center text-sm text-[var(--ink-soft)]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>
    );
  }

  const { circle } = data;
  const isCreator = !!address && address.toLowerCase() === circle.creator.toLowerCase();
  const hasContrib = data.contributions.length > 0;
  const net = networkFor(circle.chainId);
  const contributed = data.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const target = Number(circle.targetAmount);
  const pct = target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0;
  const expired = circle.deadline < Date.now();
  const totalWeiMicros = contributed.toFixed(4);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/app/circles" className="text-xs text-[var(--ink-soft)]">
          ← All circles
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{circle.name}</h1>
          <Badge tone={expired ? "warn" : "gold"}>{expired ? "Deadline passed" : "Active"}</Badge>
          <Badge tone="neutral">{net?.label}</Badge>
        </div>
        {circle.description ? (
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">{circle.description}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">Progress</p>
          <p className="mt-1 font-mono text-2xl">{contributed ? totalWeiMicros : "0"}</p>
          <p className="text-xs text-[var(--ink-soft)]">of {circle.targetAmount} MUSD target</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--gold)]"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">Members</p>
          <p className="mt-1 font-mono text-2xl">{data.members.length}</p>
          <ul className="mt-2 space-y-1 text-xs">
            {data.members.slice(0, 6).map((m) => (
              <li key={m.address} className="flex items-center justify-between gap-2">
                <span className="font-mono">{m.displayName || shortAddress(m.address)}</span>
                <span className="text-[var(--ink-faint)]">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">Deadline</p>
          <p className="mt-1 font-mono text-2xl">
            {new Date(circle.deadline).toISOString().slice(0, 10)}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">
            {circle.rulesNote || "No extra rules recorded."}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Contribution destination</h2>
            <p className="mt-1 max-w-md text-xs text-[var(--ink-soft)]">
              Members send MUSD directly to this address (controlled by the circle
              creator — not by MUSD Flow), then record the transfer below so it counts
              toward the goal.
            </p>
          </div>
          <QrCode value={circle.payoutAddress} size={96} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2.5">
          <span className="truncate font-mono text-xs">{circle.payoutAddress}</span>
          <CopyButton value={circle.payoutAddress} label="Copy address" />
        </div>
        {net?.explorer ? (
          <a
            href={addrExplorerUrl(net, circle.payoutAddress) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-[var(--gold)]"
          >
            View deposits on {net.label} explorer ↗
          </a>
        ) : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          title="Join this circle"
          desc="Sign a free challenge to confirm you own your wallet, then get added to the member list."
          button="Join circle"
          tone="secondary"
          onOpen={() => setJoinOpen(true)}
        />
        <ActionCard
          title="Record a contribution"
          desc="Already sent MUSD to the destination? Paste the transaction hash — it is only counted after on-chain verification."
          button="Record contribution"
          tone="primary"
          onOpen={() => setContribOpen(true)}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold">Verified contributions</h2>
        {data.contributions.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Nothing verified yet. Contributions appear here only after this server reads
            their real receipt from the chain.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)] text-sm">
            {data.contributions.map((c) => {
              const explorer = txExplorerUrl(networkFor(c.chainId) as NonNullable<ReturnType<typeof networkFor>>, c.txHash);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-mono text-xs">{shortAddress(c.member)}</span>
                  <span className="font-mono">{c.amount} MUSD</span>
                  <StatusDot tone="success" />
                  {explorer ? (
                    <a href={explorer} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--ink-faint)] hover:text-[var(--gold)]">
                      {c.txHash.slice(0, 10)}… ↗
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-[var(--ink-faint)]">{c.txHash.slice(0, 10)}…</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {joinOpen ? (
        <JoinDialog circleId={circle.id} onClose={() => setJoinOpen(false)} onDone={load} />
      ) : null}
      {contribOpen ? (
        <ContribDialog
          circleId={circle.id}
          payoutAddress={circle.payoutAddress}
          chainLabel={net?.label ?? ""}
          bridgeUrl={MUSD_BRIDGE_URL}
          onClose={() => setContribOpen(false)}
          onDone={load}
        />
      ) : null}
      {isCreator && circle.status === "active" ? (
        <ActionCard
          title="Creator controls"
          desc="Cancel this circle only while it is active and before any contribution is recorded — the signature must come from your creator wallet."
          button={hasContrib ? "Cancel circle (blocked)" : "Cancel circle"}
          tone="secondary"
          onOpen={() => setCancelOpen(true)}
        />
      ) : null}

      {cancelOpen && isCreator && circle.status === "active" ? (
        <CancelCircleDialog
          circleName={circle.name}
          hasContributions={data.contributions.length > 0}
          onClose={() => setCancelOpen(false)}
          onDone={load}
        />
      ) : null}
    </div>
  );

  function ActionCard({
    title,
    desc,
    button,
    tone,
    onOpen,
  }: {
    title: string;
    desc: string;
    button: string;
    tone: "secondary" | "primary";
    onOpen: () => void;
  }) {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-[var(--ink-soft)]">{desc}</p>
        <div className="mt-1">
          <Button variant={tone} onClick={onOpen}>
            {button}
          </Button>
        </div>
      </Card>
    );
  }

  function JoinDialog({ circleId, onClose, onDone }: { circleId: string; onClose: () => void; onDone: () => Promise<void> | void }) {
    const { data: walletClient } = useWalletClient();
    const t = useToast();
    const [busy, setBusy] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const join = async () => {
      if (!walletClient) return;
      setBusy(true);
      try {
        const res = await signedFetch(`/api/circles/${circleId}/members`, { displayName }, "join_circle", walletClient);
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? "Join failed");
        t.push("Joined", "success");
        onDone();
        onClose();
      } catch (e) {
        t.push(e instanceof Error ? e.message : "Join failed", "error");
      } finally {
        setBusy(false);
      }
    };
    return (
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="font-semibold">Join with your connected wallet</h2>
        <Field label="Display name (optional)">
          <input className="mf-input" maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alicia" />
        </Field>
        <p className="text-xs text-[var(--ink-soft)]">
          Joining records only your wallet address and optional name. It is confirmed by
          a free signature so nobody can add you by guessing.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={join}>
            Sign & join
          </Button>
        </div>
      </Card>
    );
  }

  function ContribDialog({
    circleId,
    payoutAddress,
    chainLabel,
    bridgeUrl,
    onClose,
    onDone,
  }: {
    circleId: string;
    payoutAddress: string;
    chainLabel: string;
    bridgeUrl: string;
    onClose: () => void;
    onDone: () => Promise<void> | void;
  }) {
    const { address } = useAccount();
    const t = useToast();
    const [txHash, setTxHash] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const submit = async () => {
      if (!address) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/circles/${circleId}/contributions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ txHash: txHash.trim(), memberAddress: address }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message ?? "Verification failed");
        if (data.verified) {
          t.push(`Verified: ${data.contribution.amount} MUSD counted`, "success");
          await onDone();
          onClose();
        } else {
          setResult(data.reason);
        }
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Failed");
      } finally {
        setBusy(false);
      }
    };
    return (
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="font-semibold">Record a contribution</h2>
        <ol className="list-inside list-decimal space-y-1 text-xs text-[var(--ink-soft)]">
          <li>Send MUSD to <span className="font-mono">{shortAddress(payoutAddress)}</span> on {chainLabel}.</li>
          <li>No MUSD on that network? Use the <a href={bridgeUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline">official Portal bridge ↗</a>.</li>
          <li>Paste the transaction hash; the server verifies the receipt.</li>
        </ol>
        <Field label="Transaction hash">
          <input className="mf-input font-mono text-xs" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x…" />
        </Field>
        {result ? <p role="status" className="text-xs text-[var(--danger)]">{result}</p> : null}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button loading={busy} onClick={submit}>
            Verify & record
          </Button>
        </div>
      </Card>
    );
  }

  function CancelCircleDialog({
    circleName,
    hasContributions,
    onClose,
    onDone,
  }: {
    circleName: string;
    hasContributions: boolean;
    onClose: () => void;
    onDone: () => Promise<void> | void;
  }) {
    const { data: walletClient } = useWalletClient();
    const t = useToast();
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const cancel = async () => {
      if (!walletClient) return;
      setBusy(true);
      try {
        const res = await signedFetch(`/api/circles/${id}`, {}, "cancel_circle", walletClient, "DELETE");
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? "Cancel failed");
        t.push(`“${circleName}” cancelled`, "success");
        await onDone();
        onClose();
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Cancel failed");
      } finally {
        setBusy(false);
      }
    };
    return (
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="font-semibold">Cancel “{circleName}”</h2>
        {hasContributions ? (
          <p className="text-xs text-[var(--danger)]">
            This circle already has verified contributions, so the server will refuse
            cancellation — recorded member transfers must stay visible.
          </p>
        ) : (
          <p className="text-xs text-[var(--ink-soft)]">
            Cancelling is permanent. It requires a free signature from the creator
            wallet, so nobody can cancel a circle by guessing its address.
          </p>
        )}
        {result ? <p role="status" className="text-xs text-[var(--danger)]">{result}</p> : null}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Keep circle
          </Button>
          <Button variant="secondary" loading={busy} onClick={cancel}>
            Sign & cancel
          </Button>
        </div>
      </Card>
    );
  }
}
