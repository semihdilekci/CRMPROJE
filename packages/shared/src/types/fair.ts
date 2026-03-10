import { OpportunityWithCustomer } from './opportunity';

export interface Fair {
  id: string;
  name: string;
  address: string;
  startDate: string;
  endDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FairWithOpportunities extends Fair {
  opportunities: OpportunityWithCustomer[];
}
