// core/src/decision/optimizer/budget.ts
// ======================================================
// PlannerAgent — Optimizer v1 Budget Policy
// Canonical Source of Truth
// ======================================================

import type { OptimizerBudget, PlanTier } from "./contracts";

const DEFAULTS: Record<PlanTier, OptimizerBudget> = {

  VISION: {
    maxMillis: 25,
    maxEvals: 6,
    allowMilp: false
  },

  GRADUATE: {
    maxMillis: 60,
    maxEvals: 20,
    allowMilp: false
  },

  JUNIOR: {
    maxMillis: 120,
    maxEvals: 40,
    allowMilp: false
  },

  SENIOR: {
    maxMillis: 220,
    maxEvals: 70,
    allowMilp: false
  },

  PRINCIPAL: {
    maxMillis: 650,
    maxEvals: 250,
    allowMilp: false
  },

  CHARTER: {
    maxMillis: 0,
    maxEvals: 0,
    allowMilp: false
  }

};

export function resolveOptimizerBudget(
  plan: PlanTier,
  override?: Partial<OptimizerBudget>
): OptimizerBudget {
  const base = DEFAULTS[plan] ?? DEFAULTS.VISION;

  const maxMillis = clampInt(override?.maxMillis ?? base.maxMillis, 0, 5_000);
  const maxEvals = clampInt(override?.maxEvals ?? base.maxEvals, 0, 5_000);
  const allowMilp = Boolean(override?.allowMilp ?? base.allowMilp);

  return { maxMillis, maxEvals, allowMilp };
}

function clampInt(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  const n = Math.floor(v);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
