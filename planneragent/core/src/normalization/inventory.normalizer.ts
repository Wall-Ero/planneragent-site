// core/src/normalization/inventory.normalizer.ts
// ======================================================
// PlannerAgent — Inventory Normalizer
// Canonical Source of Truth
// ======================================================

export type NormalizedInventory = {
  sku: string;
  qty: number;
  warehouse?: string;
};

// ------------------------------------------------------

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------------------------------------

export function normalizeInventory(
  input?: any[]
): NormalizedInventory[] {

  if (!input || input.length === 0) return [];

  const map = new Map<string, NormalizedInventory>();

  for (const i of input) {

    const sku = str(i.sku ?? i.article ?? i.codart);
    if (!sku) continue;

    const qty = num(
      i.qty ??
      i.quantity ??
      i.qtyAvailable ??
      i.giacenza ??
      i.stock ??
      i.available ??
      0
    );

    const warehouse = str(
      i.warehouse ??
      i.magazzino ??
      i.wh
    ) || undefined;

    const key = `${sku}__${warehouse ?? "ALL"}`;

    const existing = map.get(key);

    if (existing) {
      existing.qty += qty;
    } else {
      map.set(key, { sku, qty, warehouse });
    }
  }

  return Array.from(map.values());
}