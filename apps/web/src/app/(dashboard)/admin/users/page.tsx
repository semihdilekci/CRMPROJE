'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Kullanıcı Yönetimi" />
      <ContentWrapper>
        <h1 className="font-serif text-[22px] font-semibold text-text">Kullanıcı Yönetimi</h1>
        <p className="mt-2 text-[14px] text-muted">
          Kullanıcı listesi, arama ve filtreleme bu sayfada yer alacak. (Feature 27)
        </p>
      </ContentWrapper>
    </div>
  );
}
