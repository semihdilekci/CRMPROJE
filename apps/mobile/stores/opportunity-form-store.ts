import { create } from 'zustand';
import type { OpportunityWithDetails, Customer } from '@crm/shared';

interface OpportunityFormState {
  visible: boolean;
  fairId: string | null;
  editingOpportunity: OpportunityWithDetails | null;
  preselectedCustomer: Customer | null;
  open: (fairId: string, opportunity?: OpportunityWithDetails, preselectedCustomer?: Customer) => void;
  close: () => void;
  clearPreselectedCustomer: () => void;
}

export const useOpportunityFormStore = create<OpportunityFormState>((set) => ({
  visible: false,
  fairId: null,
  editingOpportunity: null,
  preselectedCustomer: null,
  open: (fairId, opportunity, preselectedCustomer) =>
    set({
      visible: true,
      fairId,
      editingOpportunity: opportunity ?? null,
      preselectedCustomer: preselectedCustomer ?? null,
    }),
  close: () =>
    set({ visible: false, fairId: null, editingOpportunity: null, preselectedCustomer: null }),
  clearPreselectedCustomer: () => set({ preselectedCustomer: null }),
}));
