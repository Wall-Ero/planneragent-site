// core/src/simulation/scenario.runner.ts
// ======================================================
// ======================================================
// PlannerAgent — Scenario Runner v2
// Canonical Source of Truth
//
// Responsibility:
// - run deterministic what-if scenarios
// - apply controlled simulation changes
// - distinguish simulation vs base reality
// - be mode-aware (PLAN_REPAIR / REALITY_CORRECTION)
//
// NON RESPONSIBLE FOR:
// - governance decisions
// - optimizer logic
// - execution
// ======================================================

import type { TwinSnapshot, TwinBomEdge } from "./twin.snapshot";

// ======================================================
// SCENARIO CHANGE MODEL
// ======================================================

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

// ======================================================
// MODE (Phase 0 aligned)
// ======================================================

export type ScenarioMode =
  | "PLAN_REPAIR"
  | "REALITY_CORRECTION";

// ======================================================
// INPUT / OUTPUT
// ======================================================

export type ScenarioRunParams = {
  snapshot: TwinSnapshot;
  changes?: ScenarioChange[];
  mode: ScenarioMode;
};

export type ScenarioRunResult = {
  snapshot: TwinSnapshot;

  applied_changes: ScenarioChange[];

  mode: ScenarioMode;

  // signals deterministici per downstream (DL, UI, governance)
  signals: string[];

  // debug / audit
  simulation_active: boolean;
};

// ======================================================
// MAIN ENTRY
// ======================================================

export function runScenario(
  params: ScenarioRunParams
): ScenarioRunResult {

  const base = deepClone(params.snapshot);

  const signals: string[] = [];

  const changes = params.changes ?? [];

  const simulationActive = changes.length > 0;

  // ------------------------------------------------------
  // SIMULATION FLAG
  // ------------------------------------------------------

  if (simulationActive) {
    signals.push("scenario:simulation_active");
  }

  signals.push(`scenario:mode:${params.mode}`);

  // ------------------------------------------------------
  // APPLY CHANGES (DETERMINISTIC)
  // ------------------------------------------------------

  for (const change of changes) {

    // ----------------------------------------------------
    // SUPPLIER DELAY
    // ----------------------------------------------------

    if (change.type === "SUPPLIER_DELAY") {

      for (const s of base.supply ?? []) {

        if (s.sku !== change.sku) continue;
        if (!s.etaDate) continue;

        const shifted = addDaysIso(s.etaDate, change.days);

        s.etaDate = shifted;
      }

      signals.push(
        `scenario:supplier_delay:${change.sku}:${change.days}`
      );
    }

    // ----------------------------------------------------
    // INVENTORY OVERRIDE
    // ----------------------------------------------------

    if (change.type === "INVENTORY_OVERRIDE") {

      const row = base.inventory.find(
        (x) => x.sku === change.sku
      );

      if (row) {
        row.onHand = change.onHand;
      } else {
        base.inventory.push({
          sku: change.sku,
          onHand: change.onHand
        });
      }

      signals.push(
        `scenario:inventory_override:${change.sku}:${change.onHand}`
      );
    }

    // ----------------------------------------------------
    // DEMAND OVERRIDE
    // ----------------------------------------------------

    if (change.type === "DEMAND_OVERRIDE") {

      const rows = base.orders.filter(
        (x) => x.sku === change.sku
      );

      if (rows.length === 0) {

        base.orders.push({
          orderId: `SCENARIO_${change.sku}`,
          sku: change.sku,
          qty: change.qty
        });

      } else {

        for (const row of rows) {
          row.qty = change.qty;
        }
      }

      signals.push(
        `scenario:demand_override:${change.sku}:${change.qty}`
      );
    }

    // ----------------------------------------------------
    // BOM OVERRIDE
    // ----------------------------------------------------

    if (change.type === "BOM_OVERRIDE") {

      base.bom = [...change.bom];

      signals.push(
        `scenario:bom_override:${change.bom.length}`
      );
    }
  }

  // ------------------------------------------------------
  // MODE-SPECIFIC SIGNALS (NO BEHAVIOR CHANGE)
  // ------------------------------------------------------

  if (params.mode === "PLAN_REPAIR") {
    signals.push("scenario:plan_repair_mode");
  }

  if (params.mode === "REALITY_CORRECTION") {
    signals.push("scenario:reality_correction_mode");
  }

  // ------------------------------------------------------
  // OUTPUT
  // ------------------------------------------------------

  return {
    snapshot: base,
    applied_changes: [...changes],
    mode: params.mode,
    signals,
    simulation_active: simulationActive
  };
}

// ======================================================
// HELPERS
// ======================================================

function addDaysIso(input: string, days: number): string {
  const d = new Date(input);

  if (!Number.isFinite(d.getTime())) return input;

  d.setUTCDate(d.getUTCDate() + Math.round(days));

  return d.toISOString();
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}