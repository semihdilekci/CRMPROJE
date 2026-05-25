import { create } from 'zustand';
import type { Customer } from '@crm/shared';

export interface PivotContactData {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  cardImage: string | null;
}

interface CustomerFormState {
  visible: boolean;
  fairId: string | null;
  onCreated: ((customer: Customer) => void) | null;
  onCloseCallback: (() => void) | null;
  createdSuccessfully: boolean;
  pivotContact: PivotContactData | null;
  open: (
    fairId: string,
    onCreated?: (customer: Customer) => void,
    onCloseCallback?: () => void,
  ) => void;
  close: () => void;
  markCreatedSuccessfully: () => void;
  setPivotContact: (data: PivotContactData) => void;
  clearPivotContact: () => void;
}

export const useCustomerFormStore = create<CustomerFormState>((set, get) => ({
  visible: false,
  fairId: null,
  onCreated: null,
  onCloseCallback: null,
  createdSuccessfully: false,
  pivotContact: null,
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
    set({
      visible: false,
      fairId: null,
      onCreated: null,
      onCloseCallback: null,
      createdSuccessfully: false,
    });
    if (!createdSuccessfully) onCloseCallback?.();
  },
  markCreatedSuccessfully: () => set({ createdSuccessfully: true }),
  setPivotContact: (data) => set({ pivotContact: data }),
  clearPivotContact: () => set({ pivotContact: null }),
}));
