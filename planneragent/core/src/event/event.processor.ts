// core/src/events/event.processor.ts
// ======================================================
// PlannerAgent — Event Processor
// ======================================================

export type EventType =
  | "ORDER_CREATED"
  | "SUPPLIER_DELAY"
  | "STOCK_CHANGE"
  | "PRODUCTION_COMPLETE";

export interface SystemEvent {

  type: EventType;

  timestamp: string;

  payload: any;

}

export function processEvent(event: SystemEvent) {

  switch (event.type) {

    case "ORDER_CREATED":
      return {
        impact: "DEMAND_INCREASE",
        sku: event.payload.sku,
      };

    case "SUPPLIER_DELAY":
      return {
        impact: "SUPPLY_DELAY",
        sku: event.payload.sku,
      };

    case "STOCK_CHANGE":
      return {
        impact: "INVENTORY_UPDATE",
        sku: event.payload.sku,
      };

    default:
      return { impact: "UNKNOWN" };

  }

}