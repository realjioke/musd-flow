"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { NETWORKS, networkFor, type NetworkDescriptor } from "@/lib/chains";
import { Badge, Button, Dialog } from "@/components/ui/primitives";
import { ChainLogo } from "@/components/ui/chain-logo";

interface ChainUi {
  chainId: number | undefined;
  net: NetworkDescriptor | null;
  wrongNetwork: boolean;
  rawNetwork: { name: string; id: number } | null;
  switchTo: (id: number) => Promise<boolean>;
  show: () => void;
  label: () => string;
}

const ChainUiContext = createContext<ChainUi | null>(null);

export function ChainUiProvider({ children }: { children: ReactNode }) {
  const { chainId } = useAccount();
  const { switchChain, switchChainAsync } = useSwitchChain();
  const [pickerOpen, setPickerOpen] = useState(false);

  const net = networkFor(chainId);
  const wrongNetwork = Boolean(chainId) && !net;

  const switchTo = async (id: number) => {
    try {
      await switchChainAsync({ chainId: id });
      return true;
    } catch (e) {
      console.error("switchChain failed", e);
      return false;
    }
  };

  const value: ChainUi = {
    chainId,
    net,
    wrongNetwork,
    rawNetwork: chainId ? { id: chainId, name: `Chain ${chainId}` } : null,
    switchTo,
    show: () => setPickerOpen(true),
    label: () => {
      if (!chainId) return "No network";
      if (!net) return "Wrong network";
      return net.shortLabel;
    },
  };

  return (
    <ChainUiContext.Provider value={value}>
      {children}
      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select network"
      >
        <div className="flex flex-col gap-2">
          {NETWORKS.map((n) => (
            <Button
              key={n.key}
              variant={chainId === n.id ? "secondary" : "ghost"}
              size="lg"
              className="justify-between"
              onClick={async () => {
                const ok = await switchTo(n.id);
                if (ok) setPickerOpen(false);
              }}
            >
              <span className="flex items-center gap-2.5">
                <ChainLogo chainId={n.id} size={24} muted={n.testnet} />
                <span className="flex flex-col items-start gap-0.5">
                  <span>
                    {n.label} <span className="font-mono text-xs text-[var(--ink-faint)]">#{n.id}</span>
                  </span>
                  <span className="text-xs font-normal text-[var(--ink-faint)]">
                    {n.gasSymbol} gas ·{" "}
                    {n.musd === "native"
                      ? "MUSD native ✓"
                      : n.musd === "supported"
                        ? "MUSD bridged ✓"
                        : "MUSD not served — payments disabled"}
                  </span>
                </span>
              </span>
              {n.testnet ? <Badge tone="warn">Testnet</Badge> : null}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          If your wallet does not recognize a network, MUSD Flow marks it unsupported
          rather than sending you to an unverified configuration.
        </p>
      </Dialog>
    </ChainUiContext.Provider>
  );
}

export function useChainUi(): ChainUi {
  const ctx = useContext(ChainUiContext);
  if (!ctx) throw new Error("useChainUi must be used within ChainUiProvider");
  return ctx;
}


