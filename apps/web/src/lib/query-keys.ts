export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (filters?: { search?: string; role?: string; teamId?: string }) =>
      ['users', 'list', filters ?? {}] as const,
    byId: (id: string) => ['users', id] as const,
  },
  chat: {
    query: () => ['chat', 'query'] as const,
    export: (exportId: string) => ['chat', 'export', exportId] as const,
  },
  fairs: {
    all: ['fairs'] as const,
    byId: (id: string) => ['fairs', id] as const,
    metrics: (fairId: string) => ['fairs', fairId, 'metrics'] as const,
    pipelineStats: (fairId: string) => ['fairs', fairId, 'pipeline-stats'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (search?: string) => ['customers', 'list', { search }] as const,
    byId: (id: string) => ['customers', id] as const,
  },
  opportunities: {
    byFair: (fairId: string) => ['opportunities', 'fair', fairId] as const,
    byFairFiltered: (
      fairId: string,
      search?: string,
      rate?: string,
      currentStage?: string,
    ) => ['opportunities', 'fair', fairId, { search, rate, currentStage }] as const,
    stageHistory: (opportunityId: string) =>
      ['opportunities', opportunityId, 'stages'] as const,
  },
} as const;
