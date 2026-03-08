// core/src/reality/reality.fusion.ts
// ======================================================
// PlannerAgent — Reality Fusion
// Canonical Source of Truth
//
// Purpose
// Merge reality knowledge from multiple sources without
// automatically deciding which BOM should drive
// optimization.
//
// Sources:
// - MASTER BOM
// - PLAN BOM
// - REALITY BOM
//
// Output:
// - fused awareness object
// - divergence flags
// - explicit decision requirement for SCM when needed
// ======================================================

export type BomComponentRow = {
  parent: string;
  component: string;
  ratio: number;
};

export type BomSourceName = "MASTER" | "PLAN" | "REALITY";

export type RealityFusionResult = {
  master_bom: BomComponentRow[];
  plan_bom: BomComponentRow[];
  reality_bom: BomComponentRow[];

  divergence: {
    master_vs_plan: boolean;
    plan_vs_reality: boolean;
    master_vs_reality: boolean;
  };

  needs_bom_reference_decision: boolean;

  signals: string[];
};

export function fuseReality(params: {
  masterBom?: BomComponentRow[];
  planBom?: BomComponentRow[];
  realityBom?: BomComponentRow[];
}): RealityFusionResult {
  const master_bom = normalizeBom(params.masterBom ?? []);
  const plan_bom = normalizeBom(params.planBom ?? []);
  const reality_bom = normalizeBom(params.realityBom ?? []);

  const master_vs_plan = !sameBom(master_bom, plan_bom);
  const plan_vs_reality = !sameBom(plan_bom, reality_bom);
  const master_vs_reality = !sameBom(master_bom, reality_bom);

  const signals: string[] = [];

  if (master_vs_plan) signals.push("bom_conflict:MASTER_vs_PLAN");
  if (plan_vs_reality) signals.push("bom_conflict:PLAN_vs_REALITY");
  if (master_vs_reality) signals.push("bom_conflict:MASTER_vs_REALITY");

  const needs_bom_reference_decision =
    (master_bom.length > 0 || plan_bom.length > 0 || reality_bom.length > 0) &&
    (master_vs_plan || plan_vs_reality || master_vs_reality);

  if (needs_bom_reference_decision) {
    signals.push("bom_reference_decision_required");
  }

  return {
    master_bom,
    plan_bom,
    reality_bom,
    divergence: {
      master_vs_plan,
      plan_vs_reality,
      master_vs_reality,
    },
    needs_bom_reference_decision,
    signals,
  };
}

function sameBom(a: BomComponentRow[], b: BomComponentRow[]): boolean {
  if (a.length === 0 && b.length === 0) return true;
  if (a.length !== b.length) return false;

  const aa = sortBom(a);
  const bb = sortBom(b);

  for (let i = 0; i < aa.length; i++) {
    const x = aa[i]!;
    const y = bb[i]!;

    if (x.parent !== y.parent) return false;
    if (x.component !== y.component) return false;
    if (round3(x.ratio) !== round3(y.ratio)) return false;
  }

  return true;
}

function normalizeBom(rows: BomComponentRow[]): BomComponentRow[] {
  return rows
    .map((r) => ({
      parent: String(r?.parent ?? "").trim(),
      component: String(r?.component ?? "").trim(),
      ratio: num(r?.ratio, 0),
    }))
    .filter((r) => r.parent && r.component && r.ratio > 0);
}

function sortBom(rows: BomComponentRow[]): BomComponentRow[] {
  return [...rows].sort((a, b) => {
    if (a.parent !== b.parent) return a.parent.localeCompare(b.parent);
    if (a.component !== b.component) return a.component.localeCompare(b.component);
    return a.ratio - b.ratio;
  });
}

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}