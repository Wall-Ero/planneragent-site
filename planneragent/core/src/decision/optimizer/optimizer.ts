// core/src/decision/optimizer/optimizer.ts
// ======================================================
// PlannerAgent — Optimizer v1 Entrypoint
// Canonical Source of Truth
//
// Adaptive deterministic optimizer:
// - uses topology confidence
// - uses critical subgraph before graph optimization
// - respects explicit BOM reference decision when present
// - keeps SKU fallback for sparse data
// ======================================================

import type {
  CandidatePlan,
  OptimizerInput,
  OptimizerResult,
  Action,
} from "./contracts";

import { resolveOptimizerBudget } from "./budget";
import { generateCandidateActions } from "./generator";
import { evaluateCandidate } from "./evaluator";
import { localSearchImprove } from "./localSearch";
import { seedFromRequestId } from "./seeds";
import { milpRefineV1 } from "./milp.refine.v1";

import { buildMaterialFlowGraph } from "./materialFlowGraph.v1";
import { runGraphOptimizerV1 } from "./graphOptimizer.v1";
import { extractCriticalSubgraph } from "./criticalSubgraph.v1";
import { selectBomByDecision } from "./bomReferenceDecision";

export async function runOptimizerV1(input: OptimizerInput): Promise<OptimizerResult> {
  const t0 = Date.now();
  const deterministicSeed = String(seedFromRequestId(input.requestId));

  // ---------------------------------------------------
  // CHARTER MODE
  // ---------------------------------------------------

  if (input.plan === "CHARTER") {
    const empty = evaluateCandidate(input, [], 0);

    return {
      ok: true,
      best: empty,
      candidates: [empty],
      meta: {
        engine: "OPT_V1",
        evalCount: 1,
        millis: Date.now() - t0,
        deterministicSeed,
      },
    };
  }

  // ---------------------------------------------------
  // BUDGET
  // ---------------------------------------------------

  const budget = resolveOptimizerBudget(input.plan, input.budget);

  if (budget.maxMillis <= 0 || budget.maxEvals <= 0) {
    const empty = evaluateCandidate(input, [], 0);

    return {
      ok: true,
      best: empty,
      candidates: [empty],
      meta: {
        engine: "OPT_V1",
        evalCount: 1,
        millis: Date.now() - t0,
        deterministicSeed,
      },
    };
  }

  // ---------------------------------------------------
  // BOM selection — only if SCM explicitly decided
  // otherwise keep incoming inferred BOM
  // ---------------------------------------------------

  const fused = (input.realitySnapshot as any)?.fusion;

  const selectedBom =
    input.bomReferenceDecision
      ? selectBomByDecision({
          decision: input.bomReferenceDecision,
          master_bom: fused?.master_bom ?? [],
          plan_bom: fused?.plan_bom ?? [],
          reality_bom: fused?.reality_bom ?? [],
        })
      : normalizeSelectedBom(input.inferredBom);

  // ---------------------------------------------------
  // MODE SELECTION
  // ---------------------------------------------------

  const topologyConfidence = Number(
    (input as any).topologyConfidence ??
    input.operationalTopology?.confidence ??
    0
  );

  const mode = selectOptimizerMode({
    topologyConfidence,
    topology: input.operationalTopology,
    bomRows: selectedBom,
    awareness: Number(input.realitySnapshot?.awareness_level ?? 0),
  });

  // ---------------------------------------------------
  // GRAPH MODE
  // ---------------------------------------------------

  if (mode === "GRAPH") {
    const graph = buildMaterialFlowGraph({
      orders: input.orders ?? [],
      inventory: input.inventory ?? [],
      inferredBom: selectedBom,
      operationalTopology: input.operationalTopology,
    });

    const subgraph = extractCriticalSubgraph({
      graph,
      seeds: buildSeedsFromOrders(input.orders ?? []),
      riskSignals: input.dlSignals ?? {},
      maxUpstreamDepth: 4,
      maxDownstreamDepth: 2,
      maxNodes: 80,
    });

    const graphResult = runGraphOptimizerV1({
      orders: input.orders ?? [],
      inventory: input.inventory ?? [],
      inferredBom: selectedBom,
      operationalTopology: {
        nodes: subgraph.nodes.map((n) => ({ id: n.id, kind: n.kind })),
        edges: subgraph.edges.map((e) => ({
          from: e.from,
          to: e.to,
          relation: e.relation,
          weight: e.weight,
        })),
      },
    });

    let best = buildCandidateFromGraphResult(input, graphResult, 0);
    let evalCount = 1;

    const candidates: CandidatePlan[] = [best];

    const remaining = Math.max(0, budget.maxEvals - evalCount);
    if (remaining > 0 && Date.now() - t0 < budget.maxMillis) {
      const ls = localSearchImprove(input, best, remaining);
      best = ls.best;
      evalCount += ls.used;

      if (!candidates.some((c) => c.id === best.id)) {
        candidates.push(best);
      }
    }

    if (budget.allowMilp && input.plan === "PRINCIPAL") {
      if (Date.now() - t0 < budget.maxMillis) {
        best = await milpRefineV1(input, best);
        if (!candidates.some((c) => c.id === best.id)) {
          candidates.push(best);
        }
      }
    }

    candidates.sort(sortCandidates);

    return {
      ok: true,
      best,
      candidates: candidates.slice(0, 60),
      meta: {
        engine: "OPT_V1_GRAPH",
        evalCount,
        millis: Date.now() - t0,
        deterministicSeed,
      },
    };
  }

  // ---------------------------------------------------
  // SKU MODE
  // ---------------------------------------------------

  const candidateActions = generateCandidateActions({
    ...input,
    inferredBom: selectedBom,
  } as any);

  const candidates: CandidatePlan[] = [];
  let evalCount = 0;

  for (let i = 0; i < candidateActions.length; i++) {
    if (evalCount >= budget.maxEvals) break;
    if (Date.now() - t0 >= budget.maxMillis) break;

    const cand = evaluateCandidate(
      {
        ...input,
        inferredBom: selectedBom,
      } as any,
      candidateActions[i]!,
      i
    );

    candidates.push(cand);
    evalCount++;
  }

  if (candidates.length === 0) {
    const empty = evaluateCandidate(
      {
        ...input,
        inferredBom: selectedBom,
      } as any,
      [],
      0
    );
    candidates.push(empty);
    evalCount++;
  }

  candidates.sort(sortCandidates);

  let best = candidates[0]!;

  const remaining = Math.max(0, budget.maxEvals - evalCount);

  if (remaining > 0 && Date.now() - t0 < budget.maxMillis) {
    const ls = localSearchImprove(input, best, remaining);
    best = ls.best;
    evalCount += ls.used;

    if (!candidates.some((c) => c.id === best.id)) {
      candidates.push(best);
    }
  }

  if (budget.allowMilp && input.plan === "PRINCIPAL") {
    if (Date.now() - t0 < budget.maxMillis) {
      best = await milpRefineV1(input, best);
    }
  }

  candidates.sort(sortCandidates);

  return {
    ok: true,
    best,
    candidates: candidates.slice(0, 60),
    meta: {
      engine: "OPT_V1_SKU",
      evalCount,
      millis: Date.now() - t0,
      deterministicSeed,
    },
  };
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function normalizeSelectedBom(
  inferredBom: any
): Array<{ parent: string; component: string; ratio: number }> {
  if (!inferredBom) return [];

  if (Array.isArray(inferredBom)) {
    return inferredBom
      .map((x) => ({
        parent: String(x?.parent ?? "").trim(),
        component: String(x?.component ?? "").trim(),
        ratio: Number(x?.ratio ?? x?.median_ratio ?? 0),
      }))
      .filter((x) => x.parent && x.component && Number.isFinite(x.ratio) && x.ratio > 0);
  }

  if (Array.isArray(inferredBom?.bom)) {
    return inferredBom.bom.flatMap((p: any) =>
      (p.components ?? []).map((c: any) => ({
        parent: String(p?.parent ?? "").trim(),
        component: String(c?.component ?? "").trim(),
        ratio: Number(c?.median_ratio ?? c?.ratio ?? 0),
      }))
    ).filter((x: any) => x.parent && x.component && Number.isFinite(x.ratio) && x.ratio > 0);
  }

  return [];
}

function selectOptimizerMode(params: {
  topologyConfidence: number;
  topology?: any;
  bomRows: Array<{ parent: string; component: string; ratio: number }>;
  awareness: number;
}): "SKU" | "GRAPH" {
  const nodes = params.topology?.nodes ?? [];
  const edges = params.topology?.edges ?? [];

  if (
    params.topologyConfidence >= 0.45 &&
    nodes.length >= 3 &&
    edges.length >= 2 &&
    params.bomRows.length >= 1 &&
    params.awareness >= 1
  ) {
    return "GRAPH";
  }

  return "SKU";
}

function buildSeedsFromOrders(orders: any[]): Array<{ type: "ORDER"; id: string }> {
  return (orders ?? [])
    .map((o) => String(o?.orderId ?? o?.id ?? "").trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((id) => ({
      type: "ORDER" as const,
      id,
    }));
}

function buildCandidateFromGraphResult(
  input: OptimizerInput,
  graph: ReturnType<typeof runGraphOptimizerV1>,
  candidateIndex: number
): CandidatePlan {
  const actions = graph.actions.map<Action>((a) => {
    if (a.action === "EXPEDITE_SUPPLIER") {
      return {
        kind: "EXPEDITE_SUPPLIER",
        sku: a.sku,
        qty: a.qty,
        costFactor: 1.35,
        reason: `graph_v1_level_${a.level}`,
      };
    }

    return {
      kind: "SHORT_TERM_PRODUCTION_ADJUST",
      sku: a.sku,
      qty: a.qty,
      availableInDays: Math.max(0, a.level),
      costFactor: 1.2,
      reason: `graph_v1_delay_substitute_level_${a.level}`,
    };
  });

  const evaluated = evaluateCandidate(input, actions, candidateIndex);

  return {
    ...evaluated,
    id: `${evaluated.id}_graph`,
    kpis: {
      ...evaluated.kpis,
      graphCriticalCandidates: graph.candidates.length,
      graphBestScore: graph.bestScore,
    },
    evidence: {
      ...evaluated.evidence,
      evalSteps: [
        ...evaluated.evidence.evalSteps,
        `graph:v1:candidates=${graph.candidates.length}`,
        `graph:v1:bestScore=${graph.bestScore}`,
      ],
    },
  };
}

function sortCandidates(a: CandidatePlan, b: CandidatePlan): number {
  if (a.feasibleHard !== b.feasibleHard) {
    return a.feasibleHard ? -1 : 1;
  }

  return a.score - b.score;
}