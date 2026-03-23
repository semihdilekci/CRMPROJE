'use client';

import { use } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { REPORT_CATALOG } from '@crm/shared';
import { ExecutiveSummaryDashboard } from '@/components/reports/dashboards/ExecutiveSummaryDashboard';
import { FairPerformanceDashboard } from '@/components/reports/dashboards/FairPerformanceDashboard';
import { FairComparisonDashboard } from '@/components/reports/dashboards/FairComparisonDashboard';
import { FairTargetsDashboard } from '@/components/reports/dashboards/FairTargetsDashboard';
import { PipelineOverviewDashboard } from '@/components/reports/dashboards/PipelineOverviewDashboard';
import { PipelineVelocityDashboard } from '@/components/reports/dashboards/PipelineVelocityDashboard';
import { WinLossDashboard } from '@/components/reports/dashboards/WinLossDashboard';
import { ReportDashboardLayout } from '@/components/reports/ReportDashboardLayout';

interface ReportDashboardPageProps {
  params: Promise<{ slug: string }>;
}

function findReport(slug: string) {
  for (const cat of REPORT_CATALOG) {
    const report = cat.reports.find((r) => r.slug === slug);
    if (report) return { report, category: cat };
  }
  return null;
}

const DASHBOARD_COMPONENTS: Record<string, React.ComponentType> = {
  'executive-summary': ExecutiveSummaryDashboard,
  'fair-performance': FairPerformanceDashboard,
  'fair-comparison': FairComparisonDashboard,
  'fair-targets': FairTargetsDashboard,
  'pipeline-overview': PipelineOverviewDashboard,
  'pipeline-velocity': PipelineVelocityDashboard,
  'win-loss': WinLossDashboard,
};

export default function ReportDashboardPage({ params }: ReportDashboardPageProps) {
  const { slug } = use(params);
  const result = findReport(slug);

  if (!result) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <ContentWrapper>
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <span className="text-5xl">🔍</span>
            <h2
              className="text-xl text-white/80"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Rapor bulunamadı
            </h2>
            <p className="text-sm text-white/40">
              &quot;{slug}&quot; adında bir rapor mevcut değil.
            </p>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  const { report, category } = result;
  const DashboardComponent = DASHBOARD_COMPONENTS[slug];

  return (
    <div className="min-h-screen">
      <TopBar breadcrumb={report.name} />
      <ContentWrapper>
        {DashboardComponent ? (
          <DashboardComponent />
        ) : (
          <ReportDashboardLayout
            title={report.name}
            subtitle={report.description}
          >
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
              <span className="text-5xl">{report.icon}</span>
              <h2
                className="text-xl text-white/80"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {report.name}
              </h2>
              <p className="max-w-md text-sm text-white/40">
                Bu dashboard {category.title} kategorisindeki raporlar geliştirildiğinde
                aktif olacaktır. Grafik, KPI ve tablo bileşenleri hazır.
              </p>
              <div className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-2 text-[12px] text-violet-400">
                Altyapı hazır &mdash; ilgili feature&apos;da bu sayfa dolacak
              </div>
            </div>
          </ReportDashboardLayout>
        )}
      </ContentWrapper>
    </div>
  );
}
