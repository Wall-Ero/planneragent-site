// PATH: core/src/decision/optimizer/__tests__/optimizer.shortage.test.ts
// ======================================================
// PlannerAgent — Optimizer Shortage Test
// Forces optimizer to generate corrective actions
// ======================================================

import { describe, test, expect } from "vitest";
import { runOptimizerV1 } from "../optimizer";
import type { OptimizerInput } from "../contracts";

describe("Optimizer shortage intervention", () => {

  test("should generate corrective action when stockout predicted", async () => {

    const input: OptimizerInput = {

      requestId: "shortage-test",
      plan: "JUNIOR",

      asOf: new Date().toISOString(),

      orders: [
        { id: "o1", sku: "A", qty: 1200 }
      ],

      inventory: [
        { sku: "A", qty: 2 }
      ],

      movements: [
        {
          type: "supplier_delivery",
          sku: "A",
          qty: 100,
          lead_time: 14
        }
      ],

      baseline_metrics: {
        service_level: 0.95,
        inventory_turns: 4
      },

      scenario_metrics: {
        service_level: 0.80
      },

      dlSignals: {
        stockout_risk: 0.9
      }

    };

    const result = await runOptimizerV1(input);

    expect(result.ok).toBe(true);

    // deve generare almeno un piano candidato
    expect(result.candidates.length).toBeGreaterThan(0);

    const best = result.best;

    // il piano deve contenere azioni
    expect(best.actions.length).toBeGreaterThan(0);

  });

});