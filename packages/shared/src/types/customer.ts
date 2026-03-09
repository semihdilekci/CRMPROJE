import { ConversionRate, Currency } from '../constants/enums';

export interface Customer {
  id: string;
  company: string;
  name: string;
  phone: string | null;
  email: string | null;
  budgetRaw: string | null;
  budgetCurrency: Currency | null;
  conversionRate: ConversionRate | null;
  products: string[];
  cardImage: string | null;
  fairId: string;
  createdAt: string;
  updatedAt: string;
}
