// core/src/decision/optimizer/materialFlowGraph.v1.ts
// ======================================================
// PlannerAgent — Material Flow Graph v1
// Canonical Source of Truth
//
// Purpose
// Build a deterministic material flow graph from:
// - inferred BOM
// - orders
// - inventory
// - optional topology
//
// This graph is used by the graph optimizer to:
// - propagate demand
// - identify upstream shortages
// - detect dependency depth
// - estimate critical paths
// ======================================================

export type MaterialFlowNodeKind =
  | "supplier"
  | "component"
  | "subassembly"
  | "finished_good"
  | "order"
  | "inventory"
  | "unknown";

export type MaterialFlowNode = {
  id: string;
  kind: MaterialFlowNodeKind;
  onHand?: number;
  demand?: number;
  level?: number;
};

export type MaterialFlowEdge = {
  from: string;
  to: string;
  relation: "consumes" | "produces" | "supplies" | "depends_on";
  weight: number;
};

export type MaterialFlowGraph = {
  nodes: MaterialFlowNode[];
  edges: MaterialFlowEdge[];
  rootOrders: string[];
  maxDepth: number;
  topologyConfidence: number;
};

type InferredBomInput =
  | Array<{
      parent: string;
      component?: string;
      ratio?: number;
      median_ratio?: number;
    }>
  | {
      bom?: Array<{
        parent: string;
        components: Array<{
          component: string;
          median_ratio: number;
          mean_ratio?: number;
          variance?: number;
          samples?: number;
        }>;
        confidence?: number;
      }>;
    };

export function buildMaterialFlowGraph(input: {
  orders?: any[];
  inventory?: any[];
  inferredBom?: InferredBomInput;
  operationalTopology?: {
    nodes?: Array<{ id: string; kind: string }>;
    edges?: Array<{ from: string; to: string; relation: string; weight?: number }>;
  };
}): MaterialFlowGraph {
  const nodeMap = new Map<string, MaterialFlowNode>();
  const edges: MaterialFlowEdge[] = [];
  const rootOrders: string[] = [];

  const bomEdges = flattenInferredBom(input.inferredBom);

  for (const inv of input.inventory ?? []) {
    const sku = String(inv?.sku ?? inv?.article ?? inv?.item ?? "").trim();
    if (!sku) continue;

    const onHand =
      num(inv?.onHand, NaN) ||
      num(inv?.on_hand, NaN) ||
      num(inv?.qty, 0);

    upsertNode(nodeMap, {
      id: sku,
      kind: inferKindFromBom(sku, bomEdges),
      onHand,
    });
  }

  for (const order of input.orders ?? []) {
    const sku = String(order?.sku ?? order?.article ?? order?.item ?? "").trim();
    const qty = num(order?.qty ?? order?.quantity, 0);
    const orderId = String(order?.orderId ?? order?.id ?? "").trim();

    if (!sku || qty <= 0) continue;

    upsertNode(nodeMap, {
      id: sku,
      kind: inferKindFromBom(sku, bomEdges),
      demand: (nodeMap.get(sku)?.demand ?? 0) + qty,
    });

    if (orderId) {
      rootOrders.push(orderId);

      upsertNode(nodeMap, {
        id: orderId,
        kind: "order",
      });

      edges.push({
        from: sku,
        to: orderId,
        relation: "depends_on",
        weight: qty,
      });
    }
  }

  for (const e of bomEdges) {
    upsertNode(nodeMap, {
      id: e.parent,
      kind: inferKindFromBom(e.parent, bomEdges),
    });

    upsertNode(nodeMap, {
      id: e.component,
      kind: inferKindFromBom(e.component, bomEdges),
    });

    edges.push({
      from: e.component,
      to: e.parent,
      relation: "consumes",
      weight: e.ratio,
    });
  }

  for (const topoNode of input.operationalTopology?.nodes ?? []) {
    if (!nodeMap.has(topoNode.id)) {
      upsertNode(nodeMap, {
        id: topoNode.id,
        kind: normalizeTopologyKind(topoNode.kind),
      });
    }
  }

  for (const topoEdge of input.operationalTopology?.edges ?? []) {
    if (!topoEdge?.from || !topoEdge?.to) continue;

    const exists = edges.some(
      (e) =>
        e.from === topoEdge.from &&
        e.to === topoEdge.to &&
        e.relation === normalizeEdgeRelation(topoEdge.relation)
    );

    if (!exists) {
      edges.push({
        from: topoEdge.from,
        to: topoEdge.to,
        relation: normalizeEdgeRelation(topoEdge.relation),
        weight: num(topoEdge.weight, 1),
      });
    }
  }

  const maxDepth = assignLevels(nodeMap, edges);
  const topologyConfidence = computeTopologyConfidence(nodeMap, edges, bomEdges.length);

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
    rootOrders: uniq(rootOrders),
    maxDepth,
    topologyConfidence,
  };
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function flattenInferredBom(
  inferredBom?: InferredBomInput
): Array<{ parent: string; component: string; ratio: number }> {
  const out: Array<{ parent: string; component: string; ratio: number }> = [];

  if (!inferredBom) return out;

  if (Array.isArray(inferredBom)) {
    for (const row of inferredBom) {
      const parent = String(row?.parent ?? "").trim();
      const component = String(row?.component ?? "").trim();
      const ratio = num(row?.ratio ?? row?.median_ratio, 0);

      if (!parent || !component || ratio <= 0) continue;

      out.push({ parent, component, ratio });
    }

    return out;
  }

  for (const parentRow of inferredBom.bom ?? []) {
    const parent = String(parentRow?.parent ?? "").trim();
    if (!parent) continue;

    for (const comp of parentRow.components ?? []) {
      const component = String(comp?.component ?? "").trim();
      const ratio = num(comp?.median_ratio, 0);

      if (!component || ratio <= 0) continue;

      out.push({ parent, component, ratio });
    }
  }

  return out;
}

