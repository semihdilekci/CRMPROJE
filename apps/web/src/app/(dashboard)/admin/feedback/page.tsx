'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteFeedback, useFeedbackList } from '@/hooks/use-feedback';
import type { Feedback, FeedbackCategory } from '@crm/shared';

const CATEGORY_FILTER = [
  { value: '', label: 'Tümü' },
  { value: 'idea', label: 'Fikir / öneri' },
  { value: 'bug', label: 'Hata' },
  { value: 'question', label: 'Soru' },
] as const;

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  idea: 'Fikir / öneri',
  bug: 'Hata',
  question: 'Soru',
};

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminFeedbackPage() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [appliedCategory, setAppliedCategory] = useState<FeedbackCategory | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);

  const { data, isLoading } = useFeedbackList({
    category: appliedCategory,
    page,
    limit: PAGE_SIZE,
  });
  const deleteFeedback = useDeleteFeedback();

  const entries = data?.data ?? [];
  const meta = data?.meta;

  const handleApply = () => {
    setPage(1);
    setAppliedCategory(
      category === 'idea' || category === 'bug' || category === 'question'
        ? category
        : undefined,
    );
  };

  const handleClear = () => {
    setCategory('');
    setAppliedCategory(undefined);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFeedback.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      if (entries.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch {
      // error shown in ConfirmDialog
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar breadcrumb="Yönetim › Geri Bildirimler" />
      <ContentWrapper>
        <h1 className="text-2xl font-semibold text-white">Geri Bildirimler</h1>
        <p className="mt-2 text-[14px] text-white/60">
          Kullanıcıların gönderdiği fikir, hata ve soru bildirimleri.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-white/60">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-[180px] rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-white backdrop-blur-sm focus:border-violet-400/60 focus:outline-none"
            >
              {CATEGORY_FILTER.map((o) => (
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
        ) : entries.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-2xl">
              <table className="w-full min-w-[800px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-white/20 bg-white/5 backdrop-blur-xl">
                    <th className="px-4 py-3 font-semibold text-white">Tarih</th>
                    <th className="px-4 py-3 font-semibold text-white">Kullanıcı</th>
                    <th className="px-4 py-3 font-semibold text-white">Kategori</th>
                    <th className="px-4 py-3 font-semibold text-white">Mesaj</th>
                    <th className="w-[80px] px-4 py-3 font-semibold text-white text-right">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {formatDate(e.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-white">
                        <div>{e.userName}</div>
                        <div className="text-[12px] text-white/50">{e.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            e.category === 'bug'
                              ? 'text-danger'
                              : e.category === 'idea'
                                ? 'text-violet-400'
                                : 'text-cyan-400'
                          }
                        >
                          {CATEGORY_LABELS[e.category]}
                        </span>
                      </td>
                      <td className="max-w-[400px] px-4 py-3 text-white/80">
                        <p className="whitespace-pre-wrap break-words">{e.message}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(e)}
                          className="text-[13px] text-danger hover:underline"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-2xl">
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
              {appliedCategory ? 'Filtreye uygun geri bildirim yok.' : 'Henüz geri bildirim yok.'}
            </p>
          </div>
        )}
      </ContentWrapper>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          deleteFeedback.reset();
        }}
        onConfirm={handleDeleteConfirm}
        title="Geri bildirimi sil"
        message={
          deleteTarget
            ? `${deleteTarget.userName} tarafından gönderilen "${CATEGORY_LABELS[deleteTarget.category]}" bildirimini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        confirmLabel="Sil"
        loading={deleteFeedback.isPending}
        error={
          deleteFeedback.isError && deleteFeedback.error
            ? String(
                (deleteFeedback.error as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? 'Silme işlemi başarısız',
              )
            : undefined
        }
      />
    </div>
  );
}
