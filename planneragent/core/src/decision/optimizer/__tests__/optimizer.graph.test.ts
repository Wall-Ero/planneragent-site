// core/src/decision/optimizer/__tests__/optimizer.graph.test.ts

import { describe, test, expect } from "vitest";
import { runOptimizerV1 } from "../optimizer";

describe("optimizer Graph Mode", () => {

  test("should activate graph optimizer when topology exists", async () => {

    const input = {
      requestId: "graph-test",
      plan: "JUNIOR",

      orders: [
        { orderId: "O1", sku: "FG1", qty: 10, dueDate: "2026-03-10" }
      ],

      inventory: [
        { sku: "COMP_A", onHand: 20 },
        { sku: "COMP_B", onHand: 5 }
      ],

      movements: [
        { sku: "COMP_A", type: "IN", qty: 10 }
      ],

      bom: [
        { parent: "FG1", component: "COMP_A", qty: 2 },
        { parent: "FG1", component: "COMP_B", qty: 1 }
      ]

    };

    const result = await runOptimizerV1(input as any);

    expect(result.ok).toBe(true);
    expect(result.best).toBeDefined();

  });

});