import { create } from 'zustand';
import type { Customer } from '@crm/shared';

/** Müşteri detay / FAB bağlamı — profil API’sinin döndürdüğü alanlar */
export type ActiveCustomerRef = Pick<Customer, 'id' | 'company' | 'address'>;

interface ActiveViewState {
  activeCustomer: ActiveCustomerRef | null;
  setActiveCustomer: (customer: ActiveCustomerRef | null) => void;
  clearActiveCustomer: () => void;
}

export const useActiveViewStore = create<ActiveViewState>((set) => ({
  activeCustomer: null,
  setActiveCustomer: (customer) => set({ activeCustomer: customer }),
  clearActiveCustomer: () => set({ activeCustomer: null }),
}));
