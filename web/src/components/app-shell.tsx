'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/send', label: 'Send' },
  { href: '/trade', label: 'Trade' },
  { href: '/rules', label: 'Rules' },
  { href: '/permissions', label: 'Permissions' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-900 px-4 md:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          GhostVault
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:underline underline-offset-4 decoration-zinc-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex justify-end">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>
      <main className="flex-1 px-4 md:px-8 py-10 w-full max-w-5xl mx-auto">{children}</main>
      <footer className="border-t border-zinc-200 px-4 md:px-8 py-6 text-xs text-zinc-500">
        GhostVault — programmable private wallet on Ethereum Sepolia with Fhenix CoFHE. Testnet
        demo; verify claims independently.
      </footer>
    </div>
  );
}
