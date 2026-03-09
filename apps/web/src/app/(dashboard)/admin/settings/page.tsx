'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/hooks/use-settings';
import { SettingFormModal } from '@/components/settings/SettingFormModal';
import type { SystemSetting } from '@crm/shared';

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

export default function AdminSettingsPage() {
  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const { data: settings, isLoading } = useSettings();

  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Sistem Ayarları" />
      <ContentWrapper>
        <h1 className="font-serif text-[22px] font-semibold text-text">Sistem Ayarları</h1>
        <p className="mt-2 text-[14px] text-muted">
          Varsayılan para birimi ve sözlük değerleri (dönüşüm oranı etiketleri) bu sayfadan
          düzenlenir.
        </p>

        {isLoading ? (
          <p className="mt-6 text-muted">Yükleniyor...</p>
        ) : settings && settings.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[500px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 font-semibold text-text">Anahtar</th>
                  <th className="px-4 py-3 font-semibold text-text">Değer</th>
                  <th className="px-4 py-3 font-semibold text-text">Açıklama</th>
                  <th className="px-4 py-3 font-semibold text-text">Son güncelleme</th>
                  <th className="px-4 py-3 font-semibold text-text">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key} className="border-b border-border/70 hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono text-[13px] text-text">{s.key}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-text">{s.value}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">
                      {s.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(s.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        className="text-[13px] text-accent hover:underline"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted">Henüz ayar yok. Varsayılan ayarlar ilk erişimde oluşturulur.</p>
          </div>
        )}
      </ContentWrapper>

      <SettingFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        setting={editing}
      />
    </div>
  );
}
