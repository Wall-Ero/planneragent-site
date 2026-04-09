// core/src/reconstruction/inventory.reconstruction.ts
// ======================================================
// PlannerAgent — Inventory Reconstruction Engine v2
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

  for (const m of movements ?? []) {

    if (!m?.sku) continue;

    ensure(inventory, m.sku);

    const qty = Math.abs(Number(m.qty ?? 0));

    // --------------------------------------------------
    // CANONICAL EVENT ENGINE (NO ERP TYPES HERE)
    // --------------------------------------------------

    switch (m.event) {

      // 🔵 INBOUND (aumentano stock)
      case "PRODUCTION_LOAD":
      case "SUPPLIER_RECEIPT":
      case "STOCK_TRANSFER_IN":
      case "INVENTORY_ADJUSTMENT_POS":
        inventory[m.sku] += qty;
        break;

      // 🔴 OUTBOUND (diminuiscono stock)
      case "COMPONENT_CONSUMPTION":
      case "CUSTOMER_SHIPMENT":
      case "STOCK_TRANSFER_OUT":
      case "INVENTORY_ADJUSTMENT_NEG":
        inventory[m.sku] -= qty;
        break;

      // ⚠️ UNKNOWN → ignorato ma loggato
      default:
        console.warn("RECON_UNKNOWN_EVENT", m.event, m);
        break;
    }
  }

  // ------------------------------------------------------
  // OUTPUT NORMALIZATION
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
// GUARD — WHEN TO RECONSTRUCT
// ------------------------------------------------------

export function shouldReconstructInventory(
  inventory?: NormalizedInventory[]
): boolean {

  if (!inventory || inventory.length === 0) return true;

  const hasPositive = inventory.some(i => (i.qty ?? 0) > 0);

  return !hasPositive;
}

// ------------------------------------------------------
// MERGE — ERP + DELTA DA MOVIMENTI
// ------------------------------------------------------

export function mergeInventoryWithReconstruction(
  base: NormalizedInventory[],
  movements: NormalizedMovement[]
): NormalizedInventory[] {

  if (!movements || movements.length === 0) {
    return base ?? [];
  }

  const deltaMap = new Map<string, number>();

  for (const m of movements) {

    if (!m?.sku) continue;

    const prev = deltaMap.get(m.sku) ?? 0;
   const qty = Math.abs(Number(m.qty ?? 0));

    switch (m.event) {

      // 🔵 INCREMENTO
      case "PRODUCTION_LOAD":
      case "SUPPLIER_RECEIPT":
      case "STOCK_TRANSFER_IN":
      case "INVENTORY_ADJUSTMENT_POS":
        deltaMap.set(m.sku, prev + qty);
        break;

      // 🔴 DECREMENTO
      case "COMPONENT_CONSUMPTION":
      case "CUSTOMER_SHIPMENT":
      case "STOCK_TRANSFER_OUT":
      case "INVENTORY_ADJUSTMENT_NEG":
        deltaMap.set(m.sku, prev - qty);
        break;

      default:
        console.warn("MERGE_UNKNOWN_EVENT", m.event, m);
        break;
    }
  }

  const baseMap = new Map<string, number>();

  for (const inv of base ?? []) {
    if (!inv?.sku) continue;
    baseMap.set(inv.sku, Number(inv.qty ?? 0));
  }

  const allSkus = new Set([
    ...Array.from(baseMap.keys()),
    ...Array.from(deltaMap.keys())
  ]);

  const merged: NormalizedInventory[] = [];

  for (const sku of allSkus) {

    const baseQty = baseMap.get(sku) ?? 0;
    const deltaQty = deltaMap.get(sku) ?? 0;

    merged.push({
      sku,
      qty: baseQty + deltaQty
    });
  }

  console.log("INVENTORY_MERGED", merged);

  return merged;
}