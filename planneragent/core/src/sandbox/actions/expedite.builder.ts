// core/src/sandbox/actions/expedite.builder.ts

import { Action } from "./actions.types";

export function buildExpediteAction(input: {
  sku: string;
  shortageQty: number;
}): Action {
  return {
    id: `act-${Date.now()}`,
    type: "EXPEDITE_SUPPLIER",

    sku: input.sku,
    qty: input.shortageQty,

    metadata: {
      reason: "Stock shortage detected",
      urgency: input.shortageQty > 50 ? "HIGH" : "MEDIUM",
    },
  };
}