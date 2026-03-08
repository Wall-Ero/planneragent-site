// core/src/simulation/time.propagation.engine.ts
// ======================================================
// PlannerAgent — Time Propagation Engine
// Canonical Source of Truth
//
// Purpose
// Advance operational reality when time moves forward.
//
// Unlike time.engine.ts (clock only),
// this module propagates operational state:
//
// - inventory consumption
// - supplier receipts
// - order demand
// - BOM consumption
//
// Fully deterministic
// No external calls
// No LLM
// ======================================================

import type { TwinSnapshot } from "./twin.snapshot";

export interface PropagationResult {

  snapshot: TwinSnapshot;

  events: PropagationEvent[];

}

export type PropagationEvent =
  | {
      type: "SUPPLY_RECEIPT";
      sku: string;
      qty: number;
      day: number;
    }
  | {
      type: "DEMAND_CONSUMPTION";
      sku: string;
      qty: number;
      day: number;
    }
  | {
      type: "STOCKOUT";
      sku: string;
      missing: number;
      day: number;
    };

export function propagateTime(
  snapshot: TwinSnapshot,
  days: number
): PropagationResult {

  const working = deepClone(snapshot);

  const events: PropagationEvent[] = [];

  const startDay = 0;
  const endDay = startDay + days;

  for (let day = startDay; day < endDay; day++) {

    // --------------------------------------------------
    // SUPPLIER RECEIPTS
    // --------------------------------------------------

    for (const s of working.supply) {

      if (!s.etaDate) continue;

      const etaDay = dateToDayOffset(snapshot.created_at, s.etaDate);

      if (etaDay !== day) continue;

      const inv = findInventory(working, s.sku);

      inv.onHand += s.qty;

      events.push({

        type: "SUPPLY_RECEIPT",

        sku: s.sku,

        qty: s.qty,

        day,

      });

    }

    // --------------------------------------------------
    // DEMAND CONSUMPTION
    // --------------------------------------------------

    for (const order of working.orders) {

      const dueDay = order.dueDate
        ? dateToDayOffset(snapshot.created_at, order.dueDate)
        : day;

      if (dueDay !== day) continue;

      const inv = findInventory(working, order.sku);

      if (inv.onHand >= order.qty) {

        inv.onHand -= order.qty;

        events.push({

          type: "DEMAND_CONSUMPTION",

          sku: order.sku,

          qty: order.qty,

          day,

        });

      } else {

        const missing = order.qty - inv.onHand;

        inv.onHand = 0;

        events.push({

          type: "STOCKOUT",

          sku: order.sku,

          missing,

          day,

        });

      }

    }

  }

  return {

    snapshot: working,

    events,

  };

}

// ======================================================
// Helpers
// ======================================================

function findInventory(snapshot: TwinSnapshot, sku: string) {

  let row = snapshot.inventory.find((x) => x.sku === sku);

  if (!row) {

    row = { sku, onHand: 0 };

    snapshot.inventory.push(row);

  }

  return row;

}

function deepClone<T>(x: T): T {

  return JSON.parse(JSON.stringify(x));

}

function dateToDayOffset(origin: string, target: string): number {

  const o = new Date(origin).getTime();
  const t = new Date(target).getTime();

  if (!Number.isFinite(o) || !Number.isFinite(t)) return 0;

  const diff = t - o;

  return Math.floor(diff / (24 * 3600 * 1000));

}