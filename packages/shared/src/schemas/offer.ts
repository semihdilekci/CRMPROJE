import { z } from 'zod';
import { CURRENCIES, OFFER_UNITS } from '../constants/enums';

export const offerProductItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi zorunludur'),
  productName: z.string().min(1),
  qty: z.number().positive('Miktar 0\'dan büyük olmalıdır'),
  unit: z.enum(OFFER_UNITS),
  price: z.string().min(1, 'Fiyat zorunludur'),
  currency: z.enum(CURRENCIES as unknown as [string, ...string[]]),
});

export const createOfferSchema = z.object({
  outputFormat: z.enum(['pdf', 'docx']),
  productItems: z.array(offerProductItemSchema).min(1, 'En az bir ürün eklenmelidir'),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
