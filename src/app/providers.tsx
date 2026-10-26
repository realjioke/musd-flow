"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/wagmi";
import { ToastProvider } from "@/components/ui/toast";
import { ChainUiProvider } from "@/components/wallet/chain-ui";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 20_000,
      },
    },
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChainUiProvider>
          <ToastProvider>{children}</ToastProvider>
        </ChainUiProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
