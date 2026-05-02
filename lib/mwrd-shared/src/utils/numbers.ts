import { v4 as uuidv4 } from 'uuid';

type DocPrefix = 'CPO' | 'SPO' | 'DN' | 'GRN' | 'INV' | 'RFQ' | 'Q';

export function generateDocNumber(prefix: DocPrefix): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${timestamp}${random}`;
}

export function generateMasterProductCode(seq: number): string {
  return `MWRD-PROD-${seq.toString().padStart(5, '0')}`;
}

export function newId(): string {
  return uuidv4();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function addDays(date: Date | string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
