import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import {
  NETWORKS,
  mezoMainnet,
  mezoTestnet,
  ethereumChain,
  baseChain,
  bscChain,
} from "@/lib/chains";

// Chains verified in the integration matrix; order must match NETWORKS.
const chains = [mezoMainnet, mezoTestnet, ethereumChain, baseChain, bscChain] as const;
void NETWORKS;

const wcProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

export const config = createConfig({
  chains,
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  transports: {
    31612: http("https://mezo-mainnet.boar.network"),
    31611: http("https://rpc.test.mezo.org"),
    1: http("https://ethereum-rpc.publicnode.com"),
    8453: http("https://base-rpc.publicnode.com"),
    56: http("https://bsc-rpc.publicnode.com"),
  },
  ssr: true,
});

export const WALLET_CONNECT_CONFIGURED = Boolean(wcProjectId);
