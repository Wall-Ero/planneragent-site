import { runOptimizerV1 } from "../optimizer";

describe("Optimizer SKU Mode", () => {

  test("should fallback to SKU optimizer with minimal data", async () => {

    const result = await runOptimizerV1({

      requestId: "TEST_SKU",

      plan: "JUNIOR",

      orders: [
        { orderId: "O1", sku: "FG_A", qty: 10 }
      ],

      inventory: [
        { sku: "FG_A", onHand: 0 }
      ],

      realitySnapshot: {
        awareness_level: 0
      }

    } as any);

    expect(result.ok).toBe(true);
    expect(result.best).toBeDefined();

  });

});
