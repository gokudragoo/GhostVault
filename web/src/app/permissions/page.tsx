'use client';

import { useState } from 'react';
import { isAddress } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AppShell } from '@/components/app-shell';
import { DeployBanner } from '@/components/deploy-banner';
import { SepoliaGuard } from '@/components/sepolia-guard';
import { WalletGate } from '@/components/wallet-gate';
import { ghostVaultAbi, getGhostVaultAddress, hasGhostVault } from '@/lib/contract';

export default function PermissionsPage() {
  const contract = getGhostVaultAddress();
  const [viewer, setViewer] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || confirming;

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!hasGhostVault()) {
      setLocalError('Configure contract address first.');
      return;
    }
    if (!isAddress(viewer)) {
      setLocalError('Enter a valid 0x address.');
      return;
    }
    try {
      await writeContractAsync({
        address: contract,
        abi: ghostVaultAbi,
        functionName: 'grantBalanceViewer',
        args: [viewer],
      });
      setViewer('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  return (
    <AppShell>
      <DeployBanner />
      <h1 className="text-3xl font-semibold tracking-tight">Permissions</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Selective disclosure: grant an auditor, employer, or counterparty access to your encrypted
        balance handle via on-chain ACL. They still need a valid CoFHE permit to decrypt.
      </p>
      <WalletGate>
        <SepoliaGuard>
          <form
            onSubmit={onGrant}
            className="mt-10 max-w-md space-y-4 rounded border border-zinc-200 p-6"
          >
            <label className="block text-xs font-medium text-zinc-600">
              Viewer address
              <input
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
                value={viewer}
                onChange={(e) => setViewer(e.target.value)}
                placeholder="0x…"
              />
            </label>
            {localError && <p className="text-xs text-red-600">{localError}</p>}
            <button
              type="submit"
              disabled={busy || !hasGhostVault()}
              className="w-full border border-zinc-900 bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {busy ? 'Confirm in wallet…' : 'Grant balance viewer'}
            </button>
          </form>
        </SepoliaGuard>
      </WalletGate>
    </AppShell>
  );
}
