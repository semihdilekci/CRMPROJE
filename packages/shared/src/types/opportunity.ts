import { ConversionRate, Currency } from '../constants/enums';
import { Customer } from './customer';
import { CustomerContact } from './customer-contact';
import { OpportunityProduct } from './opportunity-product';
import type { OpportunityStageLog } from './opportunity-stage';

export interface Opportunity {
  id: string;
  fairId: string;
  customerId: string;
  contactId: string | null;
  budgetRaw: string | null;
  budgetCurrency: Currency | null;
  conversionRate: ConversionRate | null;
  products: string[];
  currentStage: string;
  lossReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityWithDetails extends Opportunity {
  customer: Customer;
  contact: CustomerContact | null;
  opportunityProducts: OpportunityProduct[];
  stageLogs: OpportunityStageLog[];
}

export interface OpportunityWithCustomer extends Opportunity {
  customer: Customer;
  contact: CustomerContact | null;
  opportunityProducts?: OpportunityProduct[];
  stageLogs?: OpportunityStageLog[];
}
