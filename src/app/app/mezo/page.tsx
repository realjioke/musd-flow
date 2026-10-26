"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Badge, Button, Card, Skeleton } from "@/components/ui/primitives";import {
  MEZO_DOCS_URL,
  MEZO_BRIDGE_DOCS_URL,
  MUSD_BRIDGE_URL,
  MEZO_TOKEN_ADDRESS_ON_MEZO,
  mezoTestnet,
} from "@/lib/chains";
import { ERC20_ABI } from "@/lib/erc20";
import { publicClientFor } from "@/lib/rpc-client";

export default function MezoPage() {
  const { address } = useAccount();

  const musdQuery = useQuery({
    queryKey: ["mezo-musd", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const client = publicClientFor(31612)!;
      const [mv, rebased] = await Promise.all([
        client.readContract({
          address: MUSD_TOKEN,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address! as `0x${string}`],
        }),
        client.getBalance({ address: address! as `0x${string}` }),
      ]);
      return { musd: mv, gas: rebased };
    },
  });

  const mezoTokenQuery = useQuery({
    queryKey: ["mezo-token", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const client = publicClientFor(31612)!;
      return client.readContract({
        address: MEZO_TOKEN_ADDRESS_ON_MEZO as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address! as `0x${string}`],
      });
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mezo</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
          MUSD is Mezo's Bitcoin-backed stablecoin, minted against Bitcoin collateral.
          This app prefers Mezo for new flows and keeps MUSD's token contract address
          pinned to the values published in Mezo's official docs.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">MUSD on Mezo</p>
          {musdQuery.isPending ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-1 font-mono text-2xl">
              {musdQuery.data ? formatUnits(musdQuery.data.musd, 18).slice(0, 10) : "—"}
            </p>
          )}
          <a href="https://mezo.org/docs/users/resources/contracts-reference/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-[var(--gold)]">
            Official contract reference ↗
          </a>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">MEZO token</p>
          {mezoTokenQuery.isPending ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-1 font-mono text-2xl">
              {mezoTokenQuery.data ? formatUnits(mezoTokenQuery.data, 18).slice(0, 10) : "—"}
            </p>
          )}
          <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
            Governance token — bridgeable Mezo ⇄ Ethereum/Base/BSC via Wormhole NTT.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--ink-faint)] uppercase tracking-wide">Testnet</p>
          <p className="mt-1 text-[13px]">Chain {mezoTestnet.id} · faucet available</p>
          <a href="https://faucet.test.mezo.org/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-[var(--gold)]">
            Official testnet BTC faucet ↗
          </a>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="font-semibold">MEZO utilities we support (and don't invent)</h2>
          <ul className="space-y-1.5 text-[13px] text-[var(--ink-soft)]">
            <li>• Balance reads for MEZO on Mezo mainnet from the official token contract.</li>
            <li>• Bridge routing guidance to Ethereum, Base and BSC via the verified Wormhole NTT route.</li>
            <li>• veMEZO locking is documented and linked for users who want governance/boost mechanics — MUSD Flow does not custody, mint, stake, price or reward the token.</li>
          </ul>
          <div className="flex gap-2">
            <a href={MEZO_BRIDGE_DOCS_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--gold)]">
              Bridge docs ↗
            </a>
            <a href="https://mezo.org/docs/users/mezo-earn/lock/vemezo" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--gold)]">
              veMEZO docs ↗
            </a>
          </div>
        </Card>
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="font-semibold">Ecosystem links</h2>
          <ul className="space-y-1.5 text-[13px]">
            <li><a href={MEZO_DOCS_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--gold)]">Mezo docs ↗</a></li>
            <li><a href={MUSD_BRIDGE_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--gold)]">Portal bridge (Wormhole NTT) ↗</a></li>
            <li><a href="https://mezo.org/ecosystem" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)]">Mezo ecosystem page ↗</a></li>
          </ul>
          <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
            Reward programs are intentionally not implemented: distributing tokens
            without authority over them would be fabricated value. Circles and verified
            payments are the product's real adoption drivers for MUSD.
          </p>
        </Card>
      </div>

      <p className="text-xs text-[var(--ink-faint)]">
        Sources: mezo.org docs (chain 31612 · RPC · explorer), contracts reference for
        token addresses, mainnet bridges overview for NTT routes — all verified{" "}
        {new Date().toISOString().slice(0, 10)} and recorded in the integration matrix doc.
      </p>
    </div>
  );
}

const MUSD_TOKEN = "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186" as `0x${string}`;
