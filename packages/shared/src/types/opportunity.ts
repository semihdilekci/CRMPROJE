import { ConversionRate, Currency } from '../constants/enums';
import { Customer } from './customer';

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

export interface OpportunityWithCustomer extends Opportunity {
  customer: Customer;
}
