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
  actionLabel?: string;
  onAction?: () => void;
}

export function TopBar({ breadcrumb, showNewFairButton = false, onNewFair, actionLabel, onAction }: TopBarProps) {
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

  const navActiveClass =
    'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-white border border-white/20';
  const navInactiveClass = 'text-white/60 hover:text-white hover:bg-white/5';

  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 backdrop-blur-xl bg-slate-950/30">
      <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/fairs"
            className="font-serif text-[18px] font-semibold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent hover:opacity-90"
          >
            Fuar CRM
          </Link>
          <nav className="flex items-center gap-1">
            {main.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-[13px] transition-all duration-300 ${
                  pathname === link.href ? navActiveClass : navInactiveClass
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
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] transition-all duration-300 ${
                    pathname.startsWith('/admin') ? navActiveClass : navInactiveClass
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
                  <div className="absolute left-0 top-full z-[200] mt-1 min-w-[200px] rounded-lg border border-white/20 backdrop-blur-xl bg-slate-950/80 py-1 shadow-lg">
                    {admin.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setAdminOpen(false)}
                        className={`block px-3 py-2 text-[13px] transition-colors hover:bg-white/10 ${
                          pathname === link.href ? 'text-violet-400' : 'text-white'
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
              <span className="text-white/50">›</span>
              <span className="text-white/60 text-[14px]">{breadcrumb}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showNewFairButton && onNewFair && (
            <Button onClick={onNewFair} className="text-[13px]">
              + Yeni Fuar
            </Button>
          )}
          {actionLabel && onAction && (
            <Button onClick={onAction} className="text-[13px]">
              {actionLabel}
            </Button>
          )}
          <button
            onClick={logout}
            className="cursor-pointer rounded-lg px-3 py-2 text-[13px] text-white/80 backdrop-blur-xl bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
