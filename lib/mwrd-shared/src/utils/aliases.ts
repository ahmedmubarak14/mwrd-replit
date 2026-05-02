const SUPPLIER_COLOUR_POOL = [
  'Violet',
  'Indigo',
  'Teal',
  'Amber',
  'Coral',
  'Sage',
  'Rose',
  'Slate',
];

export function generateClientAlias(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Client-${suffix}`;
}

export function generateSupplierAlias(takenAliases: string[]): string {
  for (const colour of SUPPLIER_COLOUR_POOL) {
    const alias = `Supplier ${colour}`;
    if (!takenAliases.includes(alias)) {
      return alias;
    }
  }
  let n = 2;
  while (true) {
    for (const colour of SUPPLIER_COLOUR_POOL) {
      const alias = `Supplier ${colour} ${n}`;
      if (!takenAliases.includes(alias)) {
        return alias;
      }
    }
    n++;
  }
}
