// core/src/simulation/scenario.runner.ts
// ======================================================
// PlannerAgent — Scenario Runner
// Canonical Source of Truth
//
// Purpose
// Run deterministic what-if scenarios on top of a twin
// snapshot without mutating source reality.
//
// Scenarios can change:
// - supplier delays
// - available inventory
// - demand
// - BOM reference
// ======================================================

import type { TwinSnapshot, TwinBomEdge } from "./twin.snapshot";

export type ScenarioChange =
  | {
      type: "SUPPLIER_DELAY";
      sku: string;
      days: number;
    }
  | {
      type: "INVENTORY_OVERRIDE";
      sku: string;
      onHand: number;
    }
  | {
      type: "DEMAND_OVERRIDE";
      sku: string;
      qty: number;
    }
  | {
      type: "BOM_OVERRIDE";
      bom: TwinBomEdge[];
    };

export type ScenarioRunResult = {
  snapshot: TwinSnapshot;
  applied_changes: ScenarioChange[];
  signals: string[];
};

export function runScenario(params: {
  snapshot: TwinSnapshot;
  changes: ScenarioChange[];
}): ScenarioRunResult {
  const base = deepClone(params.snapshot);
  const signals: string[] = [];

  for (const change of params.changes ?? []) {
    if (change.type === "SUPPLIER_DELAY") {
      for (const s of base.supply) {
        if (s.sku !== change.sku) continue;
        if (!s.etaDate) continue;

        const shifted = addDaysIso(s.etaDate, change.days);
        s.etaDate = shifted;
      }

      signals.push(`scenario:supplier_delay:${change.sku}:${change.days}`);
    }

    if (change.type === "INVENTORY_OVERRIDE") {
      const row = base.inventory.find((x) => x.sku === change.sku);

      if (row) {
        row.onHand = change.onHand;
      } else {
        base.inventory.push({
          sku: change.sku,
          onHand: change.onHand,
        });
      }

      signals.push(`scenario:inventory_override:${change.sku}:${change.onHand}`);
    }

    if (change.type === "DEMAND_OVERRIDE") {
      const rows = base.orders.filter((x) => x.sku === change.sku);

      if (rows.length === 0) {
        base.orders.push({
          orderId: `SCENARIO_${change.sku}`,
          sku: change.sku,
          qty: change.qty,
        });
      } else {
        for (const row of rows) {
          row.qty = change.qty;
        }
      }

      signals.push(`scenario:demand_override:${change.sku}:${change.qty}`);
    }

    if (change.type === "BOM_OVERRIDE") {
      base.bom = [...change.bom];
      signals.push(`scenario:bom_override:${change.bom.length}`);
    }
  }

  return {
    snapshot: base,
    applied_changes: [...(params.changes ?? [])],
    signals,
  };
}

function addDaysIso(input: string, days: number): string {
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return input;
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString();
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
