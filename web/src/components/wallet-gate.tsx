'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';

export function WalletGate({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  if (!isConnected) {
    return (
      <div className="rounded border border-dashed border-zinc-400 px-6 py-12 text-center">
        <p className="text-lg font-medium">Connect your wallet</p>
        <p className="mt-2 text-sm text-zinc-600">
          GhostVault uses wallet-only sign-in. Connect to use encrypted balances and private flows.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
