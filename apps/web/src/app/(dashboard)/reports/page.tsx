'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';

export default function ReportsPage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <ContentWrapper>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <span className="text-6xl">📋</span>
          <h2
            style={{ fontFamily: 'Playfair Display, serif' }}
            className="text-2xl text-[#f0ede8]"
          >
            Raporlar
          </h2>
          <p className="max-w-sm text-sm text-[#f0ede8]/50">
            Raporlama modülü yakında aktif olacak. Fuar bazlı analitik ve müşteri performans
            raporları burada görüntülenecek.
          </p>
        </div>
      </ContentWrapper>
    </div>
  );
}