function upsertNode(
  nodeMap: Map<string, MaterialFlowNode>,
  next: MaterialFlowNode
) {
  const prev = nodeMap.get(next.id);

  if (!prev) {
    nodeMap.set(next.id, next);
    return;
  }

  nodeMap.set(next.id, {
    ...prev,
    ...next,
    onHand: next.onHand ?? prev.onHand,
    demand: next.demand ?? prev.demand,
    level: next.level ?? prev.level,
    kind: prev.kind === "unknown" ? next.kind : prev.kind,
  });
}

function inferKindFromBom(
  sku: string,
  bomEdges: Array<{ parent: string; component: string; ratio: number }>
): MaterialFlowNodeKind {
  const isParent = bomEdges.some((e) => e.parent === sku);
  const isComponent = bomEdges.some((e) => e.component === sku);

  if (isParent && isComponent) return "subassembly";
  if (isParent) return "finished_good";
  if (isComponent) return "component";

  return "unknown";
}

function normalizeTopologyKind(kind: string): MaterialFlowNodeKind {
  const k = String(kind ?? "").toLowerCase();

  if (k === "supplier") return "supplier";
  if (k === "component") return "component";
  if (k === "subassembly") return "subassembly";
  if (k === "finished_good") return "finished_good";
  if (k === "order") return "order";
  if (k === "inventory") return "inventory";

  return "unknown";
}

function normalizeEdgeRelation(
  relation: string
): "consumes" | "produces" | "supplies" | "depends_on" {
  const r = String(relation ?? "").toLowerCase();

  if (r === "produces") return "produces";
  if (r === "supplies") return "supplies";
  if (r === "depends_on") return "depends_on";

  return "consumes";
}

function assignLevels(
  nodeMap: Map<string, MaterialFlowNode>,
  edges: MaterialFlowEdge[]
): number {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodeMap.values()) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const e of edges) {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    outgoing.set(e.from, [...(outgoing.get(e.from) ?? []), e.to]);
  }

  const queue: string[] = [];
  for (const [id, deg] of incoming.entries()) {
    if (deg === 0) queue.push(id);
  }

  const levelMap = new Map<string, number>();
  for (const id of queue) levelMap.set(id, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levelMap.get(current) ?? 0;

    for (const next of outgoing.get(current) ?? []) {
      const nextLevel = Math.max(levelMap.get(next) ?? 0, currentLevel + 1);
      levelMap.set(next, nextLevel);

      incoming.set(next, (incoming.get(next) ?? 1) - 1);
      if ((incoming.get(next) ?? 0) <= 0) {
        queue.push(next);
      }
    }
  }

  let maxDepth = 0;

  for (const [id, level] of levelMap.entries()) {
    const node = nodeMap.get(id);
    if (!node) continue;

    nodeMap.set(id, {
      ...node,
      level,
    });

    if (level > maxDepth) maxDepth = level;
  }

  return maxDepth;
}

function computeTopologyConfidence(
  nodeMap: Map<string, MaterialFlowNode>,
  edges: MaterialFlowEdge[],
  bomEdgeCount: number
): number {
  const nodeCount = nodeMap.size;
  const edgeCount = edges.length;

  if (nodeCount === 0) return 0;

  let confidence = 0;

  if (nodeCount > 0) confidence += 0.2;
  if (edgeCount > 0) confidence += 0.3;
  if (bomEdgeCount > 0) confidence += 0.3;
  if (edgeCount >= nodeCount / 2) confidence += 0.2;

  return round3(Math.min(1, confidence));
}

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function uniq(xs: string[]): string[] {
  return Array.from(new Set(xs));
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}