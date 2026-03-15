import type { Currency, OfferUnit } from '../constants/enums';

export interface OfferProductItem {
  productId: string;
  productName: string;
  qty: number;
  unit: OfferUnit;
  price: string;
  currency: Currency;
}

export interface OfferDocumentMeta {
  format: 'pdf' | 'docx';
  createdAt: string;
}
