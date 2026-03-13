import { OpportunityWithDetails } from './opportunity';

export interface Fair {
  id: string;
  name: string;
  address: string;
  startDate: string;
  endDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  targetBudget: string | null;
  targetTonnage: number | null;
  targetLeadCount: number | null;
}

export interface FairWithOpportunities extends Fair {
  opportunities: OpportunityWithDetails[];
}

export interface FairMetrics {
  totalOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  openOpportunities: number;
  proposalSentCount: number;
  totalTonnage: number;
  wonTonnage: number;
  totalPipelineValue: number;
  wonPipelineValue: number;
  conversionRate: number;
  targetBudgetProgress: number | null;
  targetTonnageProgress: number | null;
  targetLeadCountProgress: number | null;
}
