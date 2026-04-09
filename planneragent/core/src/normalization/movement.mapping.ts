// core/src/normalization/movement.mapping.ts

export type MovementType =
  | "PRODUCTION_LOAD"
  | "COMPONENT_CONSUMPTION"
  | "SUPPLIER_RECEIPT"
  | "CUSTOMER_SHIPMENT"
  | "STOCK_TRANSFER_IN"
  | "STOCK_TRANSFER_OUT"
  | "INVENTORY_ADJUSTMENT_POS"
  | "INVENTORY_ADJUSTMENT_NEG"
  | "UNKNOWN";

export const MOVEMENT_TYPE_MAP: Record<string, MovementType> = {
  // ======================================================
  // PRODUZIONE
  // ======================================================

  T: "PRODUCTION_LOAD",
  PRODUCTION: "PRODUCTION_LOAD",
  PROD_LOAD: "PRODUCTION_LOAD",

  U: "COMPONENT_CONSUMPTION",
  CONSUMPTION: "COMPONENT_CONSUMPTION",
  CONSUME: "COMPONENT_CONSUMPTION",
  ISSUE: "COMPONENT_CONSUMPTION",
  MATERIAL_ISSUE: "COMPONENT_CONSUMPTION",

  // ======================================================
  // FORNITORE (carico)
  // ======================================================

  B: "SUPPLIER_RECEIPT",
  C: "SUPPLIER_RECEIPT",
  LOAD: "SUPPLIER_RECEIPT",
  RECEIPT: "SUPPLIER_RECEIPT",
  IN: "SUPPLIER_RECEIPT",

  // ======================================================
  // CLIENTE (uscita)
  // ======================================================

  V: "CUSTOMER_SHIPMENT",
  SALE: "CUSTOMER_SHIPMENT",
  SHIP: "CUSTOMER_SHIPMENT",
  OUT: "CUSTOMER_SHIPMENT",
  SHIPMENT: "CUSTOMER_SHIPMENT",

  // ======================================================
  // TRASFERIMENTI
  // ======================================================

  Z_OUT: "STOCK_TRANSFER_OUT",
  Z_IN: "STOCK_TRANSFER_IN",
  TRANSFER_OUT: "STOCK_TRANSFER_OUT",
  TRANSFER_IN: "STOCK_TRANSFER_IN",

  // ======================================================
  // RETTIFICHE
  // ======================================================

  I_POS: "INVENTORY_ADJUSTMENT_POS",
  I_NEG: "INVENTORY_ADJUSTMENT_NEG",
  ADJ_POS: "INVENTORY_ADJUSTMENT_POS",
  ADJ_NEG: "INVENTORY_ADJUSTMENT_NEG",
};

export function mapMovementType(rawType?: string): MovementType {
  if (!rawType) return "UNKNOWN";

  const normalized = rawType.toUpperCase().trim();

  const mapped = MOVEMENT_TYPE_MAP[normalized];

  if (!mapped) {
    console.warn("UNKNOWN_MOVEMENT_TYPE", normalized);
  }

  return mapped ?? "UNKNOWN";
}