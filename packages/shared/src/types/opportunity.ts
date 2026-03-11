import { ConversionRate, Currency } from '../constants/enums';
import { Customer } from './customer';
import { OpportunityProduct } from './opportunity-product';
import type { OpportunityStageLog } from './opportunity-stage';

export interface Opportunity {
  id: string;
  fairId: string;
  customerId: string;
  budgetRaw: string | null;
  budgetCurrency: Currency | null;
  conversionRate: ConversionRate | null;
  products: string[];
  cardImage: string | null;
  currentStage: string;
  lossReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityWithDetails extends Opportunity {
  customer: Customer;
  opportunityProducts: OpportunityProduct[];
  stageLogs: OpportunityStageLog[];
}

// Geçiş dönemi için OpportunityWithCustomer, opportunityProducts ve stageLogs
// alanlarını opsiyonel kabul eden daha gevşek bir tip olarak tanımlanır.
export interface OpportunityWithCustomer extends Opportunity {
  customer: Customer;
  opportunityProducts?: OpportunityProduct[];
  stageLogs?: OpportunityStageLog[];
}
