'use client';

import { useState } from 'react';
import { REPORT_CATALOG, REPORTER_TYPE_LABELS, type ReporterType } from '@crm/shared';
import { Button } from '@/components/ui/Button';

interface ReportEntry {
  reporterType: ReporterType;
  reportSlug: string;
  enabled: boolean;
}

interface ReporterReportDrawerProps {
  entries: ReportEntry[];
  onChange: (entries: ReportEntry[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

const ALL_SLUGS = REPORT_CATALOG.flatMap((cat) => cat.reports.map((r) => r.slug));

function getReportName(slug: string): string {
  for (const cat of REPORT_CATALOG) {
    const report = cat.reports.find((r) => r.slug === slug);
    if (report) return report.name;
  }
  return slug;
}

function getReportCategory(slug: string): string {
  for (const cat of REPORT_CATALOG) {
    const report = cat.reports.find((r) => r.slug === slug);
    if (report) return cat.title;
  }
  return '';
}

export function ReporterReportDrawer({
  entries,
  onChange,
  onSave,
  isSaving = false,
}: ReporterReportDrawerProps) {
  const [open, setOpen] = useState(false);

  const isEnabled = (type: ReporterType, slug: string): boolean => {
    const entry = entries.find((e) => e.reporterType === type && e.reportSlug === slug);
    return entry?.enabled ?? false;
  };

  const handleToggle = (type: ReporterType, slug: string) => {
    const existing = entries.find((e) => e.reporterType === type && e.reportSlug === slug);
    const newEnabled = existing ? !existing.enabled : true;

    const updated = existing
      ? entries.map((e) =>
          e.reporterType === type && e.reportSlug === slug ? { ...e, enabled: newEnabled } : e,
        )
      : [...entries, { reporterType: type, reportSlug: slug, enabled: newEnabled }];

    onChange(updated);
  };

  const reporters: ReporterType[] = ['sales_reporter', 'manager_reporter'];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.04]"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="text-[14px] font-semibold text-white">Rapor Görünürlük Ayarları</p>
          <p className="mt-0.5 text-[12px] text-white/40">
            Satışçı ve yönetici raportörler için hangi raporların görünür olacağını seçin
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-5">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {reporters.map((type) => (
              <div key={type}>
                <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/60">
                  {REPORTER_TYPE_LABELS[type]}
                </h4>
                <div className="flex flex-col gap-2">
                  {ALL_SLUGS.map((slug) => {
                    const checked = isEnabled(type, slug);
                    const category = getReportCategory(slug);
                    return (
                      <label
                        key={slug}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors duration-150 ${
                          checked
                            ? 'border-violet-500/30 bg-violet-500/8'
                            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                        onClick={() => handleToggle(type, slug)}
                      >
                        <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-white/25 bg-white/5">
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-violet-400" fill="none" viewBox="0 0 12 12">
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[12px] font-medium ${checked ? 'text-white/90' : 'text-white/55'}`}>
                            {getReportName(slug)}
                          </p>
                          <p className="text-[11px] text-white/30">{category}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Rapor Ayarlarını Kaydet'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
