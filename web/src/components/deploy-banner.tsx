'use client';

import { hasGhostVault } from '@/lib/contract';

export function DeployBanner() {
  if (hasGhostVault()) return null;
  return (
    <div
      role="status"
      className="mb-8 rounded border border-zinc-900 bg-zinc-50 px-4 py-3 text-sm text-zinc-800"
    >
      <p className="font-medium">Contract address not configured</p>
      <p className="mt-1 text-zinc-600">
        Set <code className="font-mono text-xs">NEXT_PUBLIC_GHOSTVAULT_ADDRESS</code> after
        deploying <code className="font-mono text-xs">GhostVault</code> to Sepolia (see README).
      </p>
    </div>
  );
}
