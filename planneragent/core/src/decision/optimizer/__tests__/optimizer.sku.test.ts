import { describe, expect, test } from "vitest";
import { runOptimizerV1 } from "../optimizer";
import type { OptimizerInput } from "../contracts";

describe("Optimizer SKU Mode", () => {

  test("should fallback to SKU optimizer with minimal data", async () => {

    const input: OptimizerInput = {

      requestId: "TEST_SKU",

      plan: "JUNIOR",

      asOf: "2026-01-01T00:00:00.000Z",

      orders: [
        { orderId: "O1", sku: "FG_A", qty: 10 }
      ],

      inventory: [
        { sku: "FG_A", onHand: 0 }
      ],

      movements: [],

      baseline_metrics: {},

      scenario_metrics: {},

      realitySnapshot: {
        awareness_level: 0
      }

    };

    const result = await runOptimizerV1(input);

    expect(result.ok).toBe(true);
    expect(result.best).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.meta.engine).toBe("OPT_V1_SKU");
    expect(result.meta.evalCount).toBeGreaterThan(0);

  });

});
