import type { Metadata } from 'next';
import './globals.css';

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
      <body className="bg-[#0B0D12] text-[#E8E6DF] min-h-screen">
        {children}
      </body>
    </html>
  );
}
