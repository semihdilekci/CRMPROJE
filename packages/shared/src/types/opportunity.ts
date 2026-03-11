import { ConversionRate, Currency } from '../constants/enums';
import { Customer } from './customer';
import { OpportunityProduct } from './opportunity-product';

export interface Opportunity {
  id: string;
  fairId: string;
  customerId: string;
  budgetRaw: string | null;
  budgetCurrency: Currency | null;
  conversionRate: ConversionRate | null;
  cardImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityWithDetails extends Opportunity {
  customer: Customer;
  opportunityProducts: OpportunityProduct[];
}
