// core/src/reconstruction/inventory.reconstruction.ts
// ======================================================
// PlannerAgent — Inventory Reconstruction Engine v1
// Canonical Source of Truth
// ======================================================

import { NormalizedMovement } from "../normalization/movements.normalizer";
import { NormalizedInventory } from "../normalization/inventory.normalizer";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

type InventoryMap = Record<string, number>;

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

function ensure(map: InventoryMap, sku: string) {
  if (!map[sku]) map[sku] = 0;
}

// ------------------------------------------------------
// MAIN ENGINE
// ------------------------------------------------------

export function reconstructInventoryFromMovements(
  movements: NormalizedMovement[]
): NormalizedInventory[] {

  const inventory: InventoryMap = {};

  for (const m of movements) {

    if (!m.sku) continue;

    ensure(inventory, m.sku);

    // --------------------------------------------------
    // SEMANTIC EVENTS
    // --------------------------------------------------

    const type = m.type?.toUpperCase();

    // 🔵 PRODUCTION LOAD → aumenta stock FG
    if (type === "T") {
      inventory[m.sku] += m.qty;
      continue;
    }

    // 🔴 COMPONENT CONSUMPTION → diminuisce stock componenti
    if (type === "U") {
      inventory[m.sku] -= m.qty;
      continue;
    }

    // 🟡 INBOUND (es. DDT carico)
    if (type === "M" || type === "IN") {
      inventory[m.sku] += m.qty;
      continue;
    }

    // 🟠 OUTBOUND (es. spedizioni)
    if (type === "B" || type === "OUT") {
      inventory[m.sku] -= m.qty;
      continue;
    }
  }

  // ------------------------------------------------------
  // NORMALIZATION OUTPUT
  // ------------------------------------------------------

  const result: NormalizedInventory[] = Object.entries(inventory)
    .map(([sku, qty]) => ({
      sku,
      qty
    }));

  console.log("RECONSTRUCTED_INVENTORY", result);

  return result;
}

// ------------------------------------------------------
// GUARD (quando usarlo)
// ------------------------------------------------------

export function shouldReconstructInventory(
  inventory?: NormalizedInventory[]
): boolean {

  if (!inventory || inventory.length === 0) return true;

  const hasPositive = inventory.some(i => (i.qty ?? 0) > 0);

  return !hasPositive;
}

export function mergeInventoryWithReconstruction(
  base: NormalizedInventory[],
  movements: NormalizedMovement[]
): NormalizedInventory[] {

  if (!movements || movements.length === 0) {
    return base;
  }

  const reconstructedMap = new Map<string, number>();

  for (const m of movements) {
    const prev = reconstructedMap.get(m.sku) ?? 0;

    if (m.type === "T") {
      reconstructedMap.set(m.sku, prev + (m.qty ?? 0));
    } else if (m.type === "U") {
      reconstructedMap.set(m.sku, prev - (m.qty ?? 0));
    }
  }

  const baseMap = new Map<string, number>();

  for (const inv of base) {
    baseMap.set(inv.sku, inv.qty ?? 0);
  }

  const allSkus = new Set([
    ...Array.from(baseMap.keys()),
    ...Array.from(reconstructedMap.keys())
  ]);

  const merged: NormalizedInventory[] = [];

  for (const sku of allSkus) {
    const baseQty = baseMap.get(sku) ?? 0;
    const deltaQty = reconstructedMap.get(sku) ?? 0;

    merged.push({
      sku,
      qty: baseQty + deltaQty
    });
  }

  console.log("INVENTORY_MERGED", merged);

  return merged;
}
