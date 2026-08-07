import { describe, expect, it } from "vitest";
import { runOptimizerV1 } from "../optimizer";
import { milpRefineV1 } from "../milp.refine.v1";
import { buildActionsFromRealityV2 } from "../../../execution/action.builder.v2";
import {
  isMovementRealizedAt,
  mergeInventoryWithReconstruction,
} from "../../../reconstruction/inventory.reconstruction";
import { normalizeMovements } from "../../../normalization/movements.normalizer";
import { resolveCapabilityFinal } from "../../../execution/resolveCapability.final";
import type { CandidatePlan, OptimizerInput } from "../contracts";

const AS_OF = "2026-08-07T12:00:00.000Z";

describe("OB-FIX-WU1 operational balance boundaries", () => {
  it.each([
    ["IN", 10, 10],
    ["OUT", 10, -10],
    ["IN", -10, 10],
    ["OUT", -10, -10],
  ])("applies canonical %s direction once for raw quantity %s", (type, qty, expected) => {
    const movements = normalizeMovements([{ sku: "A", type, qty, date: AS_OF }]);
    expect(mergeInventoryWithReconstruction([], movements, AS_OF)).toEqual([
      { sku: "A", qty: expected },
    ]);
  });

  it("uses an inclusive asOf boundary and excludes future or malformed dated effects", () => {
    const movements = normalizeMovements([
      { sku: "A", type: "IN", qty: 20, date: "2026-08-07T11:59:59.000Z" },
      { sku: "A", type: "OUT", qty: 10, date: AS_OF },
      { sku: "A", type: "IN", qty: 50, date: "2026-08-07T12:00:01.000Z" },
      { sku: "A", type: "OUT", qty: 90, date: "not-a-date" },
      { sku: "A", type: "IN", qty: 5 },
    ]);

    expect(isMovementRealizedAt(movements[1]!, AS_OF)).toBe(true);
    expect(isMovementRealizedAt(movements[2]!, AS_OF)).toBe(false);
    expect(isMovementRealizedAt(movements[3]!, AS_OF)).toBe(false);
    expect(isMovementRealizedAt(movements[4]!, AS_OF)).toBe(true);
    expect(mergeInventoryWithReconstruction([{ sku: "A", qty: 100 }], movements, AS_OF))
      .toEqual([{ sku: "A", qty: 115 }]);
    expect(() => mergeInventoryWithReconstruction([], movements, "invalid"))
      .toThrow("INVALID_INVENTORY_AS_OF");
  });

  it("does not reapply movements when effective inventory enters action generation", () => {
    const movements = normalizeMovements([
      { sku: "A", type: "IN", qty: 20, date: AS_OF },
      { sku: "A", type: "OUT", qty: 10, date: AS_OF },
    ]);
    const effective = mergeInventoryWithReconstruction(
      [{ sku: "A", qty: 100 }],
      movements,
      AS_OF,
    );
    expect(effective).toEqual([{ sku: "A", qty: 110 }]);

    const actions = buildActionsFromRealityV2({
      requestId: "balance-once",
      plan: "JUNIOR",
      asOf: AS_OF,
      orders: [{ orderId: "O1", sku: "A", qty: 115 }],
      inventory: effective,
      movements,
      baseline_metrics: {},
      scenario_metrics: {},
    });
    expect(actions[0]).toMatchObject({ kind: "EXPEDITE_SUPPLIER", sku: "A" });
    expect((actions[0] as any).qty).toBeLessThanOrEqual(5);
  });

  it("preserves graph delay as unresolved deferment rather than production supply", async () => {
    const result = await runOptimizerV1({
      requestId: "graph-deferment",
      plan: "JUNIOR",
      asOf: AS_OF,
      orders: [{ orderId: "O1", sku: "FG", qty: 100 }],
      inventory: [{ sku: "C", qty: 0 }],
      movements: [],
      baseline_metrics: {},
      scenario_metrics: {},
      inferredBom: [{ parent: "FG", component: "C", ratio: 1 }],
      operationalTopology: {
        nodes: [{ id: "FG", kind: "ORDER" }, { id: "C", kind: "MATERIAL" }, { id: "S", kind: "SUPPLIER" }],
        edges: [{ from: "C", to: "FG", relation: "consumes", weight: 1 }, { from: "S", to: "C", relation: "supplies", weight: 1 }],
      },
      topologyConfidence: 0.8,
      realitySnapshot: { awareness_level: 1 },
      budget: { maxEvals: 1, maxMillis: 1000, allowMilp: false },
    });

    expect(result.meta.engine).toBe("OPT_V1_GRAPH");
    expect(result.best.advisories[0]).toMatchObject({
      kind: "DEFERRED_REQUIREMENT",
      sku: "C",
      source: "GRAPH",
      realizationStatus: "UNRESOLVED",
      executable: false,
    });
    expect(result.best.advisories[0]).not.toHaveProperty("orderId");
    expect(result.best.advisories[0]).not.toHaveProperty("shiftDays");
    expect(result.best.actions).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: expect.stringContaining("delay_substitute") }),
    ]));
  });

  it("keeps MILP delay advisory-only and normalizes only proven expedite fields", async () => {
    const best: CandidatePlan = {
      id: "candidate",
      actions: [{ kind: "EXPEDITE_SUPPLIER", sku: "A", qty: 120, costFactor: 1.4 }],
      advisories: [],
      feasibleHard: true,
      softViolations: [],
      kpis: {},
      score: 999,
      evidence: {
        constraintsUsed: {
          allowSplitAcrossSuppliers: true,
          allowEarlyRelease: true,
          maxRescheduleDays: 14,
          maxExpeditePercent: 1,
          freezeHorizonDays: 2,
        },
        weightsUsed: { lateness: 3, shortage: 10, inventory: 0.7, stability: 1.2, cost: 1.5, service: 4, context: 2 },
        evalSteps: [],
      },
    };
    const input = {
      requestId: "milp-deferment",
      plan: "PRINCIPAL",
      asOf: AS_OF,
      orders: [],
      inventory: [{ sku: "A", qty: 0 }],
      movements: [],
      baseline_metrics: {},
      scenario_metrics: {},
    } satisfies OptimizerInput;

    const refined = await milpRefineV1(input, best);
    expect(refined.actions.every((action) => "kind" in action && !("action" in action))).toBe(true);
    expect(refined.actions[0]).toMatchObject({ kind: "EXPEDITE_SUPPLIER", costFactor: 1.4 });
    expect(refined.advisories[0]).toMatchObject({ source: "MILP", executable: false });
    expect(refined.advisories[0]).not.toHaveProperty("orderId");
  });

  it("blocks unresolved deferment before fuzzy capability resolution", async () => {
    await expect(resolveCapabilityFinal({
      action: {
        type: "DEFERRED_REQUIREMENT",
        executable: false,
        sku: "A",
        qty: 10,
      } as any,
      plan: "SENIOR",
    })).resolves.toEqual({ capabilityId: null, candidates: [], scoring: [] });
  });
});
