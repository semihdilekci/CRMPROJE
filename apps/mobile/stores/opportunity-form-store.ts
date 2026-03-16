import { create } from 'zustand';
import type { OpportunityWithDetails } from '@crm/shared';

interface OpportunityFormState {
  visible: boolean;
  fairId: string | null;
  editingOpportunity: OpportunityWithDetails | null;
  open: (fairId: string, opportunity?: OpportunityWithDetails) => void;
  close: () => void;
}

export const useOpportunityFormStore = create<OpportunityFormState>((set) => ({
  visible: false,
  fairId: null,
  editingOpportunity: null,
  open: (fairId, opportunity) =>
    set({ visible: true, fairId, editingOpportunity: opportunity ?? null }),
  close: () => set({ visible: false, fairId: null, editingOpportunity: null }),
}));
