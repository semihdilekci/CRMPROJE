import { create } from 'zustand';
import type { Fair } from '@crm/shared';

interface FairFormState {
  visible: boolean;
  editingFair: Fair | null;
  open: () => void;
  close: () => void;
  openEdit: (fair: Fair) => void;
}

export const useFairFormStore = create<FairFormState>((set) => ({
  visible: false,
  editingFair: null,

  open: () => set({ visible: true, editingFair: null }),
  close: () => set({ visible: false, editingFair: null }),
  openEdit: (fair) => set({ visible: true, editingFair: fair }),
}));
