import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import { AmbientArcBlobs } from '@/components/layout/AmbientArcBlobs';
import './globals.css';

export const metadata: Metadata = {
  title: 'EXPO CRM',
  description: 'Fuar fırsat yönetim paneli',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="relative font-sans antialiased">
        <Providers>
          {/* z-0: body arka planının üstünde; içerik z-10 ile üstte */}
          <AmbientArcBlobs />
          <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
