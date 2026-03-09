'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  breadcrumb?: string;
  showNewFairButton?: boolean;
  onNewFair?: () => void;
}

export function TopBar({ breadcrumb, showNewFairButton = false, onNewFair }: TopBarProps) {
  const { logout } = useAuthStore();

  return (
    <header
      className="sticky top-0 z-[100] border-b border-border/50"
      style={{
        backgroundColor: '#0A0A0FEE',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[18px] font-semibold text-text">Fuar CRM</span>
          {breadcrumb && (
            <>
              <span className="text-muted">›</span>
              <span className="text-muted text-[14px]">{breadcrumb}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showNewFairButton && onNewFair && (
            <Button onClick={onNewFair} className="text-[13px]">
              + Yeni Fuar
            </Button>
          )}
          <button
            onClick={logout}
            className="cursor-pointer text-[13px] text-muted transition-colors hover:text-text"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
