'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Modal üstüne modal açıldığında true — portal ile body'e render, güçlü blur */
  elevated?: boolean;
  /** Arka plan blur'unu %10 artırır (backdrop-blur-sm → 4.4px) */
  strongerBlur?: boolean;
}

const modalContent = (
  onClose: () => void,
  title: string,
  children: ReactNode,
  elevated: boolean,
  strongerBlur: boolean,
) => (
  <div
    className={`fixed inset-0 flex items-center justify-center ${
      elevated
        ? 'z-[70] backdrop-blur-2xl bg-black/75'
        : strongerBlur
          ? 'z-50 backdrop-blur-[4.4px] bg-black/60'
          : 'z-50 backdrop-blur-sm bg-black/60'
    }`}
    onClick={onClose}
  >
    <div
      className="mx-4 w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/20 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="mb-5 text-xl font-semibold text-white">{title}</h2>
      {children}
    </div>
  </div>
);

export function Modal({
  open,
  onClose,
  title,
  children,
  elevated,
  strongerBlur = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = modalContent(
    onClose,
    title,
    children,
    elevated ?? false,
    strongerBlur,
  );

  if (elevated && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
