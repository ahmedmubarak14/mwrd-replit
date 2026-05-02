import type { Invoice } from '../types/index.js';

export interface Seller {
  name: string;
  vat_number: string;
}

export function generateZatcaTLV(_invoice: Invoice, _seller: Seller): string | null {
  return null;
}
