import type { Chain } from "viem";
import { defineChain } from "viem";

/**
 * VERIFIED network + token configuration.
 *
 * Sources (verified 2026-10-25, see docs/integration-matrix.md):
 * - https://mezo.org/docs/users/getting-started/connect/    (chain id, RPCs, gas symbol)
 * - https://mezo.org/docs/users/resources/contracts-reference/ (MUSD / MEZO token contracts)
 * - https://mezo.org/docs/users/mainnet/bridges/            (Wormhole NTT bridge routes)
 * - Etherscan / BaseScan verification of the MUSD address   (live deployments)
 *
 * Support tiers — we never present unsupported functionality as operational:
 *  - "native"        MUSD is natively issued on this chain
 *  - "supported"     MUSD is available here via the verified Wormhole NTT bridge
 *  - "monitoring"    read-only / informational only (no MUSD operations)
 *  - "unsupported"   not supported for MUSD at all
 */
export type TokenSupport = "native" | "supported" | "monitoring" | "unsupported";

export const MUSD_ADDRESS = "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186" as const;
export const MEZO_TOKEN_ADDRESS_ON_MEZO =
  "0x7B7c000000000000000000000000000000000001" as const;
export const MUSD_TESTNET_ADDRESS =
  "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as const;

export const mezoMainnet: Chain = defineChain({
  id: 31612,
  name: "Mezo",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://mezo-mainnet.boar.network"] } },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.mezo.org" },
  },
});

export const mezoTestnet: Chain = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } },
  blockExplorers: {
    default: { name: "Mezo Testnet Explorer", url: "https://explorer.mezo.org" },
  },
  testnet: true,
});

export interface NetworkDescriptor {
  key: string;
  id: number;
  label: string;
  shortLabel: string;
  chain: Chain;
  testnet: boolean;
  faucet?: { url: string; note: string };
  explorer: string | null;
  musd: TokenSupport;
  musdAddress: string | null;
  mezoToken: TokenSupport;
  mezoTokenAddress: string | null;
  gasSymbol: string;
  /** How MUSD can reach this network (verified only) */
  musdRoute?: string;
}

export const ethereumChain: Chain = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://ethereum-rpc.publicnode.com"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
};

export const baseChain: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://base-rpc.publicnode.com"] } },
  blockExplorers: { default: { name: "BaseScan", url: "https://basescan.org" } },
};

export const bscChain: Chain = {
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://bsc-rpc.publicnode.com"] } },
  blockExplorers: { default: { name: "BscScan", url: "https://bscscan.com" } },
};

export const NETWORKS: NetworkDescriptor[] = [
  {
    key: "mezo",
    id: 31612,
    label: "Mezo",
    shortLabel: "Mezo",
    chain: mezoMainnet,
    testnet: false,
    explorer: "https://explorer.mezo.org",
    musd: "native",
    musdAddress: MUSD_ADDRESS,
    mezoToken: "native",
    mezoTokenAddress: MEZO_TOKEN_ADDRESS_ON_MEZO,
    gasSymbol: "BTC",
  },
  {
    key: "mezo-testnet",
    id: 31611,
    label: "Mezo Testnet",
    shortLabel: "Mezo Test",
    chain: mezoTestnet,
    testnet: true,
    faucet: {
      url: "https://faucet.test.mezo.org/",
      note: "Official Mezo testnet faucet dispenses testnet BTC for gas.",
    },
    explorer: null,
    musd: "native",
    musdAddress: MUSD_TESTNET_ADDRESS,
    mezoToken: "unsupported",
    mezoTokenAddress: null,
    gasSymbol: "BTC (testnet)",
  },
  {
    key: "ethereum",
    id: 1,
    label: "Ethereum",
    shortLabel: "Ethereum",
    chain: ethereumChain,
    testnet: false,
    explorer: "https://etherscan.io",
    musd: "supported",
    musdAddress: MUSD_ADDRESS,
    mezoToken: "supported",
    mezoTokenAddress: null, // bridgeable via Wormhole NTT; address not verified — never guess one
    musdRoute: "MUSD moves Mezo ⇄ Ethereum via Wormhole NTT (official MUSD bridge)",
    gasSymbol: "ETH",
  },
  {
    key: "base",
    id: 8453,
    label: "Base",
    shortLabel: "Base",
    chain: baseChain,
    testnet: false,
    explorer: "https://basescan.org",
    musd: "supported",
    musdAddress: MUSD_ADDRESS,
    mezoToken: "supported",
    mezoTokenAddress: null,
    musdRoute: "MUSD moves Mezo ⇄ Base via Wormhole NTT (official MUSD bridge)",
    gasSymbol: "ETH",
  },
  {
    key: "bsc",
    id: 56,
    label: "BNB Chain",
    shortLabel: "BNB",
    chain: bscChain,
    testnet: false,
    explorer: "https://bscscan.com",
    musd: "unsupported",
    musdAddress: null,
    mezoToken: "supported",
    mezoTokenAddress: null,
    gasSymbol: "BNB",
  },
];

export const networksById = new Map<number, NetworkDescriptor>(
  NETWORKS.map((n) => [n.id, n])
);

export function networkFor(chainId: number | undefined): NetworkDescriptor | null {
  if (chainId === undefined) return null;
  return networksById.get(chainId) ?? null;
}

export function networkByKey(key: string): NetworkDescriptor | null {
  return NETWORKS.find((n) => n.key === key) ?? null;
}

export function musdNetworks(): NetworkDescriptor[] {
  return NETWORKS.filter((n) => n.musdAddress !== null);
}

export function txExplorerUrl(net: NetworkDescriptor, hash: string): string | null {
  if (!net.explorer) return null;
  return `${net.explorer}/tx/${hash}`;
}

export function addrExplorerUrl(net: NetworkDescriptor, address: string): string | null {
  if (!net.explorer) return null;
  return `${net.explorer}/address/${address}`;
}

export const MUSD_BRIDGE_URL = "https://portalbridge.com/";
export const MEZO_DOCS_URL = "https://mezo.org/docs/";
export const MEZO_BRIDGE_DOCS_URL = "https://mezo.org/docs/users/mainnet/bridges/";
