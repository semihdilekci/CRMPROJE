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
  products: string[];
  cardImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityWithDetails extends Opportunity {
  customer: Customer;
  opportunityProducts: OpportunityProduct[];
}

// Geçiş dönemi için OpportunityWithCustomer, opportunityProducts alanını
// opsiyonel kabul eden daha gevşek bir tip olarak tanımlanır.
export interface OpportunityWithCustomer extends Opportunity {
  customer: Customer;
  opportunityProducts?: OpportunityProduct[];
}
