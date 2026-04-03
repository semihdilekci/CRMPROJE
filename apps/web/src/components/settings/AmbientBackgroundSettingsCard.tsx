'use client';

import { useEffect, useState } from 'react';
import {
  AMBIENT_BLOB_CONFIG_KEY,
  DEFAULT_AMBIENT_BLOB_CONFIG,
  type AmbientBlobConfig,
} from '@crm/shared';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { useDisplayConfig } from '@/hooks/use-display-config';
import { useSetSetting } from '@/hooks/use-settings';

function clampConfig(partial: AmbientBlobConfig): AmbientBlobConfig {
  return {
    blobCount: Math.min(10, Math.max(3, Math.round(partial.blobCount))),
    speed: Math.min(2.5, Math.max(0.25, Math.round(partial.speed * 100) / 100)),
    size: Math.min(1.35, Math.max(0.45, Math.round(partial.size * 100) / 100)),
    pulseAmount: Math.min(0.35, Math.max(0, Math.round(partial.pulseAmount * 100) / 100)),
  };
}

export function AmbientBackgroundSettingsCard() {
  const { data: displayConfig, isLoading } = useDisplayConfig();
  const setSetting = useSetSetting();
  /** null: sunucu değerini kullan; dolu: kullanıcı düzenlemesi */
  const [draftOverride, setDraftOverride] = useState<AmbientBlobConfig | null>(null);
  const [savedHint, setSavedHint] = useState(false);

  const serverBlobs = clampConfig(displayConfig?.ambientBlobs ?? DEFAULT_AMBIENT_BLOB_CONFIG);
  const draft = draftOverride ?? serverBlobs;

  useEffect(() => {
    if (!savedHint) return;
    const t = window.setTimeout(() => setSavedHint(false), 2500);
    return () => window.clearTimeout(t);
  }, [savedHint]);

  const handleSave = () => {
    const payload = clampConfig(draft);
    setSetting.mutate(
      {
        key: AMBIENT_BLOB_CONFIG_KEY,
        value: JSON.stringify(payload),
        description:
          'Web arka plan blob ayarları (JSON: blobCount, speed, size, pulseAmount)',
      },
      {
        onSuccess: () => {
          setDraftOverride(null);
          setSavedHint(true);
        },
      },
    );
  };

  const dirty = JSON.stringify(clampConfig(draft)) !== JSON.stringify(serverBlobs);

  return (
    <div className="mt-6 rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10 p-6">
      <h2 className="text-lg font-semibold text-white">Arkaplan Ayarları</h2>
      <p className="mt-2 text-[14px] text-white/60">
        Giriş yapmış tüm kullanıcılar için ortak hareketli arka plan blob’ları. Değişiklikleri
        kaydettikten sonra birkaç saniye içinde panel genelinde uygulanır.
      </p>

      {isLoading ? (
        <p className="mt-6 text-white/60">Yükleniyor...</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-white">Blob sayısı</span>
              <span className="text-[13px] tabular-nums text-white/70">{draft.blobCount}</span>
            </div>
            <Slider
              className="mt-2"
              min={3}
              max={10}
              step={1}
              value={[draft.blobCount]}
              onValueChange={(v) => {
                const n = v[0] ?? 3;
                setDraftOverride({ ...draft, blobCount: n });
              }}
              aria-label="Blob sayısı"
            />
            <p className="mt-1 text-[12px] text-white/45">3 ile 10 arası</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-white">Hareket hızı</span>
              <span className="text-[13px] tabular-nums text-white/70">{draft.speed.toFixed(2)}×</span>
            </div>
            <Slider
              className="mt-2"
              min={0.25}
              max={2.5}
              step={0.05}
              value={[draft.speed]}
              onValueChange={(v) => {
                const s = v[0] ?? 1;
                setDraftOverride({ ...draft, speed: s });
              }}
              aria-label="Blob hareket hızı"
            />
            <p className="mt-1 text-[12px] text-white/45">Düşük: yavaş, yüksek: hızlı</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-white">Blob büyüklüğü</span>
              <span className="text-[13px] tabular-nums text-white/70">{draft.size.toFixed(2)}×</span>
            </div>
            <Slider
              className="mt-2"
              min={0.45}
              max={1.35}
              step={0.01}
              value={[draft.size]}
              onValueChange={(v) => {
                const s = v[0] ?? 1;
                setDraftOverride({ ...draft, size: s });
              }}
              aria-label="Blob büyüklüğü"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-white">Büyüme–küçülme (nabız)</span>
              <span className="text-[13px] tabular-nums text-white/70">
                {draft.pulseAmount.toFixed(2)}
              </span>
            </div>
            <Slider
              className="mt-2"
              min={0}
              max={0.35}
              step={0.01}
              value={[draft.pulseAmount]}
              onValueChange={(v) => {
                const p = v[0] ?? 0;
                setDraftOverride({ ...draft, pulseAmount: p });
              }}
              aria-label="Blob nabız genliği"
            />
            <p className="mt-1 text-[12px] text-white/45">0: sabit çap; yüksek: daha belirgin nefes alma</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={setSetting.isPending || !dirty}
            >
              {setSetting.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            {savedHint ? (
              <span className="text-[13px] text-green-400">Kaydedildi.</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
