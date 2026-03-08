// core/src/reality/reality.builder.ts
// ======================================================
// PlannerAgent — Reality Builder
// Canonical Source of Truth
//
// Responsibilities
// - Build observed reality
// - Reconstruct PLAN BOM from orders
// - Reconstruct REALITY BOM from production movements
// - Fuse MASTER / PLAN / REALITY BOM knowledge
// - Register assumptions
// - Produce Twin Snapshot
// ======================================================

import { computeDataAwarenessLevel } from "./reality.level";
import { AssumptionRegistry } from "./assumption.registry";
import { createRealitySnapshot } from "./reality.snapshot";

import { inferBomFromOrders } from "../sandbox/reality/inferBomFromOrders.v1";
import { inferBomFromProduction } from "../sandbox/reality/inferBomFromProduction.v1";
import { comparePlanReality } from "../sandbox/reality/planRealityDiff.v1";

import { fuseReality } from "./reality.fusion";
import { createTwinSnapshot } from "../simulation/twin.snapshot";

type AnyRow = Record<string, unknown>;

function flattenPlanBom(
  rows: Array<{
    parent: string;
    components: Array<{ component: string; ratio: number }>;
  }>
): Array<{ parent: string; component: string; ratio: number }> {
  return (rows ?? []).flatMap((p) =>
    (p.components ?? []).map((c) => ({
      parent: p.parent,
      component: c.component,
      ratio: c.ratio,
    }))
  );
}

function flattenRealityBom(
  rows: Array<{
    parent: string;
    components: Array<{ component: string; median_ratio: number }>;
  }>
): Array<{ parent: string; component: string; ratio: number }> {
  return (rows ?? []).flatMap((p) =>
    (p.components ?? []).map((c) => ({
      parent: p.parent,
      component: c.component,
      ratio: c.median_ratio,
    }))
  );
}

function normalizeMasterBom(rows: AnyRow[]): Array<{ parent: string; component: string; ratio: number }> {
  return (rows ?? [])
    .map((r) => ({
      parent: String(r?.parent ?? "").trim(),
      component: String(r?.component ?? "").trim(),
      ratio: Number(r?.ratio ?? 0),
    }))
    .filter((r) => r.parent && r.component && Number.isFinite(r.ratio) && r.ratio > 0);
}

export function buildReality(params: {
  orders?: AnyRow[];
  inventory?: AnyRow[];
  movements?: AnyRow[];
  movord?: AnyRow[];
  movmag?: AnyRow[];
  masterBom?: AnyRow[];
}) {
  const assumptions = new AssumptionRegistry();

  const observed = {
    orders: params.orders ?? [],
    inventory: params.inventory ?? [],
    movements: params.movements ?? [],
    movord: params.movord ?? [],
    movmag: params.movmag ?? [],
    master_bom: normalizeMasterBom(params.masterBom ?? []),
  };

  const awareness = computeDataAwarenessLevel({
    orders: params.orders,
    inventory: params.inventory,
    movements: params.movements,
  });

  // --------------------------------------------------
  // PLAN BOM — inferred from production orders
  // --------------------------------------------------

  const planBomResult = inferBomFromOrders((params.movord ?? params.orders ?? []) as any);

  // --------------------------------------------------
  // REALITY BOM — inferred from production movements
  // --------------------------------------------------

  const realityBomResult = inferBomFromProduction(
    (params.movord ?? []) as any,
    (params.movmag ?? params.movements ?? []) as any
  );

  const planBomFlat = flattenPlanBom(planBomResult.bom ?? []);
  const realityBomFlat = flattenRealityBom(realityBomResult.bom ?? []);
  const masterBomFlat = normalizeMasterBom(params.masterBom ?? []);

  // --------------------------------------------------
  // PLAN / REALITY comparison
  // --------------------------------------------------

  const planRealityDiff = comparePlanReality(
    planBomFlat.map((x) => ({
      parent: x.parent,
      component: x.component,
      expected_ratio: x.ratio,
    })),
    realityBomFlat.map((x) => ({
      parent: x.parent,
      component: x.component,
      actual_ratio: x.ratio,
    }))
  );

  // --------------------------------------------------
  // Fusion — no automatic BOM selection
  // --------------------------------------------------

  const fusion = fuseReality({
    masterBom: masterBomFlat,
    planBom: planBomFlat,
    realityBom: realityBomFlat,
  });

  // --------------------------------------------------
  // Assumptions
  // --------------------------------------------------

  const assumed: Record<string, unknown> = {};

  if (!params.orders || params.orders.length === 0) {
    assumed.demand_rate = 100;

    assumptions.add({
      category: "demand",
      value: 100,
      reason: "No orders detected. Using baseline demand assumption.",
    });
  }

  if (!params.inventory || params.inventory.length === 0) {
    assumptions.add({
      category: "stock",
      value: 0,
      reason: "Inventory snapshot unavailable.",
    });
  }

  if ((params.movord?.length ?? 0) === 0 && (params.movmag?.length ?? 0) === 0) {
    assumptions.add({
      category: "bom",
      value: "limited_reconstruction",
      reason: "No production order / movement data available for full BOM reconstruction.",
    });
  }

  // --------------------------------------------------
  // Confidence
  // --------------------------------------------------

  const confidence = {
    stock: params.inventory ? 0.9 : 0.3,
    demand: params.orders ? 0.8 : 0.4,
    lead_time: 0.5,
    bom: fusion.needs_bom_reference_decision ? 0.55 : (planBomFlat.length || realityBomFlat.length || masterBomFlat.length ? 0.85 : 0.2),
  };

  // --------------------------------------------------
  // Twin Snapshot
  // Note:
  // - do not auto-select MASTER / PLAN / REALITY
  // - Twin carries default PLAN view for deterministic simulation
  // - decision responsibility remains external to Reality Builder
  // --------------------------------------------------

  const twinSnapshot = createTwinSnapshot({
    inventory: params.inventory ?? [],
    orders: params.orders ?? [],
    supply: [],
    bom: planBomFlat.map((x) => ({
      parent: x.parent,
      component: x.component,
      ratio: x.ratio,
      source: "PLAN" as const,
    })),
    assumptions: assumptions.list(),
    confidence,
    awareness_level: awareness,
  });

  return createRealitySnapshot({
    observed,
    reconstructed: {
      plan_bom: planBomResult.bom ?? [],
      reality_bom: realityBomResult.bom ?? [],
      plan_reality_diff: planRealityDiff,
    },
    assumed,
    fusion,
    twinSnapshot,
    confidence,
    awareness_level: awareness,
    assumptions,
    signals: [
      ...(planBomResult.signals ?? []),
      ...(realityBomResult.signals ?? []),
      ...(planRealityDiff.signals ?? []),
      ...(fusion.signals ?? []),
    ],
  });
}