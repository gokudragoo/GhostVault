'use client';

import { useEffect, useState } from 'react';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { zeroAddress } from 'viem';
import { AppShell } from '@/components/app-shell';
import { DeployBanner } from '@/components/deploy-banner';
import { SepoliaGuard } from '@/components/sepolia-guard';
import { WalletGate } from '@/components/wallet-gate';
import { useCofhe } from '@/contexts/cofhe-provider';
import { ghostVaultAbi, getGhostVaultAddress, hasGhostVault } from '@/lib/contract';
import { parseUint64Input } from '@/lib/amount';

export default function TradePage() {
  const contract = getGhostVaultAddress();
  const { address, isConnected } = useAccount();
  const { ready, client } = useCofhe();
  const [intentStr, setIntentStr] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<bigint | null>(null);

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || confirming;

  const enabled =
    isConnected &&
    !!address &&
    contract !== zeroAddress &&
    ready &&
    client.connected;

  const { data: ctHash, refetch } = useReadContract({
    address: contract,
    abi: ghostVaultAbi,
    functionName: 'getTradeIntent',
    account: address,
    query: { enabled: isConnected && !!address && contract !== zeroAddress },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ctHash || !enabled) {
        setDecrypted(null);
        return;
      }
      try {
        const v = await client
          .decryptForView(ctHash as `0x${string}`, FheTypes.Uint64)
          .execute();
        if (!cancelled) setDecrypted(v as bigint);
      } catch {
        if (!cancelled) setDecrypted(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctHash, enabled, client]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!hasGhostVault()) {
      setLocalError('Configure contract address first.');
      return;
    }
    const amt = parseUint64Input(intentStr);
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
        functionName: 'setTradeIntent',
        args: [encrypted],
      });
      setIntentStr('');
      await refetch();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to set intent');
    }
  }

  return (
    <AppShell>
      <DeployBanner />
      <h1 className="text-3xl font-semibold tracking-tight">Trade privately</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Demo: submit an encrypted swap size (intent) so bots cannot front-run a visible amount. Full
        DEX routing is out of scope for this MVP; this slot proves private execution flow.
      </p>
      <WalletGate>
        <SepoliaGuard>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <form onSubmit={onSubmit} className="space-y-4 rounded border border-zinc-200 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Encrypted intent
              </h2>
              <label className="block text-xs font-medium text-zinc-600">
                Size (uint64)
                <input
                  className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
                  value={intentStr}
                  onChange={(e) => setIntentStr(e.target.value)}
                  inputMode="numeric"
                />
              </label>
              {localError && <p className="text-xs text-red-600">{localError}</p>}
              <button
                type="submit"
                disabled={busy || !hasGhostVault()}
                className="w-full border border-zinc-900 bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {busy ? 'Confirm…' : 'Set intent'}
              </button>
            </form>
            <div className="rounded border border-zinc-900 bg-zinc-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Your decrypted intent
              </h2>
              <p className="mt-4 font-mono text-2xl tabular-nums">
                {decrypted !== null ? decrypted.toString() : '—'}
              </p>
              <p className="mt-2 text-xs text-zinc-500">Only you can decrypt.</p>
            </div>
          </div>
        </SepoliaGuard>
      </WalletGate>
    </AppShell>
  );
}
