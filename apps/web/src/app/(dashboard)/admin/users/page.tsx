'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserFormModal } from '@/components/user/UserFormModal';
import { useUsers, useDeleteUser } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';
import type { User } from '@crm/shared';

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

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users, isLoading } = useUsers(
    search.trim() || undefined,
    roleFilter || undefined,
    teamFilter || undefined
  );
  const { data: teams } = useTeams(undefined, true);
  const deleteUser = useDeleteUser();

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error remains in deleteUser.error, shown below dialog
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar breadcrumb="Yönetim › Kullanıcı Yönetimi" />
      <ContentWrapper>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-white">Kullanıcı Yönetimi</h1>
          <Button onClick={handleAdd}>+ Yeni Kullanıcı</Button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="İsim veya e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[280px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="max-w-[160px] rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-[14px] text-white focus:border-violet-400/60 focus:outline-none"
          >
            <option value="">Tüm roller</option>
            <option value="admin">Admin</option>
            <option value="user">Kullanıcı</option>
          </select>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="max-w-[200px] rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-[14px] text-white focus:border-violet-400/60 focus:outline-none"
          >
            <option value="">Tüm ekipler</option>
            {teams?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-white/60">Yükleniyor...</p>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10">
            <table className="w-full min-w-[700px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-white/20 backdrop-blur-xl bg-white/5">
                  <th className="px-4 py-3 font-semibold text-white">Ad Soyad</th>
                  <th className="px-4 py-3 font-semibold text-white">E-posta</th>
                  <th className="px-4 py-3 font-semibold text-white">Rol</th>
                  <th className="px-4 py-3 font-semibold text-white">Ekip</th>
                  <th className="px-4 py-3 font-semibold text-white">Oluşturulma</th>
                  <th className="px-4 py-3 font-semibold text-white">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{user.name}</td>
                    <td className="px-4 py-3 text-white/60">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                          user.role === 'admin'
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{user.teamName || '—'}</td>
                    <td className="px-4 py-3 text-white/60">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="text-[13px] text-violet-400 hover:underline"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
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
          <div className="rounded-xl border border-dashed border-white/20 py-16 text-center">
            <p className="text-white/60">
              {search || roleFilter || teamFilter
                ? 'Arama kriterlerine uygun kullanıcı yok.'
                : 'Henüz kullanıcı yok.'}
            </p>
            {!search && !roleFilter && !teamFilter && (
              <Button onClick={handleAdd} className="mt-4">
                + İlk Kullanıcıyı Ekle
              </Button>
            )}
          </div>
        )}
      </ContentWrapper>

      <UserFormModal
        open={showModal}
        onClose={handleCloseModal}
        initial={editingUser ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          deleteUser.reset();
        }}
        onConfirm={handleDeleteConfirm}
        title="Kullanıcıyı sil"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" (${deleteTarget.email}) kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        confirmLabel="Sil"
        loading={deleteUser.isPending}
        error={
          deleteUser.isError && deleteUser.error
            ? String(
                (deleteUser.error as { response?: { data?: { message?: string } } })?.response?.data
                  ?.message ?? 'Silme işlemi başarısız'
              )
            : undefined
        }
      />
    </div>
  );
}
