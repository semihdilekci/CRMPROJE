'use client';

interface ReportEmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

export function ReportEmptyState({
  icon = '📊',
  title = 'Henüz veri bulunamadı',
  description = 'Bu rapor için yeterli veri yok. Fuar, müşteri veya fırsat eklendikçe burada veriler görünecektir.',
}: ReportEmptyStateProps) {
  return (
    <div
      className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] py-12"
      style={{
        opacity: 0,
        animation: 'fadeUp 0.5s ease 0.3s forwards',
      }}
    >
      <span className="text-4xl">{icon}</span>
      <h3
        className="text-lg font-semibold text-white/70"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h3>
      <p className="max-w-sm text-center text-[13px] text-white/40">
        {description}
      </p>
    </div>
  );
}
