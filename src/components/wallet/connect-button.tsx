"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { Button, CopyButton, StatusDot } from "@/components/ui/primitives";
import { WalletLogo, walletRow, GenericWalletGlyph } from "@/components/ui/wallet-logo";
import { useChainUi } from "@/components/wallet/chain-ui";
import { useToast } from "@/components/ui/toast";
import { shortAddress } from "@/lib/format";
import { publicClientFor } from "@/lib/rpc-client";
import { ERC20_ABI } from "@/lib/erc20";

export function ConnectButton({ full = false }: { full?: boolean }) {
  const { address, isConnected, connector, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { show, label, net: connectedNet, wrongNetwork } = useChainUi();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const toast = useToast();

  // Never claim a wallet is connected unless wagmi confirms it.
  useEffect(() => {
    if (error) toast.push(error.message, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (!isPending) setPendingId(null);
  }, [isPending]);

  // Real balance on the *currently connected* network, via the verified MUSD
  // contract when one exists there. No estimates, no invented figures.
  const { data: balanceWei } = useQuery({
    queryKey: ["header-balance", address, chainId],
    enabled: Boolean(isConnected && address && connectedNet?.musdAddress),
    staleTime: 20_000,
    refetchInterval: 45_000,
    networkMode: "always",
    queryFn: async () => {
      const client = publicClientFor(connectedNet!.id);
      if (!client || !connectedNet!.musdAddress || !address) return null;
      try {
        return (await client.readContract({
          address: connectedNet!.musdAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        })) as bigint;
      } catch {
        return null; // balance simply unavailable — shown as such
      }
    },
  });

  if (isConnected && address) {
    return (
      <div
        className={`flex items-center gap-1.5 ${full ? "w-full flex-wrap" : ""}`}
        title={connector?.name}
      >
        <Button
          variant={wrongNetwork ? "danger" : "secondary"}
          size="sm"
          onClick={() => show()}
          className={wrongNetwork ? "!text-[var(--danger)]" : ""}
          aria-label={`Connected network: ${label()}. Change network`}
        >
          <StatusDot tone={wrongNetwork ? "danger" : "success"} />
          {label()}
        </Button>
        <div
          className={`flex max-w-[210px] items-center gap-1.5 rounded-[10px] border bg-[var(--surface-2)] px-2.5 py-1.5 ${
            wrongNetwork
              ? "border-[rgba(212,112,95,0.4)]"
              : "border-[var(--line-strong)]"
          }`}
        >
          <span className="font-mono text-[13px]">{shortAddress(address)}</span>
          {balanceWei !== undefined && balanceWei !== null ? (
            <span className="border-l border-[var(--line)] pl-1.5 font-mono text-[12px] text-[var(--gold)]">
              {formatEther(balanceWei).slice(0, 9).trimEnd()} MUSD
            </span>
          ) : null}
          <CopyButton value={address} label="" size="sm" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  // EIP-6963 discovered providers first (each carries its own official
  // icon + rdns), then the raw injected fallback, then WalletConnect if configured.
  const discovered = connectors.filter((c) => c.type === "injected" && !c.id.includes("injected"));
  const rawInjected = connectors.filter((c) => c.type === "injected" && c.id.includes("injected"));
  const walletConnect = connectors.filter((c) => c.type === "walletConnect");
  const options = [
    ...discovered.map((c) => ({ connector: c, kind: "discovered" as const })),
    ...rawInjected.map((c) => ({ connector: c, kind: "discovered" as const })),
    ...walletConnect.map((c) => ({ connector: c, kind: "relay" as const })),
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={full ? "lg" : "sm"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={full ? "w-full" : ""}
      >
        Connect wallet
      </Button>
      <WalletSheet
        open={open}
        onClose={() => setOpen(false)}
        options={options}
        pendingId={pendingId}
        onPick={async (entry) => {
          setPendingId(entry.connector.uid);
          try {
            await connect({ connector: entry.connector });
            setOpen(false);
            setPendingId(null);
            toast.push("Wallet connected", "success");
          } catch (e) {
            setPendingId(null);
            toast.push(
              e instanceof Error ? e.message : "Connection was refused",
              "error"
            );
          }
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------- */
/* Wallet sheet: premium connection panel                                */
/* -------------------------------------------------------------------- */

function WalletSheet({
  open,
  onClose,
  options,
  pendingId,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  options: Array<{ connector: import("wagmi").Connector; kind: "discovered" | "relay" }>;
  pendingId: string | null;
  onPick: (entry: { connector: import("wagmi").Connector; kind: "discovered" | "relay" }) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const browserWallets = options.filter((o) => o.kind === "discovered");
  const relayWallets = options.filter((o) => o.kind === "relay");
  const noWallets = options.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect a wallet"
        tabIndex={-1}
        className="mf-sheet mf-card flex max-h-[86vh] w-full flex-col border-b-0 p-6 shadow-2xl sm:max-w-md sm:border-b"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Connect wallet</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Choose a wallet to continue.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="!px-2 !text-base"
          >
            ✕
          </Button>
        </div>

        {noWallets ? (
          <p className="mt-5 rounded-[10px] border border-[rgba(217,160,91,0.4)] bg-[rgba(217,160,91,0.06)] px-4 py-3 text-sm text-[var(--warn)]">
            No browser wallet detected. Install MetaMask, or open a payment link on a
            device that has one.
          </p>
        ) : null}

        {browserWallets.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2" role="list" aria-label="Browser wallets">
            {browserWallets.map(({ connector }) => {
              const id = connector.id.toLowerCase();
              const meta = walletRow(id, connector.name);
              const busy = pendingId === connector.uid || (pendingId === null && false);
              return (
                <button
                  key={connector.uid}
                  role="listitem"
                  disabled={pendingId !== null}
                  onClick={() =>
                    onPick({ connector, kind: "discovered" })
                  }
                  className={`group flex w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-all duration-150 ${
                    busy
                      ? "border-[var(--gold)] bg-[var(--gold-bg)]"
                      : "border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--surface-2)_72%,var(--line)_28%)] focus-visible:border-[var(--gold)]"
                  } ${
                    pendingId !== null && !busy ? "opacity-45" : ""
                  }`}
                >
                  <WalletLogo
                    providerId={id}
                    providerName={connector.name}
                    iconUrl={(connector as unknown as { icon?: string }).icon}
                    size={38}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{meta.name}</span>
                    <span className="text-xs text-[var(--ink-faint)]">
                      {busy ? "Waiting for confirmation…" : meta.desc}
                    </span>
                  </span>
                  {busy ? (
                    <span
                      aria-hidden
                      className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="shrink-0 text-[var(--ink-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--gold)]"
                    >
                      →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        {relayWallets.length > 0 ? (
          <>
            {browserWallets.length > 0 ? (
              <p className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                Other options
              </p>
            ) : null}
            <div className="flex flex-col gap-2" role="list" aria-label="Relay wallets">
              {relayWallets.map(({ connector }) => {
                const id = connector.id.toLowerCase();
                const busy = pendingId === connector.uid;
                return (
                  <button
                    key={connector.uid}
                    role="listitem"
                    disabled={pendingId !== null}
                    onClick={() => onPick({ connector, kind: "relay" })}
                    className={`group flex w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-all duration-150 ${
                      busy
                        ? "border-[var(--gold)] bg-[var(--gold-bg)]"
                        : "border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--surface-2)_72%,var(--line)_28%)] focus-visible:border-[var(--gold)]"
                    } ${pendingId !== null && !busy ? "opacity-45" : ""}`}
                  >
                    <WalletLogo
                      providerId={id}
                      providerName={connector.name}
                      iconUrl={(connector as unknown as { icon?: string }).icon}
                      size={38}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-medium">{connector.name}</span>
                      <span className="text-xs text-[var(--ink-faint)]">
                        {busy ? "Waiting for confirmation…" : walletRow(id, connector.name).desc}
                      </span>
                    </span>
                    {busy ? (
                      <span
                        aria-hidden
                        className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="shrink-0 text-[var(--ink-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--gold)]"
                      >
                        →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        <div className="mt-5 flex items-start gap-2.5 border-t border-[var(--line)] pt-4">
          <GenericWalletGlyph size={22} />
          <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
            MUSD Flow never asks for seed phrases or private keys. Every signature is
            confirmed inside your own wallet; the app only reads on-chain state.
          </p>
        </div>
      </div>
    </div>
  );
}
