import { create } from 'zustand';
import type { OpportunityWithDetails } from '@crm/shared';

interface StageTransitionState {
  visible: boolean;
  opportunity: OpportunityWithDetails | null;
  fairId: string | null;
  open: (opportunity: OpportunityWithDetails, fairId: string) => void;
  close: () => void;
}

export const useStageTransitionStore = create<StageTransitionState>((set) => ({
  visible: false,
  opportunity: null,
  fairId: null,
  open: (opportunity, fairId) =>
    set({ visible: true, opportunity, fairId }),
  close: () => set({ visible: false, opportunity: null, fairId: null }),
}));
