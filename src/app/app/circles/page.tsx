"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { Badge, Button, Card, Field, Skeleton, Dialog } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { signedFetch } from "@/lib/client-auth";
import { NETWORKS, networkFor } from "@/lib/chains";

interface CircleRow {
  id: string;
  name: string;
  description: string;
  creator: string;
  chainId: number;
  targetAmount: string;
  deadline: number;
  status: string;
  memberCount: number;
  rulesNote: string;
  payoutAddress: string;
}

export default function CirclesPage() {
  const [rows, setRows] = useState<CircleRow[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const load = () =>
    fetch("/api/circles")
      .then((r) => r.json())
      .then((d) => setRows(d.circles ?? []))
      .catch(() => setLoadErr(true));

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MUSD Circles</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
            Save together toward rent, tuition, travel, emergencies or a business goal.
            Contributions are direct wallet-to-wallet MUSD transfers verified on chain —
            this app never holds group funds.
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>Create a circle</Button>
      </div>

      {loadErr ? (
        <Card className="p-8 text-center text-sm text-[var(--danger)]">
          Could not load circles.{" "}
          <button className="underline" onClick={() => load()}>
            Retry
          </button>
        </Card>
      ) : !rows ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-3 w-48" />
              <Skeleton className="mt-3 h-3 w-24" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[var(--ink-soft)]">
          No circles yet — create the first one and share the invite link with your group.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((c) => (
            <Link key={c.id} href={`/app/circles/${c.id}`} className="mf-card p-5 transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.name}</h3>
                <Badge tone={c.deadline < Date.now() ? "warn" : "neutral"}>
                  {c.deadline < Date.now() ? "Deadline passed" : "Active"}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] text-[var(--ink-soft)]">{c.description || "—"}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-faint)]">
                <span>Target {c.targetAmount} MUSD</span>
                <span>{c.memberCount} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateDialog open={openCreate} onClose={() => setOpenCreate(false)} onCreated={() => load()} />

      <p className="text-xs text-[var(--ink-faint)]">
        How the money works: the creator names a destination address they control (their
        own wallet or a multisig). Members contribute by transferring MUSD there; the
        app records each contribution only after seeing the actual Transfer event on
        chain. Payout decisions, refunds and anything beyond recording remain with the
        group itself.
      </p>
    </div>
  );
}

function CreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const t = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    chainId: 31612 as number,
    targetAmount: "",
    deadlineDays: "30",
    payoutAddress: "",
    rulesNote: "",
  });

  const net = networkFor(form.chainId);

  const create = async () => {
    setErr(null);
    if (!address || !walletClient) return;
    if (!net || !net.musdAddress) {
      setErr("Choose a network with verified MUSD");
      return;
    }
    const deadline = Date.now() + Math.max(1, Number(form.deadlineDays) || 30) * 86_400_000;
    const payout = form.payoutAddress.trim() || address;
    const payload = {
      name: form.name,
      description: form.description,
      chainId: form.chainId,
      targetAmount: form.targetAmount,
      deadline,
      payoutAddress: payout,
      rulesNote: form.rulesNote,
    };
    setBusy(true);
    try {
      const res = await signedFetch("/api/circles", payload, "create_circle", walletClient);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Create failed");
      t.push("Circle created", "success");
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create a savings circle">
      <div className="flex flex-col gap-3 text-sm">
        <Field label="Circle name">
          <input className="mf-input" value={form.name} maxLength={64} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Bali trip 2027" />
        </Field>
        <Field label="Purpose">
          <input className="mf-input" value={form.description} maxLength={500} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Saving Rent together for month of April" />
        </Field>
        <div>
          <span className="mf-label">Network</span>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.filter((n) => n.musdAddress).map((n) => (
              <button
                key={n.key}
                onClick={async () => {
                  setForm((f) => ({ ...f, chainId: n.id }));
                  try {
                    await switchChainAsync({ chainId: n.id });
                  } catch {
                    null;
                  }
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm ${form.chainId === n.id ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "border-[var(--line-strong)] text-[var(--ink-soft)]"}`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Target amount (MUSD)">
          <input className="mf-input" inputMode="decimal" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} placeholder="600" />
        </Field>
        <Field label="Contribution deadline (days from now)">
          <input className="mf-input" inputMode="numeric" value={form.deadlineDays} onChange={(e) => setForm((f) => ({ ...f, deadlineDays: e.target.value }))} />
        </Field>
        <Field
          label="Contribution destination address"
          hint={form.payoutAddress === "" ? "Defaults to your own wallet. You stay in control — never paste someone else's deposit address." : undefined}
        >
          <input className="mf-input font-mono text-xs" value={form.payoutAddress} onChange={(e) => setForm((f) => ({ ...f, payoutAddress: e.target.value }))} placeholder={address ?? "0x…"} />
        </Field>
        <Field label="Group rules note (optional)">
          <input className="mf-input" value={form.rulesNote} maxLength={500} onChange={(e) => setForm((f) => ({ ...f, rulesNote: e.target.value }))} placeholder="Everyone pays by the 5th; late payments recorded when they hit." />
        </Field>
        {err ? <p role="alert" className="text-xs text-[var(--danger)]">{err}</p> : null}
        <Button size="lg" loading={busy} onClick={create} disabled={form.name.length < 3 || !form.targetAmount}>
          Sign & create
        </Button>
      </div>
    </Dialog>
  );
}
