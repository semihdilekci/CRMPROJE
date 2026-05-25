'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { PermissionMatrix } from '@/components/permission/PermissionMatrix';
import { ReporterReportDrawer } from '@/components/permission/ReporterReportDrawer';
import { useUsers } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';
import {
  useUserPermissions,
  useTeamPermissions,
  useUpdateUserPermissions,
  useUpdateTeamPermissions,
  useReporterReportAccess,
  useUpdateReporterReports,
} from '@/hooks/use-permissions';
import type { Permission, ReporterType } from '@crm/shared';

type SubjectType = 'user' | 'team';

interface ReportEntry {
  reporterType: ReporterType;
  reportSlug: string;
  enabled: boolean;
}

function usePermissionSaveToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, showToast: setToast };
}

export default function AuthorizationPage() {
  const [subjectType, setSubjectType] = useState<SubjectType>('user');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [localPermissions, setLocalPermissions] = useState<Permission[]>([]);
  const [reportEntries, setReportEntries] = useState<ReportEntry[]>([]);
  const [hasPermChanges, setHasPermChanges] = useState(false);

  const { toast, showToast } = usePermissionSaveToast();

  const { data: users } = useUsers(undefined, 'user');
  const { data: allUsers } = useUsers();
  const { data: teams } = useTeams();

  const selectedUser =
    subjectType === 'user' ? allUsers?.find((u) => u.id === selectedUserId) : null;
  const isSelectedUserAdmin = selectedUser?.role === 'admin';

  const { data: userPerms } = useUserPermissions(
    subjectType === 'user' ? selectedUserId : '',
  );
  const { data: teamPerms } = useTeamPermissions(
    subjectType === 'team' ? selectedTeamId : '',
  );
  const { data: reporterData } = useReporterReportAccess();

  const updateUserPerms = useUpdateUserPermissions();
  const updateTeamPerms = useUpdateTeamPermissions();
  const updateReporterReports = useUpdateReporterReports();

  const currentSubjectId = subjectType === 'user' ? selectedUserId : selectedTeamId;

  useEffect(() => {
    if (subjectType === 'user' && userPerms) {
      setLocalPermissions(userPerms.permissions);
      setHasPermChanges(false);
    }
  }, [subjectType, userPerms, selectedUserId]);

  useEffect(() => {
    if (subjectType === 'team' && teamPerms) {
      setLocalPermissions(teamPerms.permissions);
      setHasPermChanges(false);
    }
  }, [subjectType, teamPerms, selectedTeamId]);

  useEffect(() => {
    if (reporterData) {
      setReportEntries(reporterData);
    }
  }, [reporterData]);

  useEffect(() => {
    setLocalPermissions([]);
    setHasPermChanges(false);
  }, [subjectType]);

  const handlePermChange = (perms: Permission[]) => {
    setLocalPermissions(perms);
    setHasPermChanges(true);
  };

  const handleSavePermissions = async () => {
    if (!currentSubjectId) return;

    try {
      if (subjectType === 'user') {
        await updateUserPerms.mutateAsync({
          userId: selectedUserId,
          dto: { permissions: localPermissions },
        });
      } else {
        await updateTeamPerms.mutateAsync({
          teamId: selectedTeamId,
          dto: { permissions: localPermissions },
        });
      }
      setHasPermChanges(false);
      showToast({ message: 'Yetkiler başarıyla kaydedildi', type: 'success' });
    } catch {
      showToast({ message: 'Yetkiler kaydedilemedi', type: 'error' });
    }
  };

  const handleSaveReporterReports = async () => {
    try {
      await updateReporterReports.mutateAsync({ entries: reportEntries });
      showToast({ message: 'Rapor ayarları başarıyla kaydedildi', type: 'success' });
    } catch {
      showToast({ message: 'Rapor ayarları kaydedilemedi', type: 'error' });
    }
  };

  const isSavingPerms = updateUserPerms.isPending || updateTeamPerms.isPending;

  const showPermissionPanel =
    (subjectType === 'user' && !!selectedUserId) ||
    (subjectType === 'team' && !!selectedTeamId);

  return (
    <div className="min-h-screen">
      <TopBar breadcrumb="Yönetim › Yetkilendirme" />
      <ContentWrapper>
        <div
          className="mb-6"
          style={{
            opacity: 0,
            animation: 'fadeUp 0.4s ease 0.1s forwards',
          }}
        >
          <h1 className="text-2xl font-semibold text-white">Yetkilendirme</h1>
          <p className="mt-1 text-[13px] text-white/45">
            Kullanıcı veya ekip bazlı yetki atayın. Admin kullanıcıların yetkileri değiştirilemez.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Segmented control: Kullanıcı / Ekip */}
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
            style={{
              opacity: 0,
              animation: 'fadeUp 0.4s ease 0.15s forwards',
            }}
          >
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSubjectType('user')}
                className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                  subjectType === 'user'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-white/50 hover:text-white/70 border border-transparent'
                }`}
              >
                Kullanıcı
              </button>
              <button
                type="button"
                onClick={() => setSubjectType('team')}
                className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                  subjectType === 'team'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-white/50 hover:text-white/70 border border-transparent'
                }`}
              >
                Ekip
              </button>
            </div>

            {subjectType === 'user' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-white/60">
                  Kullanıcı Seç
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-[14px] text-white backdrop-blur-sm focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30"
                >
                  <option value="">-- Kullanıcı seçin --</option>
                  {allUsers?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                      {user.role === 'admin' ? ' — Admin' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-white/60">
                  Ekip Seç
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-[14px] text-white backdrop-blur-sm focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30"
                >
                  <option value="">-- Ekip seçin --</option>
                  {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Yetki listesi */}
          {showPermissionPanel && (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
              style={{
                opacity: 0,
                animation: 'fadeUp 0.4s ease 0.2s forwards',
              }}
            >
              <h2 className="mb-4 text-[15px] font-semibold text-white/90">
                {subjectType === 'user'
                  ? `Kullanıcı Yetkileri — ${selectedUser?.name ?? ''}`
                  : `Ekip Yetkileri — ${teams?.find((t) => t.id === selectedTeamId)?.name ?? ''}`}
              </h2>

              <PermissionMatrix
                selectedPermissions={localPermissions}
                onChange={handlePermChange}
                isAdmin={isSelectedUserAdmin}
                disabled={isSavingPerms}
              />

              {!isSelectedUserAdmin && (
                <div className="mt-5 flex items-center justify-between">
                  {hasPermChanges && (
                    <p className="text-[12px] text-amber-400/80">Kaydedilmemiş değişiklikler var</p>
                  )}
                  <div className="ml-auto">
                    <Button
                      onClick={handleSavePermissions}
                      disabled={isSavingPerms || !hasPermChanges}
                    >
                      {isSavingPerms ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rapor görünürlük drawer */}
          <div
            style={{
              opacity: 0,
              animation: 'fadeUp 0.4s ease 0.25s forwards',
            }}
          >
            <ReporterReportDrawer
              entries={reportEntries}
              onChange={setReportEntries}
              onSave={handleSaveReporterReports}
              isSaving={updateReporterReports.isPending}
            />
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-lg backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}
          >
            {toast.message}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
}
