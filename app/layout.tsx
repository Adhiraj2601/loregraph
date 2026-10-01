import type { Metadata } from 'next';
import './globals.css';
import { LoreGraphProvider } from '@/lib/context';
import { CrackedEarthBackground } from '@/components/ui/CrackedEarthBackground';

export const metadata: Metadata = {
  title: 'LoreGraph — Interactive Worldbuilding',
  description: 'Capture fragments. Connect ideas. Build worlds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
        <CrackedEarthBackground />
        <LoreGraphProvider>
          {children}
        </LoreGraphProvider>
      </body>
    </html>
  );
}
