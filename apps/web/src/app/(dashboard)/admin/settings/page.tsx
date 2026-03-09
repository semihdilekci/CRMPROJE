'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Sistem Ayarları" />
      <ContentWrapper>
        <h1 className="font-serif text-[22px] font-semibold text-text">Sistem Ayarları</h1>
        <p className="mt-2 text-[14px] text-muted">
          Varsayılan para birimi ve sözlük değerleri bu sayfada yapılandırılacak. (Feature 29)
        </p>
      </ContentWrapper>
    </div>
  );
}
