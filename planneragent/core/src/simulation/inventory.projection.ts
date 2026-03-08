// core/src/simulation/inventory.projection.ts
// ======================================================
// PlannerAgent — Inventory Projection
// Canonical Source of Truth
//
// Projects future inventory from demand and receipts
// ======================================================

export interface InventoryRow {
  sku: string
  onHand: number
}

export interface SupplyRow {
  sku: string
  qty: number
  etaDay: number
}

export function projectInventory(
  inventory: InventoryRow[],
  demand: Map<string, number>,
  supply: SupplyRow[]
): Map<string, number> {

  const projected = new Map<string, number>()

  for (const inv of inventory) {

    projected.set(inv.sku, inv.onHand)

  }

  for (const [sku, qty] of demand.entries()) {

    projected.set(
      sku,
      (projected.get(sku) ?? 0) - qty
    )

  }

  for (const s of supply) {

    projected.set(
      s.sku,
      (projected.get(s.sku) ?? 0) + s.qty
    )

  }

  return projected

}