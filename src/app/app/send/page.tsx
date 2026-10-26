"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { Button, Card, Field, StatusDot } from "@/components/ui/primitives";
import { useSendFlow } from "@/hooks/use-send-flow";
import { NETWORKS, networkFor, txExplorerUrl } from "@/lib/chains";
import { formatAmount, isValidEvmAddress } from "@/lib/format";
import { useInvalidateBalances } from "@/hooks/use-balances";
import { useToast } from "@/components/ui/toast";

export default function SendPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const flow = useSendFlow();
  const toast = useToast();
  const invalidateBalances = useInvalidateBalances();
  const [checking, setChecking] = useState(false);

  if (!isConnected || !address) {
    return (
      <Card className="p-10 text-center text-sm text-[var(--ink-soft)]">
        Connect a wallet to send.
      </Card>
    );
  }

  const musdNets = NETWORKS.filter((n) => n.musdAddress);

  if (flow.stage === "signing" || flow.stage === "tracking") {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <StatusDot tone="warn" />
          <div>
            <h1 className="text-lg font-semibold">
              {flow.stage === "signing" ? "Waiting for your wallet…" : "Tracking transaction…"}
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {flow.stage === "signing"
                ? "Approve or reject the transfer in your wallet. Closing this page does not cancel a signed transaction."
                : flow.txHash
                  ? `Broadcast as ${flow.txHash}. Waiting for a real receipt — success is only claimed from chain data.`
                  : "Fetching receipt…"}
            </p>
          </div>
          {flow.txHash && <span className="break-all font-mono text-xs text-[var(--ink-faint)]">{flow.txHash}</span>}
        </Card>
      </div>
    );
  }

  if (flow.stage === "confirmed" || flow.stage === "reverted" || flow.stage === "failed") {
    const net = flow.net;
    const explorer = flow.txHash && net ? txExplorerUrl(net, flow.txHash) : null;
    const done = flow.stage === "confirmed";
    return (
      <div className="mx-auto max-w-lg">
        <Card className="flex flex-col gap-4 p-8">
          {done ? (
            <>
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                Transfer confirmed <StatusDot tone="success" />
              </h1>
              <p className="text-sm text-[var(--ink-soft)]">
                The receipt status for{" "}
                <span className="font-mono text-xs">{flow.txHash}</span> is{" "}
                <strong>success</strong>: {formatAmount(flow.preflight!.tokenWei)} MUSD
                to <span className="font-mono text-xs">{flow.form.recipient}</span>.
              </p>
            </>
          ) : flow.stage === "reverted" ? (
            <>
              <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--danger)]">
                Transaction reverted <StatusDot tone="danger" />
              </h1>
              <p className="text-sm text-[var(--ink-soft)]">
                The transaction mined but reverted. No MUSD moved. Gas was spent —
                review the failure on the explorer before retrying.
              </p>
            </>
          ) : (
            <>
              <h1 className="flex items-start gap-2 text-xl font-semibold">
                Transfer not completed <StatusDot tone="warn" />
              </h1>
              <p className="text-sm text-[var(--ink-soft)]">{flow.failure}</p>
            </>
          )}
          {flow.txHash && (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
              <span className="font-mono text-xs">{flow.txHash}</span>
              {explorer && (
                <a
                  href={explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-[var(--gold)]"
                >
                  View on {net?.label} explorer ↗
                </a>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={flow.reset}>
              Send another
            </Button>
            {done ? (
              <Button
                onClick={() => {
                  invalidateBalances();
                  toast.push("Balances refreshed", "success");
                }}
              >
                Refresh balances
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  if (flow.stage === "review" && flow.preflight && flow.net) {
    return (
      <ReviewScreen
        flow={flow}
        onExecute={() =>
          flow.execute().catch((e: Error) => toast.push(e.message, "error"))
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Send MUSD</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Sends are direct ERC-20 transfer calls to the verified MUSD contract on a
        supported network.
      </p>

      <Card className="mt-5 flex flex-col gap-5 p-6">
        <div>
          <span className="mf-label">Network</span>
          <div className="flex flex-wrap gap-2">
            {musdNets.map((n) => (
              <button
                key={n.key}
                onClick={async () => {
                  flow.setChain(n.id);
                  // Ask the wallet to actually join the chosen network if needed.
                  if (chainId !== n.id) {
                    try {
                      await switchChainAsync({ chainId: n.id });
                    } catch (e) {
                      toast.push(
                        `Could not switch your wallet to ${n.label} — it must switch before sending.`,
                        "error"
                      );
                      console.error(e);
                    }
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  flow.form.chainId === n.id
                    ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]"
                    : "border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--gold)]"
                }`}
              >
                {n.label}
                {n.testnet ? " ⚙" : ""}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Recipient address"
          error={
            flow.form.recipient && !isValidEvmAddress(flow.form.recipient)
              ? "Not a valid EVM address"
              : null
          }
          hint="Full 0x-prefixed 42-character address. Double-check character by character."
        >
          <input
            className="mf-input font-mono"
            placeholder="0x..."
            value={flow.form.recipient}
            onChange={(e) => flow.setForm((f) => ({ ...f, recipient: e.target.value }))}
            aria-invalid={Boolean(flow.form.recipient) && !isValidEvmAddress(flow.form.recipient)}
          />
        </Field>

        <Field
          label="Amount (MUSD)"
          hint="Token decimals are shown exactly; no price conversion is applied."
        >
          <input
            className="mf-input"
            inputMode="decimal"
            placeholder="0.00"
            value={flow.form.amount}
            onChange={(e) => flow.setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </Field>

        {flow.failure ? (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {flow.failure}
          </p>
        ) : null}

        <Button
          size="lg"
          loading={checking}
          disabled={
            !flow.form.chainId ||
            !isValidEvmAddress(flow.form.recipient) ||
            !flow.form.amount
          }
          onClick={() => {
            setChecking(true);
            flow
              .runPreflight()
              .catch((e: Error) => toast.push(e.message, "error"))
              .finally(() => setChecking(false));
          }}
        >
          Check & review
        </Button>
      </Card>
      <p className="mt-3 text-xs text-[var(--ink-faint)]">
        Preflight reads your live MUSD and {flow.net?.gasSymbol ?? "native"} gas
        balances, estimates gas, and refuses to continue on insufficient funds. Your
        wallet is still the final authority at signing.
      </p>
    </div>
  );
}

function ReviewScreen({
  flow,
  onExecute,
}: {
  flow: ReturnType<typeof useSendFlow>;
  onExecute: () => Promise<void>;
}) {
  const pf = flow.preflight!;
  const net = flow.net!;
  const [execErr, setExecErr] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Review transfer</h1>
      <Card className="mt-5 flex flex-col gap-4 p-6 text-sm">
        <Row label="You send">
          {formatAmount(pf.tokenWei)} <strong>MUSD</strong>
        </Row>
        <Row label="Network">
          {net.label} <span className="text-xs text-[var(--ink-faint)]">#{net.id}</span>
        </Row>
        <Row label="From" mono>
          {flow.address}
        </Row>
        <Row label="To" mono>
          {flow.form.recipient}
        </Row>
        <Row label="Est. gas cost">
          {pf.gasCostWei
            ? `${formatEther(pf.gasCostWei).slice(0, 12)} ${net.gasSymbol}`
            : "Unavailable (see warning)"}
        </Row>
        {pf.musdBalance !== null ? (
          <Row label="MUSD balance after">
            {formatAmount(pf.musdBalance - pf.tokenWei)}
          </Row>
        ) : null}
        {pf.gasBalance !== null && pf.gasCostWei !== null ? (
          <Row label="Gas balance after">
            {formatEther(pf.gasBalance - pf.gasCostWei).slice(0, 10)} {net.gasSymbol}
          </Row>
        ) : null}
        {pf.warnings.map((w) => (
          <p
            key={w}
            role="status"
            className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--warn)]"
          >
            ⚠ {w}
          </p>
        ))}
        {execErr ? (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {execErr}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={flow.reset}>
            Back
          </Button>
          <Button onClick={() => onExecute().catch((e: Error) => setExecErr(e.message))}>
            Confirm in wallet
          </Button>
        </div>
        <p className="text-xs text-[var(--ink-faint)]">
          Nothing moves until you approve it in your wallet. Success is only ever
          claimed from the on-chain receipt.
        </p>
      </Card>
    </div>
  );
}

function Row({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span
        className={`truncate text-right ${mono ? "font-mono text-xs" : ""}`}
        title={mono ? String(children) : undefined}
      >
        {children}
      </span>
    </div>
  );
}
