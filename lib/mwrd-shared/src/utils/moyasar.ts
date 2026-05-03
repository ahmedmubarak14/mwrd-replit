import { v4 as uuidv4 } from 'uuid';

export interface MoyasarPaymentIntent {
  intent_id: string;
  status: 'requires_action' | 'paid' | 'failed';
}

/**
 * Create a Moyasar payment intent for an invoice.
 *
 * Phase 1: returns mock id (status='requires_action'). Phase 3: replace body
 * with real Moyasar API call (POST /v1/invoices or /v1/payments).
 */
export async function createMoyasarPaymentIntent(
  _invoiceId: string,
  _amountSar: number,
  _paymentMethod: string,
): Promise<MoyasarPaymentIntent> {
  return {
    intent_id: `moyasar_mock_${uuidv4()}`,
    status: 'requires_action',
  };
}

/**
 * Capture / confirm a Moyasar payment. Phase 1 stub.
 */
export async function captureMoyasarPayment(
  intentId: string,
): Promise<MoyasarPaymentIntent> {
  return { intent_id: intentId, status: 'paid' };
}
