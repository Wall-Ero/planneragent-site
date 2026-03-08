// core/src/decision/optimizer/optimizer.ts
// ======================================================
// PlannerAgent — Optimizer v1 Entrypoint
// Canonical Source of Truth
// ======================================================

import type { CandidatePlan, OptimizerInput, OptimizerResult } from "./contracts";
import { resolveOptimizerBudget } from "./budget";
import { generateCandidateActions } from "./generator";
import { evaluateCandidate } from "./evaluator";
import { localSearchImprove } from "./localSearch";
import { seedFromRequestId } from "./seeds";
import { milpRefineStub } from "./milp.stub";

export async function runOptimizerV1(input: OptimizerInput): Promise<OptimizerResult> {
  const t0 = Date.now();
  const deterministicSeed = String(seedFromRequestId(input.requestId));

  // CHARTER: no solving
  if (input.plan === "CHARTER") {
    const empty = evaluateCandidate(input, [], 0);
    return {
      ok: true,
      best: empty,
      candidates: [empty],
      meta: { engine: "OPT_V1", evalCount: 1, millis: Date.now() - t0, deterministicSeed },
    };
  }

  const budget = resolveOptimizerBudget(input.plan, input.budget);

  // Budget can be 0 (VISION minimal)
  if (budget.maxMillis <= 0 || budget.maxEvals <= 0) {
    const empty = evaluateCandidate(input, [], 0);
    return {
      ok: true,
      best: empty,
      candidates: [empty],
      meta: { engine: "OPT_V1", evalCount: 1, millis: Date.now() - t0, deterministicSeed },
    };
  }

  const candidatesActions = generateCandidateActions(input);

  const candidates: CandidatePlan[] = [];
  let evalCount = 0;

  // Evaluate candidates until budget exhausted
  for (let i = 0; i < candidatesActions.length; i++) {
    if (evalCount >= budget.maxEvals) break;
    if (Date.now() - t0 >= budget.maxMillis) break;

    const cand = evaluateCandidate(input, candidatesActions[i]!, i);
    candidates.push(cand);
    evalCount++;
  }

  // Always include do-nothing if nothing evaluated
  if (candidates.length === 0) {
    const empty = evaluateCandidate(input, [], 0);
    candidates.push(empty);
    evalCount++;
  }

  // Pick best so far
  candidates.sort((a, b) => {
    if (a.feasibleHard !== b.feasibleHard) return a.feasibleHard ? -1 : 1;
    return a.score - b.score;
  });

  let best = candidates[0]!;

  // Local search improvement (anytime)
  const remaining = Math.max(0, budget.maxEvals - evalCount);
  if (remaining > 0 && Date.now() - t0 < budget.maxMillis) {
    const ls = localSearchImprove(input, best, remaining);
    best = ls.best;
    evalCount += ls.used;
    // include improved best if it is new
    if (!candidates.some((c) => c.id === best.id)) {
      candidates.push(best);
    }
  }

  // Optional MILP refine (stub in v1)
  if (budget.allowMilp && input.plan === "PRINCIPAL") {
    if (Date.now() - t0 < budget.maxMillis) {
      best = await milpRefineStub(input, best);
    }
  }

  // Final sort / cap list size
  candidates.sort((a, b) => {
    if (a.feasibleHard !== b.feasibleHard) return a.feasibleHard ? -1 : 1;
    return a.score - b.score;
  });

  const millis = Date.now() - t0;

  return {
    ok: true,
    best,
    candidates: candidates.slice(0, 60),
    meta: { engine: "OPT_V1", evalCount, millis, deterministicSeed },
  };
}