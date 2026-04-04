// core/src/sandbox/dl.topology.builder.v1.ts
// ======================================================
// PlannerAgent — Topology Builder v1
// Canonical Source of Truth
// ======================================================

type NodeId = string;

type Edge = {
  from: NodeId;
  to: NodeId;
  type: "CONSUMPTION" | "PRODUCTION";
};

type TopologyGraph = {
  nodes: Set<NodeId>;
  edges: Edge[];
};

export type TopologyEvidence = {
  nodes: number;
  edges: number;
  isolatedNodes: string[];
  topologyConfidence: number;
  signals: string[];
};

/* =====================================================
 MAIN
===================================================== */

export function buildTopologyEvidence(input: {
  inventory?: { sku: string; qty: number }[];
  movmag?: { sku: string; qty: number; type?: string }[];
}): TopologyEvidence {

  const inventory = input.inventory ?? [];
  const movmag = input.movmag ?? [];

  const nodes = new Set<NodeId>();
  const edges: Edge[] = [];
  const signals: string[] = [];

  /* =====================================================
   NODES FROM INVENTORY
  ===================================================== */

  for (const row of inventory) {
    if (row.sku) {
      nodes.add(row.sku);
    }
  }

  /* =====================================================
   EDGES FROM MOVMAG (VERY SIMPLE INFERENCE)
  ===================================================== */

  const consumption = movmag.filter(m => m.qty < 0);
  const production = movmag.filter(m => m.qty > 0);

  for (const c of consumption) {
    for (const p of production) {
      edges.push({
        from: c.sku,
        to: p.sku,
        type: "CONSUMPTION"
      });
    }
  }

  /* =====================================================
   ISOLATED NODES
  ===================================================== */

  const connected = new Set<string>();

  for (const e of edges) {
    connected.add(e.from);
    connected.add(e.to);
  }

  const isolatedNodes = [...nodes].filter(n => !connected.has(n));

  /* =====================================================
   CONFIDENCE
  ===================================================== */

  let confidence = 0;

  if (nodes.size > 0) confidence += 0.3;
  if (edges.length > 0) confidence += 0.5;
  if (isolatedNodes.length === 0) confidence += 0.2;

  confidence = Math.max(0, Math.min(1, confidence));

  /* =====================================================
   SIGNALS
  ===================================================== */

  signals.push(`topology_nodes=${nodes.size}`);
  signals.push(`topology_edges=${edges.length}`);
  signals.push(`topology_isolated=${isolatedNodes.length}`);
  signals.push(`topology_confidence=${confidence.toFixed(3)}`);

  return {
    nodes: nodes.size,
    edges: edges.length,
    isolatedNodes,
    topologyConfidence: confidence,
    signals
  };
}
