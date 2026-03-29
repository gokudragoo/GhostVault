'use client';

import { useEffect, useState } from 'react';
import { Encryptable } from '@cofhe/sdk';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AppShell } from '@/components/app-shell';
import { DeployBanner } from '@/components/deploy-banner';
import { SepoliaGuard } from '@/components/sepolia-guard';
import { WalletGate } from '@/components/wallet-gate';
import { useCofhe } from '@/contexts/cofhe-provider';
import { useConfidentialBalance } from '@/hooks/use-confidential-balance';
import { ghostVaultAbi, getGhostVaultAddress, hasGhostVault } from '@/lib/contract';
import { parseUint64Input } from '@/lib/amount';

export default function DashboardPage() {
  const contract = getGhostVaultAddress();
  const { ready, client } = useCofhe();
  const { balance, decrypting, readLoading, error, refetch } = useConfidentialBalance();
  const [depositStr, setDepositStr] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

  const busy = isPending || confirming;

  useEffect(() => {
    if (txSuccess) void refetch();
  }, [txSuccess, refetch]);

  async function onDeposit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!hasGhostVault()) {
      setLocalError('Configure contract address first.');
      return;
    }
    const amt = parseUint64Input(depositStr);
    if (amt === null) {
      setLocalError('Enter a valid uint64 amount.');
      return;
    }
    if (!ready || !client.connected) {
      setLocalError('CoFHE client not ready. Stay on Sepolia and wait a moment.');
      return;
    }
    try {
      const [encrypted] = await client.encryptInputs([Encryptable.uint64(amt)]).execute();
      await writeContractAsync({
        address: contract,
        abi: ghostVaultAbi,
        functionName: 'deposit',
        args: [encrypted],
      });
      setDepositStr('');
      await refetch();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Deposit failed');
    }
  }

  return (
    <AppShell>
      <DeployBanner />
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Encrypted balance for your address. Amounts stay confidential on-chain; you decrypt locally
        with your permit.
      </p>
      <WalletGate>
        <SepoliaGuard>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <section className="rounded border border-zinc-900 bg-zinc-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Encrypted balance
              </h2>
              <p className="mt-4 font-mono text-3xl font-medium tabular-nums">
                {readLoading || decrypting ? (
                  <span className="text-zinc-400">…</span>
                ) : error ? (
                  <span className="text-sm text-red-600">{error}</span>
                ) : (
                  (balance ?? 0n).toString()
                )}
              </p>
              <p className="mt-2 text-xs text-zinc-500">Plaintext view (your device only)</p>
            </section>
            <section className="rounded border border-zinc-200 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Deposit (encrypted)
              </h2>
              <form onSubmit={onDeposit} className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-zinc-600">
                  Amount (uint64)
                  <input
                    className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
                    value={depositStr}
                    onChange={(e) => setDepositStr(e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </label>
                {(localError || '') && (
                  <p className="text-xs text-red-600">{localError}</p>
                )}
                <button
                  type="submit"
                  disabled={busy || !hasGhostVault()}
                  className="w-full border border-zinc-900 bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {busy ? 'Confirm in wallet…' : 'Deposit'}
                </button>
              </form>
            </section>
          </div>
        </SepoliaGuard>
      </WalletGate>
    </AppShell>
  );
}
