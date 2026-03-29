'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { useState, type ReactNode } from 'react';
import { wagmiConfig } from '@/lib/wagmi';
import { CofheProvider } from '@/contexts/cofhe-provider';

import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#000000',
            accentColorForeground: '#ffffff',
            borderRadius: 'small',
            fontStack: 'system',
          })}
        >
          <CofheProvider>{children}</CofheProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
