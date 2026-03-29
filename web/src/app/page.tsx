import { AppShell } from '@/components/app-shell';
import { HomeLottie } from '@/components/home-lottie';
import Link from 'next/link';

export default function HomePage() {
  return (
    <AppShell>
      <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Fhenix CoFHE · Sepolia
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Programmable private wallet
          </h1>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            GhostVault keeps balances and transfers encrypted on-chain. Build confidential automation,
            resist MEV-style front-running on intents, and share selective disclosure with auditors
            when you choose.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-zinc-700">
            <li className="flex gap-2">
              <span aria-hidden>◇</span>
              <span>Encrypted balances &amp; private transfers</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>◇</span>
              <span>Rule checks on encrypted thresholds</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>◇</span>
              <span>Hidden trade intents (demo slot)</span>
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex border border-zinc-900 bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open dashboard
            </Link>
            <Link
              href="/send"
              className="inline-flex border border-zinc-900 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Send privately
            </Link>
          </div>
          <p className="mt-8 text-xs text-zinc-500">
            Connect your wallet from the header. Use the{' '}
            <span className="font-medium text-zinc-700">Ethereum Sepolia</span> network.
          </p>
        </div>
        <HomeLottie />
      </div>
    </AppShell>
  );
}
