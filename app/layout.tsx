import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LoreGraphProvider } from '@/lib/context';
import { CrackedEarthBackground } from '@/components/ui/CrackedEarthBackground';

export const metadata: Metadata = {
  title: 'Aakhyana — Interactive Worldbuilding',
  description: 'Capture fragments. Connect ideas. Build worlds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500&family=Zeyada&family=Satisfy&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen relative" style={{ background: 'var(--bg)', isolation: 'isolate' }}>
        <CrackedEarthBackground />
        <AuthProvider>
          <LoreGraphProvider>
            {children}
          </LoreGraphProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
