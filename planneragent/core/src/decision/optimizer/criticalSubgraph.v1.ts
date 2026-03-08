// core/src/decision/optimizer/criticalSubgraph.v1.ts
// ======================================================
// PlannerAgent — Critical Subgraph v1
// Canonical Source of Truth
//
// Purpose
// Extract the smallest relevant material-flow subgraph
// around operational risk hotspots, so downstream
// simulation / graph optimization / MILP refine can work
// on a reduced and more relevant problem.
//
// Deterministic
// No LLM
// ======================================================

import type {
  MaterialFlowGraph,
  MaterialFlowNode,
  MaterialFlowEdge,
} from "./materialFlowGraph.v1";

export type CriticalSeed =
  | {
      type: "ORDER";
      id: string;
    }
  | {
      type: "SKU";
      id: string;
    }
  | {
      type: "RISK";
      id: string;
      risk?: number;
    };

export type CriticalSubgraph = {
  nodes: MaterialFlowNode[];
  edges: MaterialFlowEdge[];
  seed_ids: string[];
  maxDepthFromSeeds: number;
  topologyConfidence: number;
  hotspots: Array<{
    id: string;
    kind: string;
    score: number;
  }>;
};

export type CriticalSubgraphInput = {
  graph: MaterialFlowGraph;
  seeds?: CriticalSeed[];
  riskSignals?: Record<string, number>;
  maxUpstreamDepth?: number;
  maxDownstreamDepth?: number;
  maxNodes?: number;
};

