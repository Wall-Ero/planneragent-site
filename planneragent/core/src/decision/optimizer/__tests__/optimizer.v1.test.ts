// core/src/decision/optimizer/__tests__test.optimizer.v1.ts
// ======================================================
// PlannerAgent Optimizer v1 — Local Test
// Canonical Source of Truth
// ======================================================

import { runOptimizerV1 } from "../optimizer";

async function runTest() {

  const input = {

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

  console.log("Optimizer result:");
  console.log(JSON.stringify(result, null, 2));

}

runTest();