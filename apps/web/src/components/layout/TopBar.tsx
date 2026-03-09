'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { getNavForRole } from '@/lib/nav';

interface TopBarProps {
  breadcrumb?: string;
  showNewFairButton?: boolean;
  onNewFair?: () => void;
}

export function TopBar({ breadcrumb, showNewFairButton = false, onNewFair }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { main, admin } = getNavForRole(user?.role);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-[100] border-b border-border/50"
      style={{
        backgroundColor: '#0A0A0FEE',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/fairs"
            className="font-serif text-[18px] font-semibold text-text hover:opacity-90"
          >
            Fuar CRM
          </Link>
          <nav className="flex items-center gap-1">
            {main.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                  pathname === link.href ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {admin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAdminOpen((o) => !o)}
                  className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-accent/20 text-accent'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {admin.title}
                  <span
                    className={`inline-block transition-transform ${adminOpen ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </span>
                </button>
                {adminOpen && (
                  <div className="absolute left-0 top-full z-[200] mt-1 min-w-[200px] rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {admin.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setAdminOpen(false)}
                        className={`block px-3 py-2 text-[13px] transition-colors hover:bg-accent/10 ${
                          pathname === link.href ? 'text-accent' : 'text-text'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
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
