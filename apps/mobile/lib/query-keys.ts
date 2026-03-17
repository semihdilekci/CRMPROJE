export const queryKeys = {
  fairs: {
    all: ['fairs'] as const,
    byId: (id: string) => [...queryKeys.fairs.all, id] as const,
    pipelineStats: (fairId: string) => ['fairs', fairId, 'pipeline-stats'] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    byFair: (fairId: string) => [...queryKeys.opportunities.all, fairId] as const,
    byFairFiltered: (
      fairId: string,
      search?: string,
      rate?: string,
      currentStage?: string
    ) =>
      [...queryKeys.opportunities.all, 'fair', fairId, { search, rate, currentStage }] as const,
    stageHistory: (opportunityId: string) =>
      [...queryKeys.opportunities.all, opportunityId, 'stages'] as const,
    hasOffer: (opportunityId: string) =>
      [...queryKeys.opportunities.all, opportunityId, 'has-offer'] as const,
    notes: (opportunityId: string) =>
      [...queryKeys.opportunities.all, opportunityId, 'notes'] as const,
  },
  customers: {
    all: ['customers'] as const,
    byFair: (fairId: string) => [...queryKeys.customers.all, fairId] as const,
  },
} as const;
