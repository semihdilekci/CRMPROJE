import type { Currency } from '../constants/enums';

export type CustomerListSortBy = 'lastContact' | 'company' | 'opportunityCount';

export interface CustomerListItem {
  id: string;
  company: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  cardImage: string | null;
  opportunityCount: number;
  wonCount: number;
  activeCount: number;
  lastContact: string | null;
  firstContact: string | null;
  totalBudgetRaw: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfileKpi {
  totalOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  activeOpportunities: number;
  conversionRate: number;
  totalBudgetRaw: string | null;
  totalBudgetCurrency: Currency | null;
  firstContact: string | null;
  lastContact: string | null;
}

export interface PendingOpportunityItem {
  id: string;
  fairId: string;
  fairName: string;
  currentStage: string;
  budgetRaw: string | null;
  budgetCurrency: Currency | null;
  daysSinceLastStageChange: number;
}

export interface OpportunityTimelineItem {
  id: string;
  fairId: string;
  fairName: string;
  fairStartDate: string;
  fairEndDate: string;
  currentStage: string;
  lossReason: string | null;
  budgetRaw: string | null;
  budgetCurrency: Currency | null;
  opportunityProducts: Array<{
    product: { name: string };
    quantity: number | null;
    unit: string;
  }>;
  stageLogs: Array<{
    stage: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface CustomerProfileNoteItem {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  opportunityId: string;
  fairName: string;
}

export interface CustomerProfileResponse {
  customer: {
    id: string;
    company: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    cardImage: string | null;
  };
  kpi: CustomerProfileKpi;
  pendingOpportunities: PendingOpportunityItem[];
  opportunityTimeline: OpportunityTimelineItem[];
  allNotes: CustomerProfileNoteItem[];
}
