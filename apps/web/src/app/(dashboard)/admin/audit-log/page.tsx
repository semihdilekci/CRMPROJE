'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';

export default function AdminAuditLogPage() {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › İşlem Geçmişi" />
      <ContentWrapper>
        <h1 className="font-serif text-[22px] font-semibold text-text">İşlem Geçmişi</h1>
        <p className="mt-2 text-[14px] text-muted">
          Fuar, müşteri, kullanıcı ve ürün işlemleri burada listelenecek. (Feature 30)
        </p>
      </ContentWrapper>
    </div>
  );
}
