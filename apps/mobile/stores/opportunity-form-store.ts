import { create } from 'zustand';
import type { OpportunityWithDetails, CustomerContact } from '@crm/shared';
import type { ActiveCustomerRef } from '@/stores/active-view-store';

interface OpportunityFormState {
  visible: boolean;
  fairId: string | null;
  editingOpportunity: OpportunityWithDetails | null;
  preselectedCustomer: ActiveCustomerRef | null;
  preselectedContact: CustomerContact | null;
  open: (
    fairId?: string | null,
    opportunity?: OpportunityWithDetails,
    preselectedCustomer?: ActiveCustomerRef,
    preselectedContact?: CustomerContact | null,
  ) => void;
  close: () => void;
  clearPreselection: () => void;
}

export const useOpportunityFormStore = create<OpportunityFormState>((set) => ({
  visible: false,
  fairId: null,
  editingOpportunity: null,
  preselectedCustomer: null,
  preselectedContact: null,
  open: (fairId = null, opportunity, preselectedCustomer, preselectedContact = null) =>
    set({
      visible: true,
      fairId: fairId ?? null,
      editingOpportunity: opportunity ?? null,
      preselectedCustomer: preselectedCustomer ?? null,
      preselectedContact: preselectedContact ?? null,
    }),
  close: () =>
    set({
      visible: false,
      fairId: null,
      editingOpportunity: null,
      preselectedCustomer: null,
      preselectedContact: null,
    }),
  clearPreselection: () =>
    set({ preselectedCustomer: null, preselectedContact: null }),
}));
