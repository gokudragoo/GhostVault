'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import type { ReactNode } from 'react';

export function SepoliaGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return <>{children}</>;
  }

  if (chainId !== sepolia.id) {
    return (
      <div className="rounded border border-zinc-900 bg-white p-6 text-center">
        <p className="text-lg font-medium">Switch to Ethereum Sepolia</p>
        <p className="mt-2 text-sm text-zinc-600">
          GhostVault uses Fhenix CoFHE on Sepolia (chain {sepolia.id}).
        </p>
        <button
          type="button"
          className="mt-4 border border-zinc-900 bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          disabled={isPending}
          onClick={() => switchChain?.({ chainId: sepolia.id })}
        >
          {isPending ? 'Switching…' : 'Switch network'}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
