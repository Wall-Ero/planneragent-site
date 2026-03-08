// core/src/sandbox/__tests__/bom.reconstruction.test.ts

import { describe, test, expect } from "vitest";
import { inferBomFromProduction } from "../reality/inferBomFromProduction.v1";

describe("BOM Reconstruction", () => {

  test("should infer component usage from production movements", () => {

    const movord = [
      { order: "MO1", article: "FG1", quantity: 10, type: "PRODUCTION" }
    ];

    const movmag = [
      { order: "MO1", article: "COMP_A", quantity: -20, type: "OUT" },
      { order: "MO1", article: "COMP_B", quantity: -10, type: "OUT" },
      { order: "MO1", article: "FG1", quantity: 10, type: "IN" }
    ];

    const result = inferBomFromProduction(movord as any, movmag as any);

    expect(result.bom.length).toBeGreaterThan(0);

    const fg = result.bom.find(b => b.parent === "FG1");

    const compA = fg.components.find(c => c.component === "COMP_A");
    const compB = fg.components.find(c => c.component === "COMP_B");

    expect(compA.median_ratio).toBeCloseTo(2);
    expect(compB.median_ratio).toBeCloseTo(1);

  });

});