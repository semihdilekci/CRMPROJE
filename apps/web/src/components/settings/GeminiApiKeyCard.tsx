'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  useClearGeminiSecret,
  useGeminiSecret,
  useSetGeminiSecret,
} from '@/hooks/use-gemini-secret';

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

function sourceLabel(source: 'database' | 'environment' | 'none'): string {
  switch (source) {
    case 'database':
      return 'Veritabanı (panelden yönetiliyor)';
    case 'environment':
      return '.env dosyasından okunuyor';
    default:
      return 'Yapılandırılmamış';
  }
}

function preventCopy(e: React.ClipboardEvent) {
  e.preventDefault();
}

export function GeminiApiKeyCard() {
  const { data: secret, isLoading } = useGeminiSecret();
  const setSecret = useSetGeminiSecret();
  const clearSecret = useClearGeminiSecret();

  const [editOpen, setEditOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!editOpen && !clearOpen) {
      setApiKey('');
      setCurrentPassword('');
      setSubmitError('');
    }
  }, [editOpen, clearOpen]);

  const handleSave = async () => {
    setSubmitError('');
    try {
      await setSecret.mutateAsync({ value: apiKey, currentPassword });
      setEditOpen(false);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt sırasında bir hata oluştu.';
      setSubmitError(msg);
    }
  };

  const handleClear = async () => {
    setSubmitError('');
    try {
      await clearSecret.mutateAsync({ currentPassword });
      setClearOpen(false);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Silme sırasında bir hata oluştu.';
      setSubmitError(msg);
    }
  };

  return (
    <>
      <div className="mt-6 rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10 p-6">
        <h2 className="text-lg font-semibold text-white">Gemini API Anahtarı</h2>
        <p className="mt-2 text-[14px] text-white/60">
          AI analiz (Gemini) için kullanılan API anahtarı. Anahtar şifreli olarak veritabanında
          saklanır; ekranda yalnızca maskelenmiş önizleme gösterilir ve kopyalanamaz.
        </p>

        {isLoading ? (
          <p className="mt-6 text-white/60">Yükleniyor...</p>
        ) : secret ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium ${
                  secret.isConfigured
                    ? 'border border-emerald-500/25 bg-emerald-500/15 text-emerald-400'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {secret.isConfigured ? 'Yapılandırıldı' : 'Yapılandırılmamış'}
              </span>
              <span className="text-[13px] text-white/50">{sourceLabel(secret.source)}</span>
            </div>

            {secret.maskedPreview && (
              <div
                className="select-none rounded-lg border border-white/15 bg-black/20 px-4 py-3 font-mono text-[14px] tracking-wider text-white/80"
                onCopy={preventCopy}
                onCut={preventCopy}
                aria-label="Maskelenmiş API anahtarı"
                role="text"
              >
                {secret.maskedPreview}
              </div>
            )}

            {secret.updatedAt && (
              <p className="text-[13px] text-white/50">
                Son güncelleme: {formatDate(secret.updatedAt)}
                {secret.updatedByEmail ? ` — ${secret.updatedByEmail}` : ''}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                {secret.source === 'database' ? 'Anahtarı Değiştir' : 'Anahtarı Kaydet'}
              </Button>
              {secret.source === 'database' && (
                <Button variant="secondary" onClick={() => setClearOpen(true)}>
                  Veritabanından Sil
                </Button>
              )}
            </div>

            <p className="text-[13px] text-white/45">
              Kaydetmek için sunucuda <code className="text-violet-300">SECRETS_ENCRYPTION_KEY</code>{' '}
              tanımlı olmalıdır (<code className="text-violet-300">openssl rand -base64 32</code>).
              .env&apos;deki anahtar yedek olarak kullanılır; panelden kaydettikten sonra .env
              satırını kaldırabilirsiniz.
            </p>
          </div>
        ) : null}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Gemini API Anahtarı">
        <div className="flex flex-col gap-4">
          {submitError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
              {submitError}
            </p>
          )}
          <Input
            label="Yeni API Anahtarı"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Input
            label="Admin Parolası (doğrulama)"
            type="password"
            autoComplete="current-password"
            placeholder="Parolanız"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="mt-2 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setEditOpen(false)}
              disabled={setSecret.isPending}
            >
              İptal
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={setSecret.isPending || !apiKey.trim() || !currentPassword}
            >
              {setSecret.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Gemini API Anahtarını Sil"
      >
        <div className="flex flex-col gap-4">
          {submitError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
              {submitError}
            </p>
          )}
          <p className="text-[14px] text-white/70">
            Veritabanındaki anahtar silinir. .env dosyasında tanımlı bir anahtar varsa o kullanılmaya
            devam eder; yoksa AI analiz devre dışı kalır.
          </p>
          <Input
            label="Admin Parolası (doğrulama)"
            type="password"
            autoComplete="current-password"
            placeholder="Parolanız"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="mt-2 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setClearOpen(false)}
              disabled={clearSecret.isPending}
            >
              İptal
            </Button>
            <Button
              className="flex-1"
              onClick={handleClear}
              disabled={clearSecret.isPending || !currentPassword}
            >
              {clearSecret.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
