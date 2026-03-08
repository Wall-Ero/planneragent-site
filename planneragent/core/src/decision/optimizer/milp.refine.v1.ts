// core/src/decision/optimizer/milp.refine.v1.ts
// ======================================================
// PlannerAgent — MILP Refine v1
// Canonical Source of Truth
//
// Purpose
// Improve the best heuristic candidate plan using
// a deterministic MILP-style refinement pass.
//
// This module does NOT replace the optimizer.
// It refines the best plan already discovered by:
//   generator
//   evaluate
//   local search
//
// It is also:
// - assumption-aware
// - topology-aware
// - deterministic
// - no LLM
// ======================================================

import type { OptimizerInput, CandidatePlan } from "./contracts";

// ------------------------------------------------------
// Types
// ------------------------------------------------------

type MilpVariable = {
  sku: string;
  required: number;
  onHand: number;
  shortage: number;
  expedite: number;
  delay: number;
};

type MilpRefineResult = {
  variables: MilpVariable[];
  objective: number;
};

type ActionLike = {
  action?: string;
  kind?: string;
  sku?: string;
  qty?: number;
};

// ------------------------------------------------------
// Entry
// ------------------------------------------------------

export async function milpRefineV1(
  input: OptimizerInput,
  best: CandidatePlan
): Promise<CandidatePlan> {
  const demand = extractDemand(best);
  const inventory = input.inventory ?? [];

  if (demand.length === 0) {
    return best;
  }

  const variables = buildVariables(demand, inventory);
  const result = solveMilpDeterministic(
    variables,
    input
  );

  const refinedActions = buildActions(result.variables);

  if (refinedActions.length === 0) {
    return best;
  }

  const refinedScore = normalizeObjective(result.objective);

  // keep best if refinement is actually worse
  if (refinedScore >= best.score && best.actions.length > 0) {
    return best;
  }

  return {
    ...best,
    id: `${best.id}-milp`,
    actions: refinedActions as any,
    score: Math.min(best.score, refinedScore),
    evidence: {
      ...best.evidence,
      evalSteps: [
        ...best.evidence.evalSteps,
        "milp:v1:refine_applied",
        `milp:v1:objective=${round3(result.objective)}`,
      ],
    },
  };
}

// ------------------------------------------------------
// Demand extraction
// ------------------------------------------------------

function extractDemand(best: CandidatePlan): Array<{ sku: string; qty: number }> {
  const demand: Array<{ sku: string; qty: number }> = [];

  for (const a of best.actions ?? []) {
    const action = a as unknown as ActionLike;
    const sku = String(action.sku ?? "").trim();
    const qty = Number(action.qty ?? 0);

    if (!sku || qty <= 0) continue;

    demand.push({
      sku,
      qty,
    });
  }

  return demand;
}

// ------------------------------------------------------
// Variable builder
// ------------------------------------------------------

function buildVariables(
  demand: Array<{ sku: string; qty: number }>,
  inventory: any[]
): MilpVariable[] {
  const vars: MilpVariable[] = [];

  for (const d of demand) {
    const inv = inventory.find(
      (i) => (i?.sku ?? i?.article) === d.sku
    );

    const onHand =
      num(inv?.onHand, NaN) ||
      num(inv?.on_hand, NaN) ||
      num(inv?.qty, 0);

    const shortage = Math.max(0, d.qty - onHand);

    vars.push({
      sku: d.sku,
      required: d.qty,
      onHand,
      shortage,
      expedite: 0,
      delay: 0,
    });
  }

  return vars;
}

// ------------------------------------------------------
// Deterministic MILP-style solve
// ------------------------------------------------------

