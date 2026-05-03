import type { Invoice } from '../types/index.js';

export interface WafeqSeller {
  name: string;
  vat_number: string;
  cr_number?: string;
}

export interface WafeqIssueResult {
  wafeq_invoice_id: string | null;
  zatca_uuid: string | null;
  zatca_qr: string | null;
}

/**
 * Issue an invoice via the Wafeq API. Wafeq submits to ZATCA Fatoora upstream
 * and returns the ZATCA UUID + QR payload, so we never call ZATCA directly.
 *
 * Phase 1: returns nulls (mock). Phase 3: replace body with real Wafeq client call.
 */
export async function issueWafeqInvoice(
  _invoice: Invoice,
  _seller: WafeqSeller,
): Promise<WafeqIssueResult> {
  return { wafeq_invoice_id: null, zatca_uuid: null, zatca_qr: null };
}
