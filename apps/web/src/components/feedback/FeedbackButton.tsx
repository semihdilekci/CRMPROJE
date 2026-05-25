'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedbackCategory } from '@crm/shared';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useSubmitFeedback } from '@/hooks/use-feedback';
import { IdeaButton } from '@/components/feedback/IdeaButton';

const CATEGORY_OPTIONS: { type: FeedbackCategory; label: string; icon: 'bulb' | 'bug' | 'help' }[] = [
  { type: 'idea', label: 'Yeni fikir / öneri', icon: 'bulb' },
  { type: 'bug', label: 'Hata bildir', icon: 'bug' },
  { type: 'question', label: 'Soru sor', icon: 'help' },
];

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  idea: 'Yeni fikir / öneri',
  bug: 'Hata bildirimi',
  question: 'Soru',
};

function FeedbackIcon({ name, className }: { name: 'bulb' | 'bug' | 'help'; className?: string }) {
  const common = { className: cn('h-4 w-4', className), fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  if (name === 'bulb') {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z" />
      </svg>
    );
  }
  if (name === 'bug') {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M8 2v2" />
        <path d="M16 2v2" />
        <path d="M12 6v2" />
        <path d="M4 10h16" />
        <path d="M6 14h.01" />
        <path d="M10 14h.01" />
        <path d="M14 14h.01" />
        <path d="M18 14h.01" />
        <path d="M7 18h10" />
        <path d="M8 22h8" />
        <path d="M12 6c-3 0-5 2-5 6v2h10v-2c0-4-2-6-5-6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'compose'>('menu');
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const ideaButtonRef = useRef<HTMLButtonElement>(null);
  const submit = useSubmitFeedback();

  const reset = useCallback(() => {
    setStep('menu');
    setCategory(null);
    setMessage('');
    setFieldError(null);
    setSuccess(false);
    submit.reset();
  }, [submit]);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const toggle = useCallback(() => {
    setOpen((o) => {
      if (o) reset();
      return !o;
    });
  }, [reset]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || ideaButtonRef.current?.contains(target)) {
        return;
      }
      close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, close]);

  const handleSelectCategory = (type: FeedbackCategory) => {
    setCategory(type);
    setStep('compose');
    setFieldError(null);
  };

  const handleSubmit = async () => {
    if (!category) return;
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setFieldError('Mesaj en az 10 karakter olmalıdır');
      return;
    }
    setFieldError(null);
    try {
      await submit.mutateAsync({ category, message: trimmed });
      setSuccess(true);
      window.setTimeout(() => close(), 1800);
    } catch (err: unknown) {
      const apiMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Geri bildirim gönderilemedi. Lütfen tekrar deneyin.';
      setFieldError(apiMessage);
    }
  };

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="pointer-events-auto fixed bottom-44 right-6 z-[90] w-[min(300px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-2xl md:bottom-36 md:right-8"
          role="dialog"
          aria-label="Geri bildirim"
        >
          {success ? (
            <p className="py-6 text-center text-[14px] text-green-400">
              Teşekkürler! Geri bildiriminiz alındı.
            </p>
          ) : step === 'menu' ? (
            <>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
                    <FeedbackIcon name="bulb" className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="text-[14px] font-medium text-white">Öneride bulun</span>
                </div>
                <p className="mt-2 text-left text-[12px] leading-snug text-white/55">
                  Fikrini, talebini ya da karşılaştığın bir sorunu paylaş.
                </p>
              </div>
              {CATEGORY_OPTIONS.map((opt, i) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelectCategory(opt.type)}
                  className={cn(
                    'mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors',
                    i === 0
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-200'
                      : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <FeedbackIcon name={opt.icon} className="shrink-0 opacity-80" />
                  {opt.label}
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[13px] text-white/70">
                  <span className="text-white/40">Kategori: </span>
                  {category ? CATEGORY_LABEL[category] : ''}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('menu');
                    setCategory(null);
                    setMessage('');
                    setFieldError(null);
                  }}
                  className="cursor-pointer text-[12px] text-violet-400 hover:text-violet-300"
                >
                  Geri
                </button>
              </div>
              <Textarea
                label="Mesajınız"
                placeholder="Detayları yazın…"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                rows={5}
                error={fieldError ?? undefined}
                maxLength={5000}
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={close}>
                  İptal
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={submit.isPending}>
                  {submit.isPending ? 'Gönderiliyor…' : 'Gönder'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <IdeaButton ref={ideaButtonRef} onClick={toggle} aria-expanded={open} />
    </>
  );
}
