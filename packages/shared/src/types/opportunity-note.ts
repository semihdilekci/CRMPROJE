export interface OpportunityNote {
  id: string;
  opportunityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}
