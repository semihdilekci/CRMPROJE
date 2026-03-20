'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuditLog, type AuditLogFilters } from '@/hooks/use-audit-log';
import type { AuditLogEntry } from '@crm/shared';

const ENTITY_TYPES = [
  { value: '', label: 'Tümü' },
  { value: 'fair', label: 'Fuar' },
  { value: 'opportunity', label: 'Fırsat' },
  { value: 'customer', label: 'Müşteri' },
  { value: 'user', label: 'Kullanıcı' },
  { value: 'product', label: 'Ürün' },
  { value: 'setting', label: 'Ayar' },
] as const;

const ACTION_LABELS: Record<string, string> = {
  create: 'Oluşturma',
  update: 'Güncelleme',
  delete: 'Silme',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function summary(entry: AuditLogEntry): string {
  const action = ACTION_LABELS[entry.action] ?? entry.action;
  const entity = entry.entityType;
  const id = entry.entityId ? ` (${entry.entityId.slice(0, 8)}…)` : '';
  return `${entity}${id} — ${action}`;
}

const PAGE_SIZE = 20;

export default function AdminAuditLogPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const { data, isLoading } = useAuditLog({
    ...filters,
    page,
    limit: PAGE_SIZE,
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;

  const handleApply = () => {
    setPage(1);
    setFilters({
      from: from.trim() || undefined,
      to: to.trim() || undefined,
      userId: userId.trim() || undefined,
      entityType: entityType.trim() || undefined,
    });
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setUserId('');
    setEntityType('');
    setPage(1);
    setFilters({});
  };

  return (
    <div className="min-h-screen">
      <TopBar breadcrumb="Yönetim › İşlem Geçmişi" />
      <ContentWrapper>
        <h1 className="text-2xl font-semibold text-white">İşlem Geçmişi</h1>
        <p className="mt-2 text-[14px] text-white/60">
          Fuar, fırsat, müşteri, kullanıcı, ürün ve ayar işlemleri. Salt okunur.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10 p-4">
          <Input
            label="Başlangıç tarihi"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[160px]"
          />
          <Input
            label="Bitiş tarihi"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[160px]"
          />
          <Input
            label="Kullanıcı ID"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-[180px]"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
              Kaynak tipi
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-[160px] rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white focus:border-violet-400/60 focus:outline-none"
            >
              {ENTITY_TYPES.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply}>Filtrele</Button>
            <Button variant="secondary" onClick={handleClear}>
              Temizle
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-white/60">Yükleniyor...</p>
        ) : entries && entries.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10">
              <table className="w-full min-w-[700px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-white/20 backdrop-blur-xl bg-white/5">
                    <th className="px-4 py-3 font-semibold text-white">Tarih</th>
                    <th className="px-4 py-3 font-semibold text-white">Kullanıcı</th>
                    <th className="px-4 py-3 font-semibold text-white">İşlem</th>
                    <th className="px-4 py-3 font-semibold text-white">Özet</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {formatDate(e.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {e.userEmail ?? (e.userId ? `ID: ${e.userId}` : '—')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            e.action === 'delete'
                              ? 'text-danger'
                              : e.action === 'create'
                                ? 'text-green-600'
                                : 'text-violet-400'
                          }
                        >
                          {ACTION_LABELS[e.action] ?? e.action}
                        </span>
                        <span className="ml-1 text-white/60">({e.entityType})</span>
                      </td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-white/60" title={summary(e)}>
                        {summary(e)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10 px-4 py-3">
                <p className="text-[13px] text-white/60">
                  {meta.total > 0
                    ? `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} / ${meta.total} kayıt`
                    : '0 kayıt'}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                  >
                    Önceki
                  </Button>
                  <span className="px-2 text-[13px] text-white/80">
                    Sayfa {meta.page} / {meta.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={meta.page >= meta.totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-white/20 py-16 text-center">
            <p className="text-white/60">
              {Object.keys(filters).length > 0
                ? 'Filtreye uygun kayıt yok.'
                : 'Henüz işlem geçmişi kaydı yok.'}
            </p>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
}
