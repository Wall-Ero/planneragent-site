// core/src/sandbox/actions/actions.types.ts

export type ActionType =
  | "EXPEDITE_SUPPLIER"
  | "REALLOCATE_STOCK"
  | "DELAY_ORDER";

export interface Action {
  id: string;
  type: ActionType;

  sku: string;
  qty: number;

  metadata?: {
    supplierId?: string;
    reason?: string;
    urgency?: "LOW" | "MEDIUM" | "HIGH";
  };
}