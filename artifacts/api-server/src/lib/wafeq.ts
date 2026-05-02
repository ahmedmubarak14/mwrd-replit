const WAFEQ_BASE = 'https://api.wafeq.com/v1';

const WAFEQ_SALES_ACCOUNT = 'acc_XKsx69djSQuhVMQsPWtvpw';
const WAFEQ_PAYMENT_ACCOUNT = 'acc_ckFEbSnhSPcgKgBfQPXqQN';
const WAFEQ_VAT_RATE = 'tax_Yg4fKsomvvBFJd3gUavszf';

const MWRD_SENDER_EMAIL = 'invoices@mwrd.com';

function apiKey(): string {
  const key = process.env['WAFEQ_API_KEY'];
  if (!key) throw new Error('WAFEQ_API_KEY environment variable is not set');
  return key;
}

export interface WafeqLineItem {
  name: string;
  description?: string;
  quantity: number;
  price: number;
}

export interface WafeqContact {
  name: string;
  email?: string;
  address?: string;
}

export interface WafeqInvoicePayload {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  contact: WafeqContact;
  lineItems: WafeqLineItem[];
  currency?: string;
  recipientEmail?: string;
}

export interface WafeqInvoiceResult {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  pdf_url?: string | null;
}

export async function createWafeqInvoice(payload: WafeqInvoicePayload): Promise<WafeqInvoiceResult> {
  const body: Record<string, unknown> = {
    reference: payload.invoiceNumber,
    invoice_number: payload.invoiceNumber,
    invoice_date: payload.invoiceDate,
    due_date: payload.dueDate,
    currency: payload.currency ?? 'SAR',
    paid_through_account: WAFEQ_PAYMENT_ACCOUNT,
    language: 'en',
    tax_amount_type: 'TAX_EXCLUSIVE',
    contact: {
      name: payload.contact.name,
      ...(payload.contact.email ? { email: payload.contact.email } : {}),
      ...(payload.contact.address ? { address: payload.contact.address } : {}),
    },
    channels: [
      {
        medium: 'email',
        data: {
          subject: `Invoice ${payload.invoiceNumber} from MWRD`,
          message: '<p>Please find attached your invoice from MWRD. Thank you for your business.</p>',
          recipients: {
            to: payload.recipientEmail ? [payload.recipientEmail] : [MWRD_SENDER_EMAIL],
            cc: [],
            bcc: [],
          },
        },
      },
    ],
    line_items: payload.lineItems.map((item) => ({
      name: item.name,
      description: item.description ?? item.name,
      account: WAFEQ_SALES_ACCOUNT,
      quantity: item.quantity,
      price: item.price,
      tax_rate: WAFEQ_VAT_RATE,
    })),
  };

  const response = await fetch(`${WAFEQ_BASE}/api-invoices/bulk_send/`, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([body]),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wafeq API error ${response.status}: ${text}`);
  }

  const data = await response.json() as { queued: number };

  if (!data.queued || data.queued < 1) {
    throw new Error('Wafeq did not queue the invoice');
  }

  return {
    id: `wafeq-${payload.invoiceNumber}`,
    invoice_number: payload.invoiceNumber,
    status: 'queued',
    total: payload.lineItems.reduce((sum, i) => sum + i.quantity * i.price, 0),
    pdf_url: null,
  };
}

export async function getWafeqInvoices(): Promise<WafeqInvoiceResult[]> {
  const response = await fetch(`${WAFEQ_BASE}/api-invoices/`, {
    headers: {
      Authorization: `Api-Key ${apiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Wafeq list error ${response.status}`);
  }

  const data = await response.json() as { results: Array<{ id: string; invoice_number: string; status: string; total: number; pdf_url?: string }> };
  return data.results.map((r) => ({
    id: r.id,
    invoice_number: r.invoice_number,
    status: r.status,
    total: r.total,
    pdf_url: r.pdf_url ?? null,
  }));
}
