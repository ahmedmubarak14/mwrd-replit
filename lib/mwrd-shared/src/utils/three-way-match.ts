import type { PO, GRN, Invoice, ThreeWayMatchResult } from '../types/index.js';

export function matchPOGRNInvoice(
  po: PO,
  grn: GRN,
  invoice: Invoice,
): ThreeWayMatchResult {
  const discrepancies: string[] = [];

  const poTotal = po.total_sar;
  const invoiceTotal = invoice.total_sar;

  const variance_pct =
    poTotal > 0 ? Math.abs((invoiceTotal - poTotal) / poTotal) * 100 : 0;

  if (variance_pct > 2) {
    discrepancies.push(
      `Invoice total (SAR ${invoiceTotal.toFixed(2)}) differs from PO total (SAR ${poTotal.toFixed(2)}) by ${variance_pct.toFixed(2)}%`,
    );
  }

  const grnItemMap = new Map(grn.items.map((i) => [i.master_product_id, i]));
  for (const poItem of po.items) {
    const grnItem = grnItemMap.get(poItem.master_product_id);
    if (!grnItem) {
      discrepancies.push(`PO item ${poItem.name_en} not found in GRN`);
    } else if (grnItem.qty_received < poItem.qty) {
      discrepancies.push(
        `${poItem.name_en}: PO qty ${poItem.qty} but GRN received ${grnItem.qty_received}`,
      );
    }
  }

  return {
    matches: discrepancies.length === 0 && variance_pct <= 2,
    variance_pct,
    discrepancies,
  };
}
