'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TeamFormModal } from '@/components/team/TeamFormModal';
import { useTeams, useDeleteTeam } from '@/hooks/use-teams';
import type { TeamWithUserCount } from '@crm/shared';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function AdminTeamsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithUserCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamWithUserCount | null>(null);

  const { data: teams, isLoading } = useTeams(search.trim() || undefined);
  const deleteTeam = useDeleteTeam();

  const handleEdit = (team: TeamWithUserCount) => {
    setEditingTeam(team);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTeam(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeam(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeam.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error shown in dialog
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Ekipler" />
      <ContentWrapper>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-serif text-[22px] font-semibold text-text">Ekipler</h1>
          <Button onClick={handleAdd}>+ Yeni Ekip</Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Ekip adı ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[280px]"
          />
        </div>

        {isLoading ? (
          <p className="text-muted">Yükleniyor...</p>
        ) : teams && teams.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[600px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 font-semibold text-text">Ekip adı</th>
                  <th className="px-4 py-3 font-semibold text-text">Açıklama</th>
                  <th className="px-4 py-3 font-semibold text-text">Kullanıcı</th>
                  <th className="px-4 py-3 font-semibold text-text">Durum</th>
                  <th className="px-4 py-3 font-semibold text-text">Oluşturulma</th>
                  <th className="px-4 py-3 font-semibold text-text">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-b border-border/70 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-text">{team.name}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                      {team.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-text">{team.userCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                          team.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted/30 text-muted'
                        }`}
                      >
                        {team.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(team.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(team)}
                          className="text-[13px] text-accent hover:underline"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(team)}
                          className="text-[13px] text-danger hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted">
              {search ? 'Arama kriterine uygun ekip yok.' : 'Henüz ekip yok.'}
            </p>
            {!search && (
              <Button onClick={handleAdd} className="mt-4">
                + İlk Ekibi Oluştur
              </Button>
            )}
          </div>
        )}
      </ContentWrapper>

      <TeamFormModal
        open={showModal}
        onClose={handleCloseModal}
        initial={editingTeam ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          deleteTeam.reset();
        }}
        onConfirm={handleDeleteConfirm}
        title="Ekibi sil"
        message={
          deleteTarget
            ? deleteTarget.userCount > 0
              ? `"${deleteTarget.name}" ekibine ${deleteTarget.userCount} kullanıcı bağlı. Önce kullanıcıları başka bir ekibe taşıyın.`
              : `"${deleteTarget.name}" ekibini silmek istediğinize emin misiniz?`
            : ''
        }
        confirmLabel="Sil"
        loading={deleteTeam.isPending}
        error={
          deleteTeam.isError && deleteTeam.error
            ? String(
                (deleteTeam.error as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? 'Silme işlemi başarısız'
              )
            : undefined
        }
      />
    </div>
  );
}
