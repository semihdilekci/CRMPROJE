'use client';

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { REPORT_CATALOG } from '@crm/shared';

export default function ReportsPage() {
  let cardIndex = 0;

  return (
    <div className="min-h-screen">
      <TopBar />
      <ContentWrapper>
        <div
          className="mb-8"
          style={{
            opacity: 0,
            transform: 'translateY(16px)',
            animation: 'fadeUp 0.5s ease 0.1s forwards',
          }}
        >
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
            Raporlar
          </h1>
          <p className="mt-1 text-[13px] text-white/50">
            7 kategori, 17 rapor &mdash; operasyonun tüm boyutlarını analiz edin
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {REPORT_CATALOG.map((category, catIdx) => (
            <section key={category.id}>
              <div
                className="mb-4"
                style={{
                  opacity: 0,
                  animation: `fadeUp 0.4s ease ${0.2 + catIdx * 0.08}s forwards`,
                }}
              >
                <h2 className="text-lg font-semibold text-white/90">{category.title}</h2>
                <p className="mt-0.5 text-xs text-white/40">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.reports.map((report) => {
                  const delay = 0.25 + cardIndex * 0.06;
                  cardIndex++;
                  return (
                    <Link
                      key={report.slug}
                      href={`/reports/${report.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] p-5 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-violet-500/5"
                      style={{
                        opacity: 0,
                        transform: 'translateY(20px)',
                        animation: `fadeUp 0.5s ease ${delay}s forwards`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

                      <div className="relative">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="text-2xl">{report.icon}</span>
                          <h3 className="text-[14px] font-semibold text-white group-hover:text-violet-200 transition-colors">
                            {report.name}
                          </h3>
                        </div>
                        <p className="text-[12px] leading-relaxed text-white/40 group-hover:text-white/55 transition-colors">
                          {report.description}
                        </p>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-violet-400/60 group-hover:text-violet-400 transition-colors">
                          <span>Dashboard&apos;u aç</span>
                          <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </ContentWrapper>
    </div>
  );
}
