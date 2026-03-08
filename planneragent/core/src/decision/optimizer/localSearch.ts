// core/src/decision/optimizer/localSearch.ts
// ======================================================
// PlannerAgent — Optimizer v1 Local Search (Anytime)
// Canonical Source of Truth
// ======================================================

import type { Action, CandidatePlan, OptimizerInput } from "./contracts";
import { evaluateCandidate } from "./evaluator";
import { mulberry32, pickInt, seedFromRequestId } from "./seeds";

/**
 * v1 local search:
 * - Start from best candidate
 * - Try small deterministic mutations (shiftDays tweak, qty tweak)
 * - Keep best-so-far (anytime)
 */
export function localSearchImprove(
  input: OptimizerInput,
  start: CandidatePlan,
  remainingEvals: number
): { best: CandidatePlan; used: number } {
  if (remainingEvals <= 0) return { best: start, used: 0 };

  const seed = seedFromRequestId(input.requestId + "::ls");
  const rng = mulberry32(seed);

  let best = start;
  let used = 0;

  const maxIters = Math.min(remainingEvals, 25);
  for (let i = 0; i < maxIters; i++) {
    const mutated = mutateActions(best.actions, rng);
    const cand = evaluateCandidate(input, mutated, 10_000 + i);
    used++;

    if (isBetter(cand, best)) best = cand;
  }

  return { best, used };
}

function mutateActions(actions: Action[], rng: () => number): Action[] {
  if (actions.length === 0) return actions;

  const out = actions.map((a) => ({ ...a })) as Action[];
  const idx = pickInt(rng, 0, out.length - 1);
  const a = out[idx];

  if (a.kind === "RESCHEDULE_DELIVERY") {
    const delta = pickInt(rng, -2, 2);
    const next = Math.max(0, a.shiftDays + delta);
    out[idx] = { ...a, shiftDays: next };
  }

  if (a.kind === "EXPEDITE_SUPPLIER") {
    const deltaPct = pickInt(rng, -15, 15) / 100;
    const nextQty = Math.max(1, Math.floor(a.qty * (1 + deltaPct)));
    out[idx] = { ...a, qty: nextQty };
  }

  if (a.kind === "SHORT_TERM_PRODUCTION_ADJUST") {
    const deltaPct = pickInt(rng, -15, 15) / 100;
    const nextQty = Math.max(1, Math.floor(a.qty * (1 + deltaPct)));
    const dayDelta = pickInt(rng, -1, 1);
    const nextDays = Math.max(0, Math.min(5, a.availableInDays + dayDelta));
    out[idx] = { ...a, qty: nextQty, availableInDays: nextDays };
  }

  return out;
}

function isBetter(a: CandidatePlan, b: CandidatePlan): boolean {
  // Prefer feasible hard; then lower score
  if (a.feasibleHard && !b.feasibleHard) return true;
  if (!a.feasibleHard && b.feasibleHard) return false;
  return a.score < b.score;
}
