'use client';

import { useEffect, useState } from 'react';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { zeroAddress } from 'viem';
import { AppShell } from '@/components/app-shell';
import { DeployBanner } from '@/components/deploy-banner';
import { SepoliaGuard } from '@/components/sepolia-guard';
import { WalletGate } from '@/components/wallet-gate';
import { useCofhe } from '@/contexts/cofhe-provider';
import { ghostVaultAbi, getGhostVaultAddress, hasGhostVault } from '@/lib/contract';
import { parseUint64Input } from '@/lib/amount';

export default function RulesPage() {
  const contract = getGhostVaultAddress();
  const { address, isConnected } = useAccount();
  const { ready, client } = useCofhe();
  const [thresholdStr, setThresholdStr] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [above, setAbove] = useState<boolean | null>(null);
  const [decErr, setDecErr] = useState<string | null>(null);

  const enabled =
    isConnected &&
    !!address &&
    contract !== zeroAddress &&
    ready &&
    client.connected;

  const {
    writeContractAsync: writeRule,
    data: ruleHash,
    isPending: rulePending,
  } = useWriteContract();
  const { isLoading: ruleConfirming } = useWaitForTransactionReceipt({ hash: ruleHash });

  const {
    writeContractAsync: writeRefresh,
    data: refreshHash,
    isPending: refreshPending,
  } = useWriteContract();
  const { isLoading: refreshConfirming } = useWaitForTransactionReceipt({ hash: refreshHash });

  const { data: ctBool, refetch: refetchBool } = useReadContract({
    address: contract,
    abi: ghostVaultAbi,
    functionName: 'getLastRuleAbove',
    account: address,
    query: { enabled: isConnected && !!address && contract !== zeroAddress },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ctBool || !enabled) {
        setAbove(null);
        setDecErr(null);
        return;
      }
      try {
        const v = await client
          .decryptForView(ctBool as `0x${string}`, FheTypes.Bool)
          .execute();
        if (!cancelled) {
          setAbove(Boolean(v));
          setDecErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setAbove(null);
          setDecErr(e instanceof Error ? e.message : 'Decrypt failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctBool, enabled, client]);

  async function onSetThreshold(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!hasGhostVault()) {
      setLocalError('Configure contract address first.');
      return;
    }
    const t = parseUint64Input(thresholdStr);
    if (t === null) {
      setLocalError('Enter a valid uint64 threshold.');
      return;
    }
    if (!ready || !client.connected) {
      setLocalError('CoFHE client not ready.');
      return;
    }
    try {
      const [encrypted] = await client.encryptInputs([Encryptable.uint64(t)]).execute();
      await writeRule({
        address: contract,
        abi: ghostVaultAbi,
        functionName: 'setRuleThreshold',
        args: [encrypted],
      });
      setThresholdStr('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to set threshold');
    }
  }

  async function onRefresh() {
    setLocalError(null);
    if (!hasGhostVault()) {
      setLocalError('Configure contract address first.');
      return;
    }
    if (!ready || !client.connected) {
      setLocalError('CoFHE client not ready.');
      return;
    }
    try {
      await writeRefresh({
        address: contract,
        abi: ghostVaultAbi,
        functionName: 'refreshRuleCheck',
      });
      await refetchBool();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Refresh failed');
    }
  }

  const busy = rulePending || ruleConfirming || refreshPending || refreshConfirming;

  return (
    <AppShell>
      <DeployBanner />
      <h1 className="text-3xl font-semibold tracking-tight">Rules engine</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Store an encrypted threshold and evaluate &quot;balance &gt; threshold&quot; on-chain. The
        boolean stays encrypted until you decrypt locally.
      </p>
      <WalletGate>
        <SepoliaGuard>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <form onSubmit={onSetThreshold} className="space-y-4 rounded border border-zinc-200 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Rule threshold
              </h2>
              <label className="block text-xs font-medium text-zinc-600">
                Threshold (uint64)
                <input
                  className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
                  value={thresholdStr}
                  onChange={(e) => setThresholdStr(e.target.value)}
                  inputMode="numeric"
                />
              </label>
              {localError && <p className="text-xs text-red-600">{localError}</p>}
              <button
                type="submit"
                disabled={busy || !hasGhostVault()}
                className="w-full border border-zinc-900 bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {rulePending || ruleConfirming ? 'Confirm…' : 'Save threshold'}
              </button>
            </form>
            <div className="space-y-4 rounded border border-zinc-900 bg-zinc-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Last check
              </h2>
              <p className="font-mono text-lg">
                {above === null ? (decErr ? decErr : 'Run a check') : above ? 'true' : 'false'}
              </p>
              <button
                type="button"
                onClick={onRefresh}
                disabled={busy || !hasGhostVault()}
                className="w-full border border-zinc-900 bg-white py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
              >
                {refreshPending || refreshConfirming ? 'Confirm…' : 'Run rule check (tx)'}
              </button>
              <p className="text-xs text-zinc-500">
                <code className="font-mono">refreshRuleCheck</code> must be a transaction so ACL
                updates persist for decryption.
              </p>
            </div>
          </div>
        </SepoliaGuard>
      </WalletGate>
    </AppShell>
  );
}
