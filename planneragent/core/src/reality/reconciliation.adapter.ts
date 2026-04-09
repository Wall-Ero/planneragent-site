// core/src/reality/reconciliation.adapter.ts

import type {
  InventoryReconciliationResult,
} from "./inventory.reconciliation";

export type ReconciliationStatus = "OK" | "MINOR" | "MAJOR";

export type ReconciliationRow = {
  sku: string;
  erpQty: number;
  reconstructedQty: number;
  delta: number;
  absDelta: number;
  status: ReconciliationStatus;
};

export type ReconciliationResult = {
  rows: ReconciliationRow[];
  mismatchCount: number;
  majorMismatchCount: number;
  totalAbsoluteDelta: number;
  hasBlockingMismatch: boolean;
};

function mapStatus(
  status: string,
  absDelta: number
): ReconciliationStatus {
  if (status === "MATCH") return "OK";
  if (absDelta <= 5) return "MINOR";
  return "MAJOR";
}

export function adaptInventoryReconciliation(
  input: InventoryReconciliationResult
): ReconciliationResult {
  const rows: ReconciliationRow[] = input.rows.map((r) => ({
    sku: r.sku,
    erpQty: r.erpQty,
    reconstructedQty: r.reconstructedQty,
    delta: r.delta,
    absDelta: r.absDelta,
    status: mapStatus(r.status, r.absDelta),
  }));

  return {
    rows,
    mismatchCount: input.mismatchCount,
    majorMismatchCount: input.majorMismatchCount,
    totalAbsoluteDelta: input.totalAbsoluteDelta,
    hasBlockingMismatch: input.hasBlockingMismatch,
  };
}