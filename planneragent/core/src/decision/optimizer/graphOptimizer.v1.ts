// core/src/decision/optimizer/graphOptimizer.v1.ts
// ======================================================
// PlannerAgent — Graph Optimizer v1
// Canonical Source of Truth
//
// Purpose
// Optimize using a material flow graph when topology
// confidence is sufficient.
//
// Fallback logic:
// - minimal data → SKU optimizer
// - sufficient structure → graph optimizer
// ======================================================

import { buildMaterialFlowGraph, type MaterialFlowGraph } from "./materialFlowGraph.v1";

export type GraphOptimizerInput = {
  orders?: any[];
  inventory?: any[];
  inferredBom?: any;
  operationalTopology?: {
    nodes?: Array<{ id: string; kind: string }>;
    edges?: Array<{ from: string; to: string; relation: string; weight?: number }>;
  };
};

export type GraphOptimizerAction =
  | {
      action: "EXPEDITE_SUPPLIER";
      sku: string;
      qty: number;
      level: number;
      path?: string[];
    }
  | {
      action: "DELAY_ORDER";
      sku: string;
      qty: number;
      level: number;
      path?: string[];
    };

export type GraphOptimizerCandidate = {
  sku: string;
  shortage: number;
  level: number;
  criticality: number;
  path: string[];
};

export type GraphOptimizerResult = {
  mode: "GRAPH";
  graph: MaterialFlowGraph;
  candidates: GraphOptimizerCandidate[];
  actions: GraphOptimizerAction[];
  bestScore: number;
};

export function runGraphOptimizerV1(
  input: GraphOptimizerInput
): GraphOptimizerResult {
  const graph = buildMaterialFlowGraph({
    orders: input.orders ?? [],
    inventory: input.inventory ?? [],
    inferredBom: input.inferredBom,
    operationalTopology: input.operationalTopology,
  });

  const rootDemand = normalizeRootDemand(input.orders ?? []);
  const propagatedDemand = propagateDemand(graph, rootDemand);

  const inventoryMap = buildInventoryMap(input.inventory ?? []);
  const candidates: GraphOptimizerCandidate[] = [];
  const actions: GraphOptimizerAction[] = [];

  for (const d of propagatedDemand) {
    if (d.level === 0) continue;

    const onHand = inventoryMap.get(d.sku) ?? 0;
    const shortage = d.required - onHand;

    if (shortage <= 0) continue;

    const criticality = computeCriticality(graph, d.sku, d.level, shortage);

    candidates.push({
      sku: d.sku,
      shortage: round3(shortage),
      level: d.level,
      criticality: round3(criticality),
      path: d.path,
    });

    const expediteShare = criticality >= 0.7 ? 0.75 : criticality >= 0.4 ? 0.6 : 0.45;
    const expediteQty = Math.max(1, Math.round(shortage * expediteShare));
    const delayQty = Math.max(0, Math.round(shortage - expediteQty));

    if (expediteQty > 0) {
      actions.push({
        action: "EXPEDITE_SUPPLIER",
        sku: d.sku,
        qty: expediteQty,
        level: d.level,
        path: d.path,
      });
    }

    if (delayQty > 0) {
      actions.push({
        action: "DELAY_ORDER",
        sku: d.sku,
        qty: delayQty,
        level: d.level,
        path: d.path,
      });
    }
  }

  const bestScore = scoreGraphResult(candidates);

  return {
    mode: "GRAPH",
    graph,
    candidates: sortCandidates(candidates),
    actions,
    bestScore,
  };
}

// ------------------------------------------------------
// Demand propagation
// ------------------------------------------------------

type PropagatedDemand = {
  sku: string;
  required: number;
  level: number;
  path: string[];
};