export function extractCriticalSubgraph(
  input: CriticalSubgraphInput
): CriticalSubgraph {
  const maxUpstreamDepth = clampInt(input.maxUpstreamDepth ?? 4, 1, 12);
  const maxDownstreamDepth = clampInt(input.maxDownstreamDepth ?? 2, 0, 12);
  const maxNodes = clampInt(input.maxNodes ?? 80, 10, 500);

  const graph = input.graph;
  const nodeMap = new Map<string, MaterialFlowNode>(
    (graph.nodes ?? []).map((n) => [n.id, n])
  );

  const incoming = new Map<string, MaterialFlowEdge[]>();
  const outgoing = new Map<string, MaterialFlowEdge[]>();

  for (const n of graph.nodes ?? []) {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  }

  for (const e of graph.edges ?? []) {
    if (!incoming.has(e.to)) incoming.set(e.to, []);
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    incoming.get(e.to)!.push(e);
    outgoing.get(e.from)!.push(e);
  }

  const seeds = resolveSeeds(input, nodeMap);
  const selected = new Set<string>();
  const distances = new Map<string, number>();

  // --------------------------------------------------
  // upstream walk
  // --------------------------------------------------
  for (const seed of seeds) {
    walkUpstream({
      seedId: seed,
      incoming,
      selected,
      distances,
      maxDepth: maxUpstreamDepth,
    });
  }

  // --------------------------------------------------
  // downstream walk
  // --------------------------------------------------
  for (const seed of seeds) {
    walkDownstream({
      seedId: seed,
      outgoing,
      selected,
      distances,
      maxDepth: maxDownstreamDepth,
    });
  }

  // --------------------------------------------------
  // cap node count deterministically if needed
  // --------------------------------------------------
  let chosenIds = Array.from(selected);

  if (chosenIds.length > maxNodes) {
    const scored = chosenIds.map((id) => ({
      id,
      score: hotspotScore({
        id,
        node: nodeMap.get(id),
        incoming: incoming.get(id) ?? [],
        outgoing: outgoing.get(id) ?? [],
        distances,
        riskSignals: input.riskSignals ?? {},
      }),
    }));

    scored.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

    chosenIds = scored.slice(0, maxNodes).map((x) => x.id);
  }

  const chosenSet = new Set(chosenIds);

  const nodes = chosenIds
    .map((id) => nodeMap.get(id))
    .filter((x): x is MaterialFlowNode => Boolean(x))
    .sort((a, b) => a.id.localeCompare(b.id));

  const edges = (graph.edges ?? []).filter(
    (e) => chosenSet.has(e.from) && chosenSet.has(e.to)
  );

  const hotspots = nodes
    .map((n) => ({
      id: n.id,
      kind: n.kind,
      score: round3(
        hotspotScore({
          id: n.id,
          node: n,
          incoming: incoming.get(n.id) ?? [],
          outgoing: outgoing.get(n.id) ?? [],
          distances,
          riskSignals: input.riskSignals ?? {},
        })
      ),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 12);

  return {
    nodes,
    edges,
    seed_ids: seeds,
    maxDepthFromSeeds: maxDistance(distances, chosenSet),
    topologyConfidence: computeSubgraphConfidence(nodes, edges, graph.topologyConfidence),
    hotspots,
  };
}

// ======================================================
// Seed resolution
// ======================================================

function resolveSeeds(
  input: CriticalSubgraphInput,
  nodeMap: Map<string, MaterialFlowNode>
): string[] {
  const out = new Set<string>();

  for (const s of input.seeds ?? []) {
    if (!s?.id) continue;
    if (nodeMap.has(s.id)) out.add(s.id);
  }

  // fallback 1: risky nodes from riskSignals
  if (out.size === 0) {
    const riskSignals = input.riskSignals ?? {};
    const risky = Object.entries(riskSignals)
      .filter(([_, v]) => num(v, 0) > 0.5)
      .map(([k]) => k);

    for (const id of risky) {
      if (nodeMap.has(id)) out.add(id);
    }
  }

  // fallback 2: root orders from graph
  if (out.size === 0) {
    for (const id of input.graph.rootOrders ?? []) {
      if (nodeMap.has(id)) out.add(id);
    }
  }

  // fallback 3: high-demand / high-onHand nodes if present
  if (out.size === 0) {
    const ranked = Array.from(nodeMap.values())
      .map((n) => ({
        id: n.id,
        score: num(n.demand, 0) + num(n.onHand, 0) * 0.2,
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.id.localeCompare(b.id);
      });

    if (ranked[0]?.id) out.add(ranked[0].id);
  }

  return Array.from(out).sort((a, b) => a.localeCompare(b));
}

// ======================================================
// Walkers
// ======================================================

function walkUpstream(params: {
  seedId: string;
  incoming: Map<string, MaterialFlowEdge[]>;
  selected: Set<string>;
  distances: Map<string, number>;
  maxDepth: number;
}) {
  const queue: Array<{ id: string; depth: number }> = [
    { id: params.seedId, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth > params.maxDepth) continue;

    params.selected.add(current.id);
    setMinDistance(params.distances, current.id, current.depth);

    for (const edge of params.incoming.get(current.id) ?? []) {
      queue.push({
        id: edge.from,
        depth: current.depth + 1,
      });
    }
  }
}

function walkDownstream(params: {
  seedId: string;
  outgoing: Map<string, MaterialFlowEdge[]>;
  selected: Set<string>;
  distances: Map<string, number>;
  maxDepth: number;
}) {
  const queue: Array<{ id: string; depth: number }> = [
    { id: params.seedId, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth > params.maxDepth) continue;

    params.selected.add(current.id);
    setMinDistance(params.distances, current.id, current.depth);

    for (const edge of params.outgoing.get(current.id) ?? []) {
      queue.push({
        id: edge.to,
        depth: current.depth + 1,
      });
    }
  }
}

function setMinDistance(
  distances: Map<string, number>,
  id: string,
  next: number
) {
  const prev = distances.get(id);
  if (prev === undefined || next < prev) {
    distances.set(id, next);
  }
}

// ======================================================
// Scoring / confidence
// ======================================================

function hotspotScore(params: {
  id: string;
  node?: MaterialFlowNode;
  incoming: MaterialFlowEdge[];
  outgoing: MaterialFlowEdge[];
  distances: Map<string, number>;
  riskSignals: Record<string, number>;
}): number {
  let score = 0;

  const node = params.node;
  const deg = params.incoming.length + params.outgoing.length;
  const dist = params.distances.get(params.id) ?? 99;

  score += Math.min(1, deg / 4) * 0.35;
  score += Math.min(1, num(node?.demand, 0) / 100) * 0.25;
  score += Math.min(1, num(params.riskSignals[params.id], 0)) * 0.30;

  if (dist === 0) score += 0.20;
  else if (dist === 1) score += 0.10;

  if (node?.kind === "order") score += 0.10;
  if (node?.kind === "finished_good") score += 0.08;
  if (node?.kind === "component") score += 0.05;

  return score;
}

function computeSubgraphConfidence(
  nodes: MaterialFlowNode[],
  edges: MaterialFlowEdge[],
  base: number
): number {
  if (nodes.length === 0) return 0;

  let c = clamp01(base);

  if (edges.length > 0) c += 0.1;
  if (edges.length >= Math.max(1, Math.floor(nodes.length / 2))) c += 0.1;

  const withKinds = nodes.filter((n) => n.kind !== "unknown").length;
  c += Math.min(0.15, withKinds / Math.max(1, nodes.length) * 0.15);

  return round3(clamp01(c));
}

function maxDistance(
  distances: Map<string, number>,
  chosen: Set<string>
): number {
  let max = 0;
  for (const [id, d] of distances.entries()) {
    if (!chosen.has(id)) continue;
    if (d > max) max = d;
  }
  return max;
}

// ======================================================
// Utils
// ======================================================

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function clampInt(x: number, lo: number, hi: number): number {
  const n = Math.round(x);
  if (!Number.isFinite(n)) return lo;
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
