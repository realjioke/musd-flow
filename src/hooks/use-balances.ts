"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { erc20Abi, formatEther } from "viem";
import { musdNetworks, type NetworkDescriptor } from "@/lib/chains";
import { publicClientFor } from "@/lib/rpc-client";
import { ERC20_ABI } from "@/lib/erc20";

export interface NetworkBalance {
  net: NetworkDescriptor;
  musdWei: bigint | null;
  gasWei: bigint | null;
  error: string | null;
}

async function fetchBalance(net: NetworkDescriptor, address: string): Promise<NetworkBalance> {
  const base: NetworkBalance = { net, musdWei: null, gasWei: null, error: null };
  const client = publicClientFor(net.id);
  if (!client || !net.musdAddress) {
    return { ...base, error: "No verified MUSD contract on this network" };
  }
  try {
    const [musdWei, gasWei] = await Promise.all([
      client.readContract({
        address: net.musdAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }),
      client.getBalance({ address: address as `0x${string}` }),
    ]);
    return { ...base, musdWei, gasWei };
  } catch (e) {
    return {
      ...base,
      error: e instanceof Error ? e.message : "RPC request failed",
    };
  }
}

export function useAddressBalances(address: string | undefined) {
  const nets = musdNetworks();
  return useQuery({
    queryKey: ["balances", address],
    enabled: Boolean(address),
    networkMode: "always",
    refetchInterval: 45_000,
    queryFn: async (): Promise<NetworkBalance[]> => {
      if (!address) return [];
      return Promise.all(nets.map((net) => fetchBalance(net, address)));
    },
  });
}

export function useInvalidateBalances() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["balances"] });
}

export function gasLabel(wei: bigint | null, net: NetworkDescriptor): string {
  if (wei === null) return "—";
  return `${formatEther(wei).slice(0, 10)} ${net.gasSymbol}`;
}