function solveMilpDeterministic(
  vars: MilpVariable[],
  input: OptimizerInput
): MilpRefineResult {
  const awarenessPenalty = computeAwarenessPenalty(input);
  const topologyDegrees = buildTopologyDegreeMap(input);

  for (const v of vars) {
    if (v.shortage <= 0) continue;

    const degree = topologyDegrees.get(v.sku) ?? 0;
    const topologyPenalty = degree === 0 ? 0.25 : degree <= 1 ? 0.15 : 0;

    const combinedPenalty = awarenessPenalty + topologyPenalty;

    // The more uncertainty / weaker topology,
    // the less aggressively we expedite.
    if (v.shortage <= 30) {
      const expediteShare = combinedPenalty > 0.8 ? 0.6 : 1.0;
      v.expedite = Math.round(v.shortage * expediteShare);
      v.delay = v.shortage - v.expedite;
      continue;
    }

    if (v.shortage <= 100) {
      let expediteShare = 0.7;

      if (combinedPenalty > 1.0) expediteShare = 0.45;
      else if (combinedPenalty > 0.6) expediteShare = 0.55;

      v.expedite = Math.round(v.shortage * expediteShare);
      v.delay = v.shortage - v.expedite;
      continue;
    }

    let expediteShare = 0.5;

    if (combinedPenalty > 1.0) expediteShare = 0.3;
    else if (combinedPenalty > 0.6) expediteShare = 0.4;

    v.expedite = Math.round(v.shortage * expediteShare);
    v.delay = v.shortage - v.expedite;
  }

  const objective = computeObjective(vars, input);

  return {
    variables: vars,
    objective,
  };
}

// ------------------------------------------------------
// Objective function
// ------------------------------------------------------

function computeObjective(
  vars: MilpVariable[],
  input: OptimizerInput
): number {
  const weights = {
    shortage: 10,
    expedite: 3,
    delay: 2,
    inventory: 0.5,
    awareness: 8,
    topology: 5,
  };

  const awarenessPenalty = computeAwarenessPenalty(input);
  const topologyDegrees = buildTopologyDegreeMap(input);

  let score = 0;

  for (const v of vars) {
    const residualShortage =
      Math.max(0, v.required - (v.onHand + v.expedite + v.delay));

    score += residualShortage * weights.shortage;
    score += v.expedite * weights.expedite;
    score += v.delay * weights.delay;

    const excess = Math.max(0, v.onHand - v.required);
    score += excess * weights.inventory;

    // awareness affects all refined variables
    score += awarenessPenalty * weights.awareness;

    const degree = topologyDegrees.get(v.sku) ?? 0;

    if (degree === 0) {
      score += 1 * weights.topology;
    } else if (degree === 1) {
      score += 0.5 * weights.topology;
    }
  }

  return score;
}

// ------------------------------------------------------
// Context penalty helpers
// ------------------------------------------------------

function computeAwarenessPenalty(input: OptimizerInput): number {
  const assumptions = input.realitySnapshot?.assumptions ?? [];
  const awareness = num(input.realitySnapshot?.awareness_level, 0);

  let penalty = 0;

  if (assumptions.length > 0) {
    penalty += Math.min(1.5, assumptions.length * 0.15);
  }

  if (awareness <= 0) penalty += 1.0;
  else if (awareness === 1) penalty += 0.6;
  else if (awareness === 2) penalty += 0.2;

  return round3(penalty);
}

function buildTopologyDegreeMap(input: OptimizerInput): Map<string, number> {
  const out = new Map<string, number>();

  const topology = input.operationalTopology;
  if (!topology || !Array.isArray(topology.edges)) {
    return out;
  }

  for (const e of topology.edges) {
    out.set(e.from, (out.get(e.from) ?? 0) + 1);
    out.set(e.to, (out.get(e.to) ?? 0) + 1);
  }

  return out;
}

// ------------------------------------------------------
// Action builder
// ------------------------------------------------------

function buildActions(vars: MilpVariable[]) {
  const actions: Array<{
    action: "EXPEDITE_SUPPLIER" | "DELAY_ORDER";
    sku: string;
    qty: number;
  }> = [];

  for (const v of vars) {
    if (v.expedite > 0) {
      actions.push({
        action: "EXPEDITE_SUPPLIER",
        sku: v.sku,
        qty: v.expedite,
      });
    }

    if (v.delay > 0) {
      actions.push({
        action: "DELAY_ORDER",
        sku: v.sku,
        qty: v.delay,
      });
    }
  }

  return actions;
}

// ------------------------------------------------------
// Utilities
// ------------------------------------------------------

function normalizeObjective(x: number) {
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.min(1, x / 100);
}

function num(x: unknown, fallback = 0) {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}