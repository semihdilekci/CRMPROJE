'use client';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Sil',
  loading = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-muted">{message}</p>
      {error && (
        <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? 'Siliniyor...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
