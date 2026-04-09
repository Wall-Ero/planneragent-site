// core/src/normalization/movements.normalizer.ts
// ======================================================
// PlannerAgent — Movements Normalizer
// Canonical Source of Truth
// ======================================================

import { mapMovementType } from "./movement.mapping";

export type NormalizedMovement = {
  sku: string;
  qty: number;
  date?: string;
  type: string;
  event: string;
};

export function normalizeMovements(input: any[]): NormalizedMovement[] {
  return (input ?? []).map((m) => {
    const mappedType = mapMovementType(m.type);

    if (mappedType === "UNKNOWN") {
      console.warn("UNKNOWN_MOVEMENT_TYPE", m.type);
    }

    return {
      sku: m.sku,
      qty: Number(m.qty ?? 0),
      date: m.date,
      type: m.type,
      event: mappedType,
    };
  });
}