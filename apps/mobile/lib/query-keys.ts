export const queryKeys = {
  fairs: {
    all: ['fairs'] as const,
    byId: (id: string) => [...queryKeys.fairs.all, id] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    byFair: (fairId: string) => [...queryKeys.opportunities.all, fairId] as const,
  },
  customers: {
    all: ['customers'] as const,
    byFair: (fairId: string) => [...queryKeys.customers.all, fairId] as const,
  },
} as const;
