'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatBudget, getStageLabel } from '@crm/shared';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import {
  useCustomerProfile,
  useDeleteCustomer,
  useDeleteOpportunityNote,
  useUpdateOpportunityNote,
} from '@/hooks/use-customers';
import { CustomerEditModal } from '@/components/customer/CustomerEditModal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const ORDERED_STAGES = ['tanisma', 'toplanti', 'teklif', 'sozlesme'] as const;

function formatMonthYear(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', year: 'numeric' }).format(date);
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(startDate)}–${new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(endDate)}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getPendingAgeClass(days: number): string {
  if (days >= 30) return 'text-red-400';
  if (days >= 14) return 'text-amber-400';
  return 'text-[#f0ede8]/50';
}

function getTimelineTone(stage: string): {
  card: string;
  dot: string;
  badge: string;
  badgeText: string;
} {
  if (stage === 'satisa_donustu') {
    return {
      card: 'border-green-400/30 bg-green-400/[0.04]',
      dot: '#4ade80',
      badge: 'border-green-400/22 bg-green-400/12 text-green-400',
      badgeText: '✓ Satışa Dönüştü',
    };
  }
  if (stage === 'olumsuz') {
    return {
      card: 'border-red-400/20 bg-red-400/[0.04]',
      dot: '#f87171',
      badge: 'border-red-400/20 bg-red-400/10 text-red-400',
      badgeText: '✕ Olumsuz',
    };
  }
  return {
    card: 'border-violet-500/30 bg-violet-500/[0.05]',
    dot: '#a78bfa',
    badge: 'border-violet-500/25 bg-violet-500/15 text-violet-300',
    badgeText: `● ${getStageLabel(stage)}`,
  };
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const from = searchParams.get('from');
  const fromName = searchParams.get('fromName');

  const { data: profile, isLoading } = useCustomerProfile(customerId);
  const updateNote = useUpdateOpportunityNote(customerId);
  const deleteNote = useDeleteOpportunityNote(customerId);
  const deleteCustomer = useDeleteCustomer();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deleteCustomerError, setDeleteCustomerError] = useState('');

  const timeline = useMemo(() => {
    if (!profile) return [];
    return [...profile.opportunityTimeline].sort(
      (a, b) => new Date(b.fairStartDate).getTime() - new Date(a.fairStartDate).getTime(),
    );
  }, [profile]);

  const noteList = useMemo(() => {
    if (!profile) return [];
    return [...profile.allNotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [profile]);

  const backLabel = useMemo(() => {
    if (from?.startsWith('/fairs/')) {
      return `← ${fromName ?? 'Fuar'}na Dön`;
    }
    return '← Müşterilere Dön';
  }, [from, fromName]);

  const handleBack = () => {
    if (from) {
      router.push(from);
      return;
    }
    router.push('/customers');
  };

  const handleSaveNote = async (opportunityId: string, noteId: string) => {
    const content = (noteDrafts[noteId] ?? '').trim();
    if (!content) return;
    await updateNote.mutateAsync({
      opportunityId,
      noteId,
      dto: { content },
    });
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (opportunityId: string, noteId: string) => {
    await deleteNote.mutateAsync({ opportunityId, noteId });
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handleConfirmDeleteCustomer = async () => {
    setDeleteCustomerError('');
    try {
      await deleteCustomer.mutateAsync(customerId);
      setDeleteCustomerOpen(false);
      router.push('/customers');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Müşteri silinemedi.';
      setDeleteCustomerError(message);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/60 text-lg">Yükleniyor...</p>
      </div>
    );
  }

  const initials = profile.customer.company.slice(0, 2).toLocaleUpperCase('tr');

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 10% 15%, rgba(139,92,246,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 45% at 90% 80%, rgba(6,182,212,0.14) 0%, transparent 70%), radial-gradient(ellipse 40% 35% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        <TopBar breadcrumb={profile.customer.company} />
        <ContentWrapper>
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 cursor-pointer text-[13px] text-[#f0ede8]/50 transition-colors hover:text-[#f0ede8]"
          >
            {backLabel}
          </button>

          <section
            className="fade-up rounded-2xl border border-white/[0.08] bg-white/[0.04] p-[28px] backdrop-blur-xl md:p-[28px_32px]"
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-5">
                {profile.customer.cardImage ? (
                  <img
                    src={profile.customer.cardImage}
                    alt={profile.customer.company}
                    className="h-[110px] w-[110px] rounded-xl border border-white/20 object-cover"
                  />
                ) : (
                  <div
                    className="flex h-[110px] w-[110px] items-center justify-center rounded-xl border border-violet-500/35 text-[38px] font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background:
                        'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(6,182,212,0.25))',
                    }}
                  >
                    {initials}
                  </div>
                )}

                <div>
                  <p
                    className="text-[24px] font-bold leading-tight text-[#f0ede8]"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {profile.customer.company}
                  </p>
                  <p className="mt-1 text-[15px] text-[#f0ede8]/50">{profile.customer.name}</p>

                  <div className="mt-4 flex flex-col gap-2 text-sm text-[#f0ede8]/75">
                    {profile.customer.phone && (
                      <a href={`tel:${profile.customer.phone}`} className="hover:text-[#f0ede8]">
                        📞 {profile.customer.phone}
                      </a>
                    )}
                    {profile.customer.email && (
                      <a href={`mailto:${profile.customer.email}`} className="hover:text-[#f0ede8]">
                        ✉ {profile.customer.email}
                      </a>
                    )}
                  </div>

                  <p className="mt-4 text-[12px] text-[#f0ede8]/30">
                    İlk Temas: {formatMonthYear(profile.kpi.firstContact)} · Son Temas:{' '}
                    {formatMonthYear(profile.kpi.lastContact)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 md:flex-col md:items-end">
                <Button
                  type="button"
                  className="px-5 py-2 text-[13px]"
                  onClick={() => setEditCustomerOpen(true)}
                >
                  ✏️ Düzenle
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="border border-red-400/25 bg-red-400/10 px-5 py-2 text-[13px] text-red-400"
                  onClick={() => {
                    setDeleteCustomerError('');
                    setDeleteCustomerOpen(true);
                  }}
                >
                  🗑 Sil
                </Button>
              </div>
            </div>
          </section>

          <section
            className="fade-up mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
            style={{ animationDelay: '60ms' }}
          >
            <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.035] p-4 text-center">
              <p
                className="text-[28px] text-violet-400"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {profile.kpi.totalOpportunities}
              </p>
              <p className="text-[11px] uppercase tracking-[0.5px] text-[#f0ede8]/50">Toplam Fırsat</p>
            </div>
            <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.035] p-4 text-center">
              <p
                className="text-[28px] text-green-400"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {profile.kpi.wonOpportunities}
              </p>
              <p className="text-[11px] uppercase tracking-[0.5px] text-[#f0ede8]/50">Kazanılan</p>
            </div>
            <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.035] p-4 text-center">
              <p
                className="text-[28px] text-amber-400"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                %{profile.kpi.conversionRate}
              </p>
              <p className="text-[11px] uppercase tracking-[0.5px] text-[#f0ede8]/50">Dönüşüm Oranı</p>
            </div>
            <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.035] p-4 text-center">
              <p
                className="text-[28px] text-[#ffb347]"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {profile.kpi.totalBudgetRaw
                  ? `${formatBudget(profile.kpi.totalBudgetRaw)} ${profile.kpi.totalBudgetCurrency ?? ''}`
                  : '-'}
              </p>
              <p className="text-[11px] uppercase tracking-[0.5px] text-[#f0ede8]/50">Toplam Bütçe</p>
            </div>
          </section>

          {profile.pendingOpportunities.length > 0 && (
            <section
              className="fade-up mt-5 rounded-2xl border border-amber-400/[0.2] bg-amber-400/[0.03] backdrop-blur-xl"
              style={{ animationDelay: '120ms' }}
            >
              <div className="flex items-center justify-between border-b border-amber-400/[0.15] px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#f0ede8]/50">
                  Bekleyen Aksiyonlar
                </p>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                  {profile.pendingOpportunities.length}
                </span>
              </div>
              {profile.pendingOpportunities.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-400/[0.08] px-5 py-3 first:border-t-0"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-[#f0ede8]">{item.fairName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-full border border-violet-500/25 bg-violet-500/15 px-2.5 py-0.5 text-violet-300">
                        {getStageLabel(item.currentStage)} Aşamasında
                      </span>
                      <span className={getPendingAgeClass(item.daysSinceLastStageChange)}>
                        🕐 {item.daysSinceLastStageChange} gündür bu aşamada
                      </span>
                      <span className="text-[#f0ede8]/50">
                        {item.budgetRaw
                          ? `${formatBudget(item.budgetRaw)} ${item.budgetCurrency ?? ''}`
                          : 'Bütçe belirtilmemiş'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={{
                      pathname: `/fairs/${item.fairId}`,
                      query: {
                        opportunityId: item.id,
                        customerId: profile.customer.id,
                        company: profile.customer.company,
                      },
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[12px] text-violet-300 transition-colors hover:bg-violet-500/18"
                  >
                    Fırsata Git →
                  </Link>
                </div>
              ))}
            </section>
          )}

          <section
            className="fade-up mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
            style={{ animationDelay: '180ms' }}
          >
            <div className="border-b border-white/[0.08] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#f0ede8]/50">
                Fuar Katılım Geçmişi
              </p>
            </div>
            <div className="space-y-3 p-5">
              {timeline.map((item, index) => {
                const tone = getTimelineTone(item.currentStage);
                const currentYear = new Date(item.fairStartDate).getFullYear();
                const prevYear =
                  index > 0 ? new Date(timeline[index - 1]!.fairStartDate).getFullYear() : null;
                const showYear = currentYear !== prevYear;
                const stageSet = new Set(item.stageLogs.map((log) => log.stage));
                const stageLabel = ORDERED_STAGES.filter((stage) => stageSet.has(stage))
                  .map((stage) => getStageLabel(stage))
                  .join(' · ');
                return (
                  <div key={item.id}>
                    {showYear && (
                      <p className="mb-2 pl-2 text-[11px] font-bold uppercase tracking-[1.5px] text-[#f0ede8]/30">
                        {currentYear}
                      </p>
                    )}
                    <div className={`rounded-xl border p-4 ${tone.card}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[15px] font-semibold text-[#f0ede8]">{item.fairName}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] ${tone.badge}`}>
                          {tone.badgeText}
                        </span>
                      </div>

                      <p className="mt-2 text-[12px] text-[#f0ede8]/60">
                        📅 {formatDateRange(item.fairStartDate, item.fairEndDate)} · 💰{' '}
                        <span className="text-[#ffb347]">
                          {item.budgetRaw
                            ? `${formatBudget(item.budgetRaw)} ${item.budgetCurrency ?? ''}`
                            : '-'}
                        </span>{' '}
                        · 📦{' '}
                        {item.opportunityProducts.length > 0
                          ? item.opportunityProducts
                              .map((product) =>
                                product.quantity
                                  ? `${product.product.name} (${product.quantity} ${product.unit})`
                                  : product.product.name,
                              )
                              .join(', ')
                          : '-'}
                      </p>

                      <div className="mt-3">
                        <div className="flex items-center">
                          {ORDERED_STAGES.map((stage, stageIndex) => {
                            const isPassed = stageSet.has(stage);
                            const isCurrent = item.currentStage === stage;
                            const isWonTerminal =
                              stageIndex === ORDERED_STAGES.length - 1 &&
                              item.currentStage === 'satisa_donustu';
                            const isLostTerminal =
                              stageIndex === ORDERED_STAGES.length - 1 &&
                              item.currentStage === 'olumsuz';
                            const dotColor = isWonTerminal
                              ? '#4ade80'
                              : isLostTerminal
                                ? '#f87171'
                                : isPassed || isCurrent
                                  ? '#8b5cf6'
                                  : 'rgba(240,237,232,0.22)';
                            return (
                              <div key={stage} className="flex items-center">
                                <span
                                  className="inline-flex h-[7px] w-[7px] rounded-full"
                                  style={{
                                    backgroundColor: dotColor,
                                    boxShadow: isCurrent ? '0 0 5px rgba(139,92,246,0.7)' : 'none',
                                  }}
                                />
                                {stageIndex < ORDERED_STAGES.length - 1 && (
                                  <span className="mx-[7px] inline-flex h-px w-[22px] bg-white/[0.12]" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[11px] text-[#f0ede8]/50">{stageLabel || '-'}</p>
                      </div>

                      {item.notes[0] && (
                        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-[13px] italic text-[#f0ede8]/55">
                          💬 "{item.notes[0].content}"
                        </p>
                      )}

                      <div className="mt-3 flex justify-end">
                        <Link
                          href={{
                            pathname: `/fairs/${item.fairId}`,
                            query: {
                              opportunityId: item.id,
                              customerId: profile.customer.id,
                              company: profile.customer.company,
                            },
                          }}
                          className="text-[12px] font-medium text-violet-300 hover:text-violet-200"
                        >
                          Fırsata Git →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            className="fade-up mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
            style={{ animationDelay: '240ms' }}
          >
            <div className="border-b border-white/[0.08] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#f0ede8]/50">Notlar</p>
            </div>
            <div className="px-5">
              {noteList.map((note) => {
                const isEditing = editingNoteId === note.id;
                const draft = noteDrafts[note.id] ?? note.content;
                return (
                  <div key={note.id} className="border-t border-white/[0.08] py-4 first:border-t-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-[#f0ede8]/50">
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-1">
                        [{note.fairName}]
                      </span>
                      <span>{note.createdBy.name}</span>
                      <span>·</span>
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={draft}
                        onChange={(event) =>
                          setNoteDrafts((prev) => ({ ...prev, [note.id]: event.target.value }))
                        }
                        className="min-h-[84px] text-[13px]"
                      />
                    ) : (
                      <p className="text-[13px] leading-[1.6] text-[#f0ede8]/80">{note.content}</p>
                    )}

                    <div className="mt-3 flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="h-7 rounded-[7px] border border-white/[0.08] bg-white/[0.04] px-2.5 text-[12px] text-[#f0ede8]/60"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(note.opportunityId, note.id)}
                            disabled={updateNote.isPending}
                            className="h-7 rounded-[7px] border border-violet-500/35 bg-violet-500/15 px-2.5 text-[12px] text-violet-300"
                          >
                            Kaydet
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setNoteDrafts((prev) => ({ ...prev, [note.id]: note.content }));
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.04] text-[12px] text-[#f0ede8]/65"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.opportunityId, note.id)}
                            disabled={deleteNote.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.04] text-[12px] text-[#f0ede8]/65 transition-colors hover:border-red-400/25 hover:bg-red-400/12 hover:text-red-400"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="my-4 w-full rounded-xl border border-dashed border-violet-500/25 bg-violet-500/8 px-4 py-3 text-sm text-violet-300/80 transition-colors hover:bg-violet-500/14 hover:text-violet-300"
              >
                + Not Ekle
              </button>
            </div>
          </section>
        </ContentWrapper>
      </div>

      <CustomerEditModal
        open={editCustomerOpen}
        onClose={() => setEditCustomerOpen(false)}
        initial={profile.customer}
      />
      <ConfirmDialog
        open={deleteCustomerOpen}
        onClose={() => {
          setDeleteCustomerOpen(false);
          setDeleteCustomerError('');
        }}
        onConfirm={handleConfirmDeleteCustomer}
        title="Müşteriyi Sil"
        message={`"${profile.customer.company}" müşterisini ve ilişkili tüm fırsat verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        loading={deleteCustomer.isPending}
        error={deleteCustomerError || undefined}
      />

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-up {
          opacity: 0;
          animation: fadeUp 360ms ease forwards;
        }
      `}</style>
    </div>
  );
}
