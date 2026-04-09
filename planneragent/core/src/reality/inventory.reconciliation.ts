// core/src/reality/inventory.reconciliation.ts
// ======================================================
// PlannerAgent — Inventory Reconciliation Engine v1
// Canonical Source of Truth
// ======================================================

import type { NormalizedInventory } from "../normalization/inventory.normalizer";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export type InventoryReconciliationStatus =
  | "MATCH"
  | "MINOR"
  | "MAJOR";

export type InventoryReconciliationRow = {
  sku: string;
  erpQty: number;
  reconstructedQty: number;
  delta: number;
  absDelta: number;
  status: InventoryReconciliationStatus;
  explainedByMovements?: boolean;
  explanation?: string;
};

export type InventoryReconciliationResult = {
  rows: InventoryReconciliationRow[];
  mismatchCount: number;
  majorMismatchCount: number;
  totalAbsoluteDelta: number;
  hasBlockingMismatch: boolean;
};

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function classifyDelta(absDelta: number): InventoryReconciliationStatus {
  if (absDelta === 0) return "MATCH";
  if (absDelta <= 5) return "MINOR";
  return "MAJOR";
}

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function reconcileInventory(
  erpInventory: NormalizedInventory[],
  reconstructedInventory: NormalizedInventory[]
): InventoryReconciliationResult {

  const erpMap = new Map<string, number>();
  const reconstructedMap = new Map<string, number>();

  for (const row of erpInventory ?? []) {
    if (!row.sku) continue;
    erpMap.set(row.sku, (erpMap.get(row.sku) ?? 0) + num(row.qty));
  }

  for (const row of reconstructedInventory ?? []) {
    if (!row.sku) continue;
    reconstructedMap.set(
      row.sku,
      (reconstructedMap.get(row.sku) ?? 0) + num(row.qty)
    );
  }

  const allSkus = new Set<string>([
    ...Array.from(erpMap.keys()),
    ...Array.from(reconstructedMap.keys()),
  ]);

  const rows: InventoryReconciliationRow[] = [];

  for (const sku of allSkus) {
    const erpQty = erpMap.get(sku) ?? 0;
    const reconstructedQty = reconstructedMap.get(sku) ?? 0;
    const delta = erpQty - reconstructedQty;
    const absDelta = Math.abs(delta);
    const status = classifyDelta(absDelta);

    rows.push({
      sku,
      erpQty,
      reconstructedQty,
      delta,
      absDelta,
      status,
    });
  }

  rows.sort((a, b) => b.absDelta - a.absDelta);

  const mismatchCount = rows.filter((r) => r.status !== "MATCH").length;
  const majorMismatchCount = rows.filter((r) => r.status === "MAJOR").length;
  const totalAbsoluteDelta = rows.reduce((sum, r) => sum + r.absDelta, 0);

  const result: InventoryReconciliationResult = {
    rows,
    mismatchCount,
    majorMismatchCount,
    totalAbsoluteDelta,
    hasBlockingMismatch: majorMismatchCount > 0,
  };

  console.log("INVENTORY_RECONCILIATION", result);

  return result;
}