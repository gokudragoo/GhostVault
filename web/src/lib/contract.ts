import type { Address } from 'viem';
import { zeroAddress } from 'viem';
import ghostVaultArtifact from './GhostVault.json';

export const ghostVaultAbi = ghostVaultArtifact.abi as const;

export function getGhostVaultAddress(): Address {
  const raw = process.env.NEXT_PUBLIC_GHOSTVAULT_ADDRESS;
  if (!raw) return zeroAddress;
  return raw as Address;
}

export function hasGhostVault(): boolean {
  return getGhostVaultAddress() !== zeroAddress;
}