function propagateDemand(
  graph: MaterialFlowGraph,
  rootDemand: Array<{ sku: string; qty: number }>
): PropagatedDemand[] {
  const adjacency = new Map<string, Array<{ component: string; ratio: number }>>();

  for (const e of graph.edges) {
    if (e.relation !== "consumes") continue;

    // edge is component -> parent, so reverse for propagation parent -> component
    const arr = adjacency.get(e.to) ?? [];
    arr.push({
      component: e.from,
      ratio: e.weight,
    });
    adjacency.set(e.to, arr);
  }

  const out: PropagatedDemand[] = [];
  const queue: Array<{ sku: string; qty: number; level: number; path: string[] }> = [];

  for (const r of rootDemand) {
    queue.push({
      sku: r.sku,
      qty: r.qty,
      level: 0,
      path: [r.sku],
    });
  }

  while (queue.length > 0) {
    const current = queue.shift()!;

    out.push({
      sku: current.sku,
      required: current.qty,
      level: current.level,
      path: current.path,
    });

    const children = adjacency.get(current.sku) ?? [];

    for (const child of children) {
      const childQty = current.qty * child.ratio;
      if (childQty <= 0) continue;

      queue.push({
        sku: child.component,
        qty: childQty,
        level: current.level + 1,
        path: [...current.path, child.component],
      });
    }
  }

  return aggregatePropagatedDemand(out);
}

function aggregatePropagatedDemand(
  rows: PropagatedDemand[]
): PropagatedDemand[] {
  const map = new Map<string, PropagatedDemand>();

  for (const row of rows) {
    const key = `${row.sku}::${row.level}`;

    const prev = map.get(key);
    if (!prev) {
      map.set(key, row);
      continue;
    }

    map.set(key, {
      sku: row.sku,
      required: prev.required + row.required,
      level: row.level,
      path: prev.path.length <= row.path.length ? prev.path : row.path,
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.sku.localeCompare(b.sku);
  });
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function normalizeRootDemand(
  orders: any[]
): Array<{ sku: string; qty: number }> {
  return (orders ?? [])
    .map((o) => ({
      sku: String(o?.sku ?? o?.article ?? o?.item ?? "").trim(),
      qty: num(o?.qty ?? o?.quantity, 0),
    }))
    .filter((o) => o.sku && o.qty > 0);
}

function buildInventoryMap(inventory: any[]): Map<string, number> {
  const out = new Map<string, number>();

  for (const inv of inventory ?? []) {
    const sku = String(inv?.sku ?? inv?.article ?? inv?.item ?? "").trim();
    if (!sku) continue;

    const onHand =
      num(inv?.onHand, NaN) ||
      num(inv?.on_hand, NaN) ||
      num(inv?.qty, 0);

    out.set(sku, (out.get(sku) ?? 0) + onHand);
  }

  return out;
}

function computeCriticality(
  graph: MaterialFlowGraph,
  sku: string,
  level: number,
  shortage: number
): number {
  const degree = computeNodeDegree(graph, sku);

  let score = 0;

  if (level >= 2) score += 0.3;
  else if (level === 1) score += 0.2;

  if (degree >= 3) score += 0.3;
  else if (degree >= 1) score += 0.15;

  if (shortage > 100) score += 0.3;
  else if (shortage > 20) score += 0.15;

  score += graph.topologyConfidence * 0.2;

  return Math.min(1, score);
}

function computeNodeDegree(
  graph: MaterialFlowGraph,
  sku: string
): number {
  let degree = 0;

  for (const e of graph.edges) {
    if (e.from === sku || e.to === sku) degree++;
  }

  return degree;
}

function scoreGraphResult(
  candidates: GraphOptimizerCandidate[]
): number {
  if (candidates.length === 0) return 0;

  const total =
    candidates.reduce((s, c) => s + c.criticality, 0) / candidates.length;

  return round3(Math.min(1, total));
}

function sortCandidates(
  xs: GraphOptimizerCandidate[]
): GraphOptimizerCandidate[] {
  return [...xs].sort((a, b) => {
    if (a.criticality !== b.criticality) return b.criticality - a.criticality;
    if (a.level !== b.level) return b.level - a.level;
    return b.shortage - a.shortage;
  });
}

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
