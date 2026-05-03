// ======================================================
// PlannerAgent — Movements Normalizer
// FIXED — PRESERVE SEMANTICS
// ======================================================

import { mapMovementType } from "./movement.mapping";

export type NormalizedMovement = {
  sku: string;
  qty: number;
  date?: string;

  type: string;
  event: string;

  orderId?: string;
  commessa?: string;
  batch?: string;

  parentSku?: string;
  producedSku?: string;
  consumedSku?: string;
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

      // 🔥 CRITICI — NON PERDERLI MAI
      orderId: m.orderId,
      commessa: m.commessa,
      batch: m.batch,

      parentSku: m.parentSku,
      producedSku: m.producedSku,
      consumedSku: m.consumedSku,
    };
  });
}