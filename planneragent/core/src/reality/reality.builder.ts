// core/src/reality/reality.builder.ts
// ======================================================
// PlannerAgent — Reality Builder
// Canonical Source of Truth (FIXED + STABLE)
// ======================================================

import { computeDataAwarenessLevel } from "./reality.level";
import { computeRealityScore } from "./reality.score";
import { AssumptionRegistry } from "./assumption.registry";
import { createRealitySnapshot } from "./reality.snapshot";
import { computeBomDivergence } from "./planRealityToDivergence.v1";

import { inferBomFromOrders } from "../sandbox/reality/inferBomFromOrders.v1";
import { inferBomFromProduction } from "../sandbox/reality/inferBomFromProduction.v1";
import { comparePlanReality } from "../sandbox/reality/planRealityDiff.v1";

import { fuseReality } from "./reality.fusion";
import { createTwinSnapshot } from "../simulation/twin.snapshot";

import { computeProcessInstability } from "./process.instability.v1";

type AnyRow = Record<string, unknown>;

// ======================================================
// TYPES
// ======================================================

type BuildRealityParams = {
  orders?: AnyRow[];
  inventory?: AnyRow[];
  movements?: AnyRow[];

  movord?: AnyRow[];
  movmag?: AnyRow[];
  masterBom?: AnyRow[];
};

// ======================================================
// HELPERS
// ======================================================

function flattenPlanBom(rows: any[]) {
  return (rows ?? []).flatMap((p) =>
    (p.components ?? []).map((c: any) => ({
      parent: p.parent,
      component: c.component,
      ratio: c.ratio,
    }))
  );
}

function flattenRealityBom(rows: any[]) {
  return (rows ?? []).flatMap((p) =>
    (p.components ?? []).map((c: any) => ({
      parent: p.parent,
      component: c.component,
      ratio: c.median_ratio,
    }))
  );
}

function normalizeMasterBom(rows: AnyRow[]) {
  return (rows ?? [])
    .map((r) => ({
      parent: String(r?.parent ?? "").trim(),
      component: String(r?.component ?? "").trim(),
      ratio: Number(r?.ratio ?? 0),
    }))
    .filter((r) => r.parent && r.component && r.ratio > 0);
}

// ======================================================
// MAIN
// ======================================================

export function buildReality(params: BuildRealityParams) {
  const assumptions = new AssumptionRegistry();

  // ------------------------------------------------------
  // DATA AWARENESS
  // ------------------------------------------------------

  const awareness = computeDataAwarenessLevel({
    orders: params.orders,
    inventory: params.inventory,
    movements: params.movements,
  });

  // ------------------------------------------------------
  // OBSERVED
  // ------------------------------------------------------

  const observed = {
    orders: params.orders ?? [],
    inventory: params.inventory ?? [],
    movements: params.movements ?? [],
    movord: params.movord ?? [],
    movmag: params.movmag ?? [],
    master_bom: normalizeMasterBom(params.masterBom ?? []),
  };

  // ------------------------------------------------------
  // BOM INFERENCE
  // ------------------------------------------------------

  const planBomResult = inferBomFromOrders(
    (params.movord ?? params.orders ?? []) as any
  );

  const realityBomResult = inferBomFromProduction(
    (params.movord ?? []) as any,
    (params.movmag ?? params.movements ?? []) as any
  );

  const planBomFlat = flattenPlanBom(planBomResult.bom ?? []);
  const realityBomFlat = flattenRealityBom(realityBomResult.bom ?? []);
  const masterBomFlat = normalizeMasterBom(params.masterBom ?? []);

  // ------------------------------------------------------
  // PLAN vs REALITY
  // ------------------------------------------------------

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

  const divergence = computeBomDivergence(planRealityDiff);

  const instability = computeProcessInstability({
    realityBom: realityBomResult.bom ?? [],
  });

  // ------------------------------------------------------
  // FUSION
  // ------------------------------------------------------

  const fusion = fuseReality({
    masterBom: masterBomFlat,
    planBom: planBomFlat,
    realityBom: realityBomFlat,
  });

  // ------------------------------------------------------
  // ASSUMPTIONS
  // ------------------------------------------------------

  if (!params.orders?.length) {
    assumptions.add({
      category: "demand",
      value: 100,
      reason: "No orders detected",
    });
  }

  if (!params.inventory?.length) {
    assumptions.add({
      category: "stock",
      value: 0,
      reason: "No inventory snapshot",
    });
  }

  const hasBehavioralData =
    (params.movord?.length ?? 0) > 0 &&
    (params.movmag?.length ?? 0) > 0;

  if (!hasBehavioralData) {
    assumptions.add({
      category: "bom",
      value: "limited_reconstruction",
      reason: "No production data",
    });
  }

  // ------------------------------------------------------
  // ASSUMED
  // ------------------------------------------------------

  const assumed: Record<string, unknown> = {};

  for (const a of assumptions.list()) {
    assumed[a.category] = a.value;
  }

  // ------------------------------------------------------
  // BOM CONFIDENCE
  // ------------------------------------------------------

  const bomConfidenceFromReality =
    (realityBomResult.bom ?? []).length > 0
      ? realityBomResult.bom.reduce(
          (s, b) => s + (b.confidence ?? 0),
          0
        ) / realityBomResult.bom.length
      : 0;

  const safeBomConfidence = isFinite(bomConfidenceFromReality)
    ? bomConfidenceFromReality
    : 0;

  // ------------------------------------------------------
  // CONFIDENCE MAP
  // ------------------------------------------------------

  const confidence = {
    stock: params.inventory ? 0.9 : 0.3,
    demand: params.orders ? 0.8 : 0.4,
    lead_time: 0.5,
    bom: hasBehavioralData
      ? safeBomConfidence
      : fusion.needs_bom_reference_decision
      ? 0.55
      : 0.85,
  };

  // ------------------------------------------------------
  // REALITY SCORE
  // ------------------------------------------------------

  const realityScore = computeRealityScore({
    awareness_level: awareness,
    confidence,
    assumptions: assumptions.list(),
    bom_divergence: {
      master_vs_plan: fusion.divergence.master_vs_plan,
      plan_vs_reality: divergence,
      master_vs_reality: fusion.divergence.master_vs_reality,
    },
    topology_confidence: undefined,
  });

  // ------------------------------------------------------
  // TWIN
  // ------------------------------------------------------

  const twinSnapshot = createTwinSnapshot({
    inventory: params.inventory ?? [],
    orders: params.orders ?? [],
    supply: [],
    bom: planBomFlat,
    assumptions: assumptions.list(),
    confidence,
    awareness_level: awareness,
  });

  // ------------------------------------------------------
  // SNAPSHOT
  // ------------------------------------------------------

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

    reality_score: realityScore,

    process_instability: instability,

    bom_divergence: {
      master_vs_plan: fusion.divergence.master_vs_plan,
      plan_vs_reality: divergence,
      master_vs_reality: fusion.divergence.master_vs_reality,
    },

    signals: [
      ...(planBomResult.signals ?? []),
      ...(realityBomResult.signals ?? []),
      ...(planRealityDiff.signals ?? []),
      ...(fusion.signals ?? []),
      ...(instability.unstable_components > 0
        ? [`process_instability:${instability.overall_instability}`]
        : []),
    ],
  });
}