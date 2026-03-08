// core/src/decision/optimizer/objective.ts
// ======================================================
// PlannerAgent — Optimizer v1 Objective
// Canonical Source of Truth
// ======================================================

import type { ObjectiveWeights } from "./contracts";

export function resolveWeights(w?: Partial<ObjectiveWeights>): Required<ObjectiveWeights> {
  // v1 defaults: service and shortage dominate; stability still matters
  return {
    lateness: clamp(w?.lateness ?? 3.0, 0, 10),
    shortage: clamp(w?.shortage ?? 10.0, 0, 100),
    inventory: clamp(w?.inventory ?? 0.7, 0, 10),
    stability: clamp(w?.stability ?? 1.2, 0, 10),
    cost: clamp(w?.cost ?? 1.5, 0, 10),
    service: clamp(w?.service ?? 4.0, 0, 20),
  };
}

export function scoreFromKpis(
  kpis: Record<string, number>,
  weights: Required<ObjectiveWeights>
): number {
  // Lower is better
  const lateness = num(kpis.latenessDays);
  const shortage = num(kpis.shortageUnits);
  const inv = num(kpis.inventoryDeltaUnits);
  const churn = num(kpis.planChurn);
  const cost = num(kpis.estimatedCost);
  const serviceLoss = num(kpis.serviceShortfall);

  return (
    weights.lateness * lateness +
    weights.shortage * shortage +
    weights.inventory * inv +
    weights.stability * churn +
    weights.cost * cost +
    weights.service * serviceLoss
  );
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}