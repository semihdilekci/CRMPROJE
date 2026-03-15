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
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/fairs"
            className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
            </div>
            Expo CRM
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
