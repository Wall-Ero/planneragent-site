// core/src/sandbox/__tests__/twin.deterministic.e2e.test.ts
// ======================================================
// PlannerAgent — Twin Deterministic E2E Test
// Canonical Source of Truth
//
// Verifies end-to-end deterministic path:
//
// Reality Builder
// → Fusion
// → Twin Snapshot
// → Topology
// → Optimizer
// ======================================================

import { describe, test, expect } from "vitest";

import { buildReality } from "../../reality/reality.builder";
import { buildOperationalTopology } from "../../topology/topology.builder";
import { computeTopologyConfidence } from "../../topology/topology.confidence";
import { runOptimizerV1 } from "../../decision/optimizer";

describe("Twin deterministic e2e", () => {
  test("should build reality, detect BOM conflict, build topology, and run optimizer deterministically", async () => {
    const orders = [
      { orderId: "SO_1", sku: "FG_A", qty: 10, dueDate: "2026-03-20" },
    ];

    const inventory = [
      { sku: "COMP_X", onHand: 5 },
      { sku: "COMP_Y", onHand: 3 },
    ];

    const movord = [
      { order: "OP_1", article: "FG_A", quantity: 10, type: "PRODUCTION" },
      { order: "CMT_1", parentOrder: "OP_1", article: "COMP_X", quantity: 20, type: "COMMITMENT" },
      { order: "CMT_2", parentOrder: "OP_1", article: "COMP_Y", quantity: 10, type: "COMMITMENT" },
    ];

    const movmag = [
      { order: "OP_1", article: "COMP_X", quantity: -25, type: "OUT" },
      { order: "OP_1", article: "COMP_Y", quantity: -10, type: "OUT" },
      { order: "OP_1", article: "FG_A", quantity: 10, type: "IN" },
    ];

    const masterBom = [
      { parent: "FG_A", component: "COMP_X", ratio: 2 },
      { parent: "FG_A", component: "COMP_Y", ratio: 1 },
    ];

    const reality = buildReality({
      orders,
      inventory,
      movord,
      movmag,
      masterBom,
    });

    expect(reality).toBeDefined();
    expect((reality as any).fusion).toBeDefined();
    expect((reality as any).twinSnapshot).toBeDefined();

    const topology = buildOperationalTopology({
      orders: (reality as any).twinSnapshot.orders,
      inventory: (reality as any).twinSnapshot.inventory,
      movements: [],
      inferredBom: (reality as any).twinSnapshot.bom,
    });

    const confidence = computeTopologyConfidence({
      nodes: topology.nodes,
      edges: topology.edges,
    });

    expect(confidence.confidence).toBeGreaterThan(0);

    const result = await runOptimizerV1({
      requestId: "E2E_TWIN_1",
      plan: "JUNIOR",
      asOf: new Date().toISOString(),

      orders: (reality as any).twinSnapshot.orders,
      inventory: (reality as any).twinSnapshot.inventory,
      movements: [],

      baseline_metrics: {},
      scenario_metrics: {},
      constraints_hint: {},
      dlSignals: {},

      inferredBom: (reality as any).twinSnapshot.bom,
      realitySnapshot: reality,
      operationalTopology: topology,
      topologyConfidence: confidence.confidence,
    } as any);

    expect(result.ok).toBe(true);
    expect(result.best).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
  });
});
