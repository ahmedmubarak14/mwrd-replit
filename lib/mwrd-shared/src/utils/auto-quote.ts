import type { RFQ, RFQItem, Offer, Quote, QuoteItem, Company } from '../types/index.js';
import { newId, generateDocNumber, nowISO, addDays } from './numbers.js';

export function matchOffersToRFQ(
  rfq: RFQ,
  offers: Offer[],
): Map<string, { matched_items: Array<{ rfq_item: RFQItem; offer: Offer }>; unmatched_rfq_items: RFQItem[] }> {
  const result = new Map<
    string,
    { matched_items: Array<{ rfq_item: RFQItem; offer: Offer }>; unmatched_rfq_items: RFQItem[] }
  >();

  const eligibleOffers = offers.filter(
    (o) =>
      o.approval_status === 'approved' &&
      o.status === 'active' &&
      o.auto_quote_enabled,
  );

  const supplierIds = [...new Set(eligibleOffers.map((o) => o.supplier_company_id))];

  for (const supplierId of supplierIds) {
    const supplierOffers = eligibleOffers.filter(
      (o) => o.supplier_company_id === supplierId,
    );
    const matched_items: Array<{ rfq_item: RFQItem; offer: Offer }> = [];
    const unmatched_rfq_items: RFQItem[] = [];

    for (const rfqItem of rfq.items) {
      if (!rfqItem.master_product_id) {
        unmatched_rfq_items.push(rfqItem);
        continue;
      }
      const matchedOffer = supplierOffers.find(
        (o) => o.master_product_id === rfqItem.master_product_id,
      );
      if (matchedOffer) {
        matched_items.push({ rfq_item: rfqItem, offer: matchedOffer });
      } else {
        unmatched_rfq_items.push(rfqItem);
      }
    }

    if (matched_items.length > 0) {
      result.set(supplierId, { matched_items, unmatched_rfq_items });
    }
  }

  return result;
}

export function generateAutoQuote(
  rfq: RFQ,
  supplierId: string,
  matchedItems: Array<{ rfq_item: RFQItem; offer: Offer }>,
  supplier: Company,
): Quote {
  const window = supplier.auto_quote_review_window ?? '30min';
  let windowMs = 30 * 60 * 1000;
  if (window === 'instant') windowMs = 0;
  else if (window === '2hr') windowMs = 2 * 60 * 60 * 1000;

  const now = new Date();
  const auto_send_at =
    windowMs === 0 ? nowISO() : new Date(now.getTime() + windowMs).toISOString();

  const quoteId = newId();

  const items: QuoteItem[] = matchedItems.map(({ rfq_item, offer }) => {
    const pricing = offer.pack_type_pricing[0];
    const cost = pricing?.supplier_cost_sar ?? 0;

    return {
      id: newId(),
      quote_id: quoteId,
      rfq_item_id: rfq_item.id,
      offer_id: offer.id,
      supplier_unit_price_sar: cost,
      final_unit_price_sar: cost,
      qty_available: offer.available_quantity_estimate ?? rfq_item.qty,
      lead_time_days: offer.default_lead_time_days,
      notes: '',
      declined: false,
    };
  });

  return {
    id: quoteId,
    quote_number: generateDocNumber('Q'),
    rfq_id: rfq.id,
    supplier_company_id: supplierId,
    status: 'draft_auto',
    is_auto_generated: true,
    supplier_review_window: window,
    supplier_reviewed_at: null,
    auto_send_at,
    admin_held: false,
    valid_until: addDays(now, 14),
    lead_time_days: matchedItems[0]?.offer.default_lead_time_days ?? 7,
    items,
    notes: '',
    submitted_at: null,
  };
}

export function processAutoSendQueue(
  quotes: Quote[],
  now: Date,
  threshold_sar: number,
): { to_send_to_client: Quote[]; to_hold_for_admin: Quote[] } {
  const to_send_to_client: Quote[] = [];
  const to_hold_for_admin: Quote[] = [];

  for (const quote of quotes) {
    if (quote.status !== 'draft_auto') continue;
    if (!quote.auto_send_at) continue;
    if (new Date(quote.auto_send_at) > now) continue;

    const total = quote.items.reduce(
      (sum, item) => sum + item.final_unit_price_sar * item.qty_available,
      0,
    );

    if (total > threshold_sar) {
      to_hold_for_admin.push(quote);
    } else {
      to_send_to_client.push(quote);
    }
  }

  return { to_send_to_client, to_hold_for_admin };
}
