import { create } from 'zustand';
import type { Customer } from '@crm/shared';

interface CustomerFormState {
  visible: boolean;
  fairId: string | null;
  onCreated: ((customer: Customer) => void) | null;
  open: (fairId: string, onCreated?: (customer: Customer) => void) => void;
  close: () => void;
}

export const useCustomerFormStore = create<CustomerFormState>((set) => ({
  visible: false,
  fairId: null,
  onCreated: null,
  open: (fairId, onCreated) =>
    set({ visible: true, fairId, onCreated: onCreated ?? null }),
  close: () => set({ visible: false, fairId: null, onCreated: null }),
}));
