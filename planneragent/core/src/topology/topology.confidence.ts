// core/src/topology/topology.confidence.ts
// ======================================================
// PlannerAgent — Topology Confidence
// Canonical Source of Truth
//
// Purpose
// Compute confidence of a discovered topology using:
// - node richness
// - edge richness
// - presence of BOM-like structure
// - presence of order linkage
// ======================================================

export type TopologyConfidenceInput = {
  nodes?: Array<{ id: string; kind?: string }>;
  edges?: Array<{ from: string; to: string; relation?: string; weight?: number }>;
};

export type TopologyConfidenceResult = {
  confidence: number;
  signals: string[];
};

export function computeTopologyConfidence(
  input: TopologyConfidenceInput
): TopologyConfidenceResult {
  const nodes = input.nodes ?? [];
  const edges = input.edges ?? [];

  let confidence = 0;
  const signals: string[] = [];

  if (nodes.length > 0) {
    confidence += 0.2;
    signals.push(`topology:nodes=${nodes.length}`);
  }

  if (edges.length > 0) {
    confidence += 0.25;
    signals.push(`topology:edges=${edges.length}`);
  }

  const consumesEdges = edges.filter((e) => String(e.relation ?? "").toLowerCase() === "consumes").length;
  if (consumesEdges > 0) {
    confidence += 0.25;
    signals.push(`topology:consumes_edges=${consumesEdges}`);
  }

  const orderNodes = nodes.filter((n) => String(n.kind ?? "").toLowerCase() === "order").length;
  if (orderNodes > 0) {
    confidence += 0.15;
    signals.push(`topology:order_nodes=${orderNodes}`);
  }

  const knownKinds = nodes.filter((n) => {
    const k = String(n.kind ?? "").toLowerCase();
    return k && k !== "unknown";
  }).length;

  if (nodes.length > 0) {
    confidence += Math.min(0.15, (knownKinds / nodes.length) * 0.15);
    signals.push(`topology:known_kinds=${knownKinds}`);
  }

  return {
    confidence: round3(Math.min(1, confidence)),
    signals,
  };
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}