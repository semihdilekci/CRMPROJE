'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { useSettings, useResetTeklifTemplate } from '@/hooks/use-settings';
import { SettingFormModal } from '@/components/settings/SettingFormModal';
import { AmbientBackgroundSettingsCard } from '@/components/settings/AmbientBackgroundSettingsCard';
import type { SystemSetting } from '@crm/shared';
import api from '@/lib/api';

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

const TEKLIF_PLACEHOLDERS = [
  '{{customer_name}}',
  '{{customer_company}}',
  '{{customer_address}}',
  '{{customer_phone}}',
  '{{customer_email}}',
  '{{product_list}}',
  '{{total_amount}}',
  '{{total_currency}}',
];

export default function AdminSettingsPage() {
  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const { data: settings, isLoading } = useSettings();
  const resetTemplate = useResetTeklifTemplate();

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const { data } = await api.get<Blob>('/upload/teklif-template/default', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'default-teklif-template.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Hata toast gösterilebilir
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar breadcrumb="Yönetim › Sistem Ayarları" />
      <ContentWrapper>
        <h1 className="text-2xl font-semibold text-white">Sistem Ayarları</h1>
        <p className="mt-2 text-[14px] text-white/60">
          Varsayılan para birimi ve sözlük değerleri (dönüşüm oranı etiketleri) bu sayfadan
          düzenlenir.
        </p>

        <div className="mt-8 rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">Teklif Template</h2>
          <p className="mt-2 text-[14px] text-white/60">
            Teklif dokümanları oluşturulurken kullanılan Word (.docx) template. Template içinde
            aşağıdaki placeholder&apos;lar otomatik doldurulur.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TEKLIF_PLACEHOLDERS.map((p) => (
              <code
                key={p}
                className="rounded bg-white/10 px-2 py-1 text-[12px] text-violet-300"
              >
                {p}
              </code>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
              >
                {downloadingTemplate ? 'İndiriliyor...' : 'Varsayılan Template İndir'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => resetTemplate.mutate()}
                disabled={resetTemplate.isPending}
              >
                {resetTemplate.isPending ? 'Sıfırlanıyor...' : 'Varsayılana Dön'}
              </Button>
            </div>
            <p className="text-[13px] text-white/50">
              Eski veya yanlış template kullanılıyorsa &quot;Varsayılana Dön&quot; ile güncel template
              etkinleştirilir. Dosya: apps/api/assets/teklif-templates/default-teklif-template.docx
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-white/60">Yükleniyor...</p>
        ) : settings && settings.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10">
            <table className="w-full min-w-[500px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-white/20 backdrop-blur-xl bg-white/5">
                  <th className="px-4 py-3 font-semibold text-white">Anahtar</th>
                  <th className="px-4 py-3 font-semibold text-white">Değer</th>
                  <th className="px-4 py-3 font-semibold text-white">Açıklama</th>
                  <th className="px-4 py-3 font-semibold text-white">Son güncelleme</th>
                  <th className="px-4 py-3 font-semibold text-white">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[13px] text-white">{s.key}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-white">{s.value}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-white/60">
                      {s.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-white/60">{formatDate(s.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        className="text-[13px] text-violet-400 hover:underline"
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
          <div className="mt-6 rounded-xl border border-dashed border-white/20 py-16 text-center">
            <p className="text-white/60">Henüz ayar yok. Varsayılan ayarlar ilk erişimde oluşturulur.</p>
          </div>
        )}

        <AmbientBackgroundSettingsCard />
      </ContentWrapper>

      <SettingFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        setting={editing}
      />
    </div>
  );
}
