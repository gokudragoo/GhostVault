import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ProvidersRoot } from '@/components/providers-root';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GhostVault — Private programmable wallet',
  description:
    'Encrypted balances, private transfers, and confidential rules on Ethereum Sepolia with Fhenix CoFHE.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProvidersRoot>{children}</ProvidersRoot>
      </body>
    </html>
  );
}
