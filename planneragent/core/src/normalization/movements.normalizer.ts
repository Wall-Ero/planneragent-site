// core/src/normalization/movements.normalizer.ts
// ======================================================
// PlannerAgent — Movements Normalizer
// Canonical Source of Truth
// ======================================================

export type NormalizedMovement = {
  type: string;
  sku: string;
  qty: number;
  date?: string;
};

export function normalizeMovements(input: any[]): NormalizedMovement[] {
  if (!input || input.length === 0) return [];

  return input
    .map((m: any) => {
      const type = (m.type ?? m.mm_tipork ?? "").toUpperCase();
      const sku = m.sku ?? m.article;
      const qty = Number(m.qty ?? m.quantity ?? 0);

      if (!type || !sku) return null;

      return {
        type,
        sku,
        qty,
        date: m.date
      };
    })
    .filter(Boolean) as NormalizedMovement[];
}