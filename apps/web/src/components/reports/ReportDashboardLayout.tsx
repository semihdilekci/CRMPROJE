'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { exportDashboardToPdf } from '@/lib/export-pdf';
import { exportToCsv } from '@/lib/export-csv';

interface CsvExportConfig {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string; format?: 'number' | 'currency' | 'percent' | 'date' }[];
  filename?: string;
}

interface ReportDashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  filterBar?: ReactNode;
  isLoading?: boolean;
  csvExportConfig?: CsvExportConfig;
}

export function ReportDashboardLayout({
  title,
  subtitle,
  children,
  filterBar,
  isLoading,
  csvExportConfig,
}: ReportDashboardLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);

  const slugFromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\sığüşöç]/gi, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);

  const handlePdfExport = useCallback(async () => {
    if (!contentRef.current || exporting) return;
    setExporting('pdf');
    try {
      await exportDashboardToPdf(contentRef.current, {
        filename: `rapor-${slugFromTitle}`,
        title,
        orientation: 'landscape',
      });
    } finally {
      setExporting(null);
    }
  }, [exporting, slugFromTitle, title]);

  const handleCsvExport = useCallback(() => {
    if (!csvExportConfig || exporting) return;
    setExporting('csv');
    try {
      exportToCsv(
        csvExportConfig.rows,
        csvExportConfig.columns,
        csvExportConfig.filename ?? `rapor-${slugFromTitle}`,
      );
    } finally {
      setExporting(null);
    }
  }, [csvExportConfig, exporting, slugFromTitle]);

  const hasCsv = !!csvExportConfig && csvExportConfig.rows.length > 0;

  return (
    <div ref={contentRef} className="flex flex-col gap-6">
      {/* Header */}
      <div
        style={{
          opacity: 0,
          transform: 'translateY(16px)',
          animation: 'fadeUp 0.5s ease 0.1s forwards',
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
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
              className="text-[24px] sm:text-[28px] font-bold"
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
              <p className="mt-1 text-[12px] sm:text-[13px] text-white/45">{subtitle}</p>
            )}
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 shrink-0 sm:mt-6">
            <button
              onClick={handlePdfExport}
              disabled={isLoading || exporting === 'pdf'}
              className="group relative inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60 transition-all hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting === 'pdf' ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-violet-400" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              )}
              PDF
            </button>

            <button
              onClick={handleCsvExport}
              disabled={isLoading || !hasCsv || exporting === 'csv'}
              className="group relative inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              title={!hasCsv ? 'Bu raporda dışa aktarılacak tablo verisi yok' : undefined}
            >
              {exporting === 'csv' ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-cyan-400" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              CSV
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
