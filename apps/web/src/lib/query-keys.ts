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
    list: (search?: string, sortBy?: string) => ['customers', 'list', { search, sortBy }] as const,
    byId: (id: string) => ['customers', id] as const,
    profile: (id: string) => ['customers', id, 'profile'] as const,
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
    hasOffer: (opportunityId: string) =>
      ['opportunities', opportunityId, 'has-offer'] as const,
    notes: (opportunityId: string) =>
      ['opportunities', opportunityId, 'notes'] as const,
  },
  reports: {
    executiveSummary: (filters?: Record<string, string>) => ['reports', 'executive-summary', filters ?? {}] as const,
    fairPerformance: (filters?: Record<string, string>) => ['reports', 'fair-performance', filters ?? {}] as const,
    fairComparison: (fairIds: string[]) => ['reports', 'fair-comparison', fairIds] as const,
    fairTargets: (filters?: Record<string, string>) => ['reports', 'fair-targets', filters ?? {}] as const,
    pipelineOverview: (filters?: Record<string, string>) => ['reports', 'pipeline-overview', filters ?? {}] as const,
    pipelineVelocity: (filters?: Record<string, string>) => ['reports', 'pipeline-velocity', filters ?? {}] as const,
    winLoss: (filters?: Record<string, string>) => ['reports', 'win-loss', filters ?? {}] as const,
    revenue: (filters?: Record<string, string>) => ['reports', 'revenue', filters ?? {}] as const,
    forecast: (filters?: Record<string, string>) => ['reports', 'forecast', filters ?? {}] as const,
    customerOverview: (filters?: Record<string, string>) => ['reports', 'customer-overview', filters ?? {}] as const,
    customerSegmentation: (filters?: Record<string, string>) => ['reports', 'customer-segmentation', filters ?? {}] as const,
    customerLifecycle: (filters?: Record<string, string>) => ['reports', 'customer-lifecycle', filters ?? {}] as const,
    productAnalysis: (filters?: Record<string, string>) => ['reports', 'product-analysis', filters ?? {}] as const,
    productFairMatrix: (filters?: Record<string, string>) => ['reports', 'product-fair-matrix', filters ?? {}] as const,
    teamPerformance: (filters?: Record<string, string>) => ['reports', 'team-performance', filters ?? {}] as const,
    individualPerformance: (filters?: Record<string, string>) => ['reports', 'individual-performance', filters ?? {}] as const,
    activityAnalysis: (filters?: Record<string, string>) => ['reports', 'activity-analysis', filters ?? {}] as const,
  },
} as const;
