export function qs(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

export function qn(val: unknown): number | undefined {
  const s = typeof val === "string" ? val : undefined;
  return s !== undefined ? Number(s) : undefined;
}

export function pp(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}
