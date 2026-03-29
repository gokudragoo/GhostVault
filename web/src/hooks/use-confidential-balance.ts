'use client';

import { useEffect, useState } from 'react';
import { FheTypes } from '@cofhe/sdk';
import { useAccount, useReadContract } from 'wagmi';
import { zeroAddress } from 'viem';
import { useCofhe } from '@/contexts/cofhe-provider';
import { ghostVaultAbi, getGhostVaultAddress } from '@/lib/contract';

export function useConfidentialBalance() {
  const { address, isConnected } = useAccount();
  const { ready, client } = useCofhe();
  const contract = getGhostVaultAddress();

  const enabled =
    isConnected &&
    !!address &&
    contract !== zeroAddress &&
    ready &&
    client.connected;

  const { data: ctHash, refetch, isLoading: readLoading } = useReadContract({
    address: contract,
    abi: ghostVaultAbi,
    functionName: 'getBalance',
    account: address,
    query: { enabled: isConnected && !!address && contract !== zeroAddress },
  });

  const [balance, setBalance] = useState<bigint | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ctHash || !enabled) {
        setBalance(null);
        setError(null);
        return;
      }
      setDecrypting(true);
      setError(null);
      try {
        const v = await client
          .decryptForView(ctHash as `0x${string}`, FheTypes.Uint64)
          .execute();
        if (!cancelled) setBalance(v as bigint);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not decrypt balance');
          setBalance(null);
        }
      } finally {
        if (!cancelled) setDecrypting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctHash, enabled, client]);

  return {
    balance,
    decrypting,
    readLoading,
    error,
    refetch,
  };
}
