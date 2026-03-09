export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (filters?: { search?: string; role?: string }) =>
      ['users', 'list', filters ?? {}] as const,
    byId: (id: string) => ['users', id] as const,
  },
  fairs: {
    all: ['fairs'] as const,
    byId: (id: string) => ['fairs', id] as const,
  },
  customers: {
    byFair: (fairId: string) => ['customers', 'fair', fairId] as const,
    byFairFiltered: (fairId: string, search?: string, rate?: string) =>
      ['customers', 'fair', fairId, { search, rate }] as const,
  },
} as const;
