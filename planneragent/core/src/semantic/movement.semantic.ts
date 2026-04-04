// core/src/semantic/movement.semantic.ts
// ======================================================
// PlannerAgent — Movement Semantic Mapper
// Canonical Source of Truth
// ======================================================

import { MovementEvent } from "../domain/events/movement.events";

export function mapMovementToEvent(m: any): MovementEvent {

  const rawType =
    m.type ??
    m.mo_tipork ??
    m.mm_tipork ??
    m.kind ??
    "";

  const type = String(rawType).toUpperCase();

  switch (type) {

    // --------------------------------------------------
    // PRODUCTION
    // --------------------------------------------------

    case "T":
      return "PRODUCTION_LOAD";

    case "U":
      return "COMPONENT_CONSUMPTION";

    // --------------------------------------------------
    // COMMON ERP CODES (estendibile)
    // --------------------------------------------------

    case "B":
      return "SHIPMENT";

    case "M":
      return "RECEIPT";

    case "Z":
      return "TRANSFER";

    // --------------------------------------------------
    // FALLBACK
    // --------------------------------------------------

    default:
      return "UNKNOWN";
  }
}