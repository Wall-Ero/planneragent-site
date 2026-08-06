// core/src/decision/optimizer/__tests__test.optimizer.v1.ts
// ======================================================
// PlannerAgent Optimizer v1 — Local Test
// Canonical Source of Truth
// ======================================================

import { describe, expect, test } from "vitest";
import { runOptimizerV1 } from "../optimizer";
import type { OptimizerInput } from "../contracts";

describe("Optimizer v1 deterministic result", () => {

  test("returns a deterministic SKU-mode advisory result", async () => {

  const input: OptimizerInput = {

    requestId: "local-test-1",

    plan: "JUNIOR" as const,

    asOf: "2026-01-01",

    orders: [
      {
        orderId: "SO-1",
        sku: "A",
        qty: 100,
        dueDate: "2026-01-10"
      }
    ],

    inventory: [
      {
        sku: "A",
        qty: 20
      }
    ],

    movements: [],

    baseline_metrics: {},
    scenario_metrics: {},
    constraints_hint: {}

  };

  const result = await runOptimizerV1(input);

  expect(result.ok).toBe(true);
  expect(result.meta.engine).toBe("OPT_V1_SKU");
  expect(result.meta.deterministicSeed).toBeDefined();
  expect(result.candidates.length).toBeGreaterThan(0);
  expect(result.best).toBeDefined();

  });

});
