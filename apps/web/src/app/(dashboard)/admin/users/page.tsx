'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserFormModal } from '@/components/user/UserFormModal';
import { useUsers, useDeleteUser } from '@/hooks/use-users';
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
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users, isLoading } = useUsers(search.trim() || undefined, roleFilter || undefined);
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
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Kullanıcı Yönetimi" />
      <ContentWrapper>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-serif text-[22px] font-semibold text-text">Kullanıcı Yönetimi</h1>
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
            className="max-w-[160px] rounded-[10px] border border-border bg-surface px-3 py-2.5 text-[14px] text-text focus:border-accent focus:outline-none"
          >
            <option value="">Tüm roller</option>
            <option value="admin">Admin</option>
            <option value="user">Kullanıcı</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-muted">Yükleniyor...</p>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[600px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 font-semibold text-text">Ad Soyad</th>
                  <th className="px-4 py-3 font-semibold text-text">E-posta</th>
                  <th className="px-4 py-3 font-semibold text-text">Rol</th>
                  <th className="px-4 py-3 font-semibold text-text">Oluşturulma</th>
                  <th className="px-4 py-3 font-semibold text-text">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/70 hover:bg-surface/50">
                    <td className="px-4 py-3 text-text">{user.name}</td>
                    <td className="px-4 py-3 text-muted">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                          user.role === 'admin'
                            ? 'bg-accent/20 text-accent'
                            : 'bg-muted/30 text-muted'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="text-[13px] text-accent hover:underline"
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
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted">
              {search || roleFilter
                ? 'Arama kriterlerine uygun kullanıcı yok.'
                : 'Henüz kullanıcı yok.'}
            </p>
            {!search && !roleFilter && (
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
