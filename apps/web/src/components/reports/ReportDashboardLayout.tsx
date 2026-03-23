'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

interface ReportDashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  filterBar?: ReactNode;
  isLoading?: boolean;
}

export function ReportDashboardLayout({
  title,
  subtitle,
  children,
  filterBar,
  isLoading,
}: ReportDashboardLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div
        style={{
          opacity: 0,
          transform: 'translateY(16px)',
          animation: 'fadeUp 0.5s ease 0.1s forwards',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/reports"
                className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
              >
                Raporlar
              </Link>
              <span className="text-white/20">/</span>
            </div>
            <h1
              className="text-[28px] font-bold"
              style={{
                fontFamily: 'Playfair Display, serif',
                background: 'linear-gradient(135deg, #f8fafc 0%, rgba(248,250,252,0.65) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-[13px] text-white/45">{subtitle}</p>
            )}
          </div>

          {/* Export buttons placeholder */}
          <div className="flex gap-2 shrink-0 mt-6">
            <button
              disabled
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/40 cursor-not-allowed"
              title="R9 feature'ında aktif olacak"
            >
              PDF Export
            </button>
            <button
              disabled
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/40 cursor-not-allowed"
              title="R9 feature'ında aktif olacak"
            >
              CSV Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {filterBar && (
        <div
          style={{
            opacity: 0,
            animation: 'fadeUp 0.4s ease 0.15s forwards',
          }}
        >
          {filterBar}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            <span className="text-sm text-white/40">Rapor verileri yükleniyor...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">{children}</div>
      )}
    </div>
  );
}
