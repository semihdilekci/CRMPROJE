import { create } from 'zustand';

/**
 * Tab + Stack içinde `?opportunityId=` bazen kaybolduğu için müşteri profilinden
 * "Fırsata Git" ile fuar sayfasına giderken hedef fırsat id’sini burada taşıyoruz.
 */
interface FairOpportunityFocusState {
  pending: { fairId: string; opportunityId: string } | null;
  setPending: (fairId: string, opportunityId: string) => void;
  /** fairId eşleşirse id’yi döndürür ve kuyruğu temizler (tek tüketim). */
  consume: (fairId: string) => string | null;
}

export const useFairOpportunityFocusStore = create<FairOpportunityFocusState>((set, get) => ({
  pending: null,
  setPending: (fairId, opportunityId) => set({ pending: { fairId, opportunityId } }),
  consume: (fairId) => {
    const p = get().pending;
    if (p && p.fairId === fairId) {
      set({ pending: null });
      return p.opportunityId;
    }
    return null;
  },
}));
