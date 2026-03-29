'use client';

import { useState } from 'react';
import { Encryptable } from '@cofhe/sdk';
import { isAddress } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AppShell } from '@/components/app-shell';
import { DeployBanner } from '@/components/deploy-banner';
import { SepoliaGuard } from '@/components/sepolia-guard';
import { WalletGate } from '@/components/wallet-gate';
import { useCofhe } from '@/contexts/cofhe-provider';
import { ghostVaultAbi, getGhostVaultAddress, hasGhostVault } from '@/lib/contract';
import { parseUint64Input } from '@/lib/amount';

export default function SendPage() {
  const contract = getGhostVaultAddress();
  const { ready, client } = useCofhe();
  const [to, setTo] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || confirming;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!hasGhostVault()) {
      setLocalError('Configure contract address first.');
      return;
    }
    if (!isAddress(to)) {
      setLocalError('Enter a valid 0x recipient address.');
      return;
    }
    const amt = parseUint64Input(amountStr);
    if (amt === null) {
      setLocalError('Enter a valid uint64 amount.');
      return;
    }
    if (!ready || !client.connected) {
      setLocalError('CoFHE client not ready.');
      return;
    }
    try {
      const [encrypted] = await client.encryptInputs([Encryptable.uint64(amt)]).execute();
      await writeContractAsync({
        address: contract,
        abi: ghostVaultAbi,
        functionName: 'transferPrivate',
        args: [to, encrypted],
      });
      setAmountStr('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Transfer failed');
    }
  }

  return (
    <AppShell>
      <DeployBanner />
      <h1 className="text-3xl font-semibold tracking-tight">Send privately</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Submit an encrypted transfer amount. The chain updates balances homomorphically; observers
        cannot see the amount in plaintext.
      </p>
      <WalletGate>
        <SepoliaGuard>
          <form
            onSubmit={onSubmit}
            className="mt-10 max-w-md space-y-4 rounded border border-zinc-200 p-6"
          >
            <label className="block text-xs font-medium text-zinc-600">
              Recipient
              <input
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="0x…"
                autoComplete="off"
              />
            </label>
            <label className="block text-xs font-medium text-zinc-600">
              Amount (uint64)
              <input
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                inputMode="numeric"
              />
            </label>
            {localError && <p className="text-xs text-red-600">{localError}</p>}
            <button
              type="submit"
              disabled={busy || !hasGhostVault()}
              className="w-full border border-zinc-900 bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {busy ? 'Confirm in wallet…' : 'Transfer private'}
            </button>
          </form>
        </SepoliaGuard>
      </WalletGate>
    </AppShell>
  );
}
