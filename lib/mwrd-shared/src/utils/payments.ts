import { v4 as uuidv4 } from 'uuid';

export async function createPaymentIntent(
  _invoiceId: string,
  _amount: number,
  _payment_method: string,
): Promise<{ intent_id: string; status: string }> {
  return {
    intent_id: `mock_${uuidv4()}`,
    status: 'requires_action',
  };
}
