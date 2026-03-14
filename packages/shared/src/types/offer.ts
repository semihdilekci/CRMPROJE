import type { Currency } from '../constants/enums';

export interface OfferProductItem {
  productId: string;
  productName: string;
  price: string;
  currency: Currency;
}

export interface OfferDocumentMeta {
  format: 'pdf' | 'docx';
  createdAt: string;
}
