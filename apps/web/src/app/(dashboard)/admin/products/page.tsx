'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';

export default function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Ürün Listesi" />
      <ContentWrapper>
        <h1 className="font-serif text-[22px] font-semibold text-text">Ürün Listesi</h1>
        <p className="mt-2 text-[14px] text-muted">
          İlgilenilen ürünler master listesi bu sayfada yönetilecek. (Feature 28)
        </p>
      </ContentWrapper>
    </div>
  );
}
