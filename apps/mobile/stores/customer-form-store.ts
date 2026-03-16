import { create } from 'zustand';

interface CustomerFormState {
  visible: boolean;
  fairId: string | null;
  open: (fairId: string) => void;
  close: () => void;
}

export const useCustomerFormStore = create<CustomerFormState>((set) => ({
  visible: false,
  fairId: null,
  open: (fairId) => set({ visible: true, fairId }),
  close: () => set({ visible: false, fairId: null }),
}));
