// core/src/domain/events/movement.events.ts
// ======================================================
// PlannerAgent — Movement Event Contract
// Canonical Source of Truth
// ======================================================

export type MovementEvent =
  | "PRODUCTION_LOAD"         // carico produzione (T)
  | "COMPONENT_CONSUMPTION"   // consumo componenti (U)
  | "TRANSFER"                // trasferimenti interni
  | "RECEIPT"                 // ricezione da fornitore
  | "SHIPMENT"                // spedizione cliente
  | "ADJUSTMENT"              // rettifiche inventariali
  | "UNKNOWN";
  