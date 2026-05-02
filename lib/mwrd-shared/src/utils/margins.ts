import type { Margin } from '../types/index.js';

export function applyMargin(supplier_cost: number, margin_pct: number): number {
  return Math.round(supplier_cost * (1 + margin_pct / 100) * 100) / 100;
}

export function resolveMargin(
  margins: Margin[],
  category_id: string,
  client_company_id: string,
): number {
  const clientMargin = margins.find(
    (m) => m.scope === 'client' && m.scope_id === client_company_id,
  );
  if (clientMargin) return clientMargin.pct;

  const categoryMargin = margins.find(
    (m) => m.scope === 'category' && m.scope_id === category_id,
  );
  if (categoryMargin) return categoryMargin.pct;

  const globalMargin = margins.find((m) => m.scope === 'global');
  return globalMargin?.pct ?? 15;
}
