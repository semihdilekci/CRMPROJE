import { create } from 'zustand';
import type { Customer } from '@crm/shared';

interface CustomerFormState {
  visible: boolean;
  fairId: string | null;
  onCreated: ((customer: Customer) => void) | null;
  onCloseCallback: (() => void) | null;
  createdSuccessfully: boolean;
  open: (
    fairId: string,
    onCreated?: (customer: Customer) => void,
    onCloseCallback?: () => void,
  ) => void;
  close: () => void;
  markCreatedSuccessfully: () => void;
}

export const useCustomerFormStore = create<CustomerFormState>((set, get) => ({
  visible: false,
  fairId: null,
  onCreated: null,
  onCloseCallback: null,
  createdSuccessfully: false,
  open: (fairId, onCreated, onCloseCallback) =>
    set({
      visible: true,
      fairId,
      onCreated: onCreated ?? null,
      onCloseCallback: onCloseCallback ?? null,
      createdSuccessfully: false,
    }),
  close: () => {
    const { onCloseCallback, createdSuccessfully } = get();
    set({ visible: false, fairId: null, onCreated: null, onCloseCallback: null, createdSuccessfully: false });
    if (!createdSuccessfully) onCloseCallback?.();
  },
  markCreatedSuccessfully: () => set({ createdSuccessfully: true }),
}));
