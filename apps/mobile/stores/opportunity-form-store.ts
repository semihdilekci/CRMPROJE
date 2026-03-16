import { create } from 'zustand';

interface OpportunityFormState {
  visible: boolean;
  fairId: string | null;
  open: (fairId: string) => void;
  close: () => void;
}

export const useOpportunityFormStore = create<OpportunityFormState>((set) => ({
  visible: false,
  fairId: null,
  open: (fairId) => set({ visible: true, fairId }),
  close: () => set({ visible: false, fairId: null }),
}));
