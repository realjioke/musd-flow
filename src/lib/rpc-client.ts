import { createPublicClient, http } from "viem";
import { networkFor } from "@/lib/chains";

type ViemPublicClient = ReturnType<typeof createPublicClient>;

const cache = new Map<number, ViemPublicClient>();

export function publicClientFor(chainId: number): ViemPublicClient | null {
  const net = networkFor(chainId);
  if (!net) return null;
  let client = cache.get(chainId) as ViemPublicClient | undefined;
  if (!client) {
    client = createPublicClient({
      chain: net.chain,
      transport: http(net.chain.rpcUrls.default.http[0], {
        retryCount: 2,
        timeout: 12_000,
      }),
    });
    cache.set(chainId, client);
  }
  return client;
}
