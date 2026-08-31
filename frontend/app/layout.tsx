import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loseweight.net'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
