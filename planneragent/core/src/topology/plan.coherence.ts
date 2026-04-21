// core/src/topology/plan.coherence.ts
// ======================================================
// PlannerAgent — Plan Coherence Engine v1
// Canonical Source of Truth
// Determines if a plan structurally exists (PLAN ONLY — NO REALITY)
// ======================================================

type PlanCoherenceInput = {
  orders?: any[];
  inferredBom?: any[];
  topologyLayers?: {
    fromOrders?: { nodes: any[]; edges: any[] };
    fromBom?: { nodes: any[]; edges: any[] };
  };
};

export type PlanCoherenceResult = {
  coherent: boolean;
  level: "COHERENT" | "SOME_GAPS" | "INCOHERENT";
  score: number;
  reasons: string[];
  metrics: {
    orderCount: number;
    orderEdges: number;
    bomEdges: number;
    connectedRatio: number;
  };
};

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function computePlanCoherence(
  input: PlanCoherenceInput
): PlanCoherenceResult {

  const orders = input.orders ?? [];
  const inferredBom = input.inferredBom ?? [];

  const orderNodes = input.topologyLayers?.fromOrders?.nodes ?? [];
  const orderEdges = input.topologyLayers?.fromOrders?.edges ?? [];

  const bomEdges = input.topologyLayers?.fromBom?.edges ?? [];

  const reasons: string[] = [];

  const orderCount = orders.length;
  const orderEdgeCount = orderEdges.length;
  const bomEdgeCount = bomEdges.length;

  // --------------------------------------------------
  // BASIC EXISTENCE
  // --------------------------------------------------

  if (orderCount === 0) {
    return {
      coherent: false,
      level: "INCOHERENT",
      score: 0,
      reasons: ["NO_ORDERS"],
      metrics: {
        orderCount: 0,
        orderEdges: 0,
        bomEdges: 0,
        connectedRatio: 0,
      },
    };
  }

  // --------------------------------------------------
  // CONNECTIVITY
  // --------------------------------------------------

  const connectedRatio =
    orderNodes.length === 0
      ? 0
      : Math.min(1, orderEdgeCount / orderNodes.length);

  if (connectedRatio < 0.3) {
    reasons.push("LOW_ORDER_CONNECTIVITY");
  }

  // --------------------------------------------------
  // BOM COVERAGE
  // --------------------------------------------------

  const hasBomStructure = bomEdgeCount > 0;

  if (!hasBomStructure) {
    reasons.push("NO_BOM_LINKS");
  }

  // --------------------------------------------------
  // STRUCTURAL SCORE
  // --------------------------------------------------

  let score = 0;

  // ordini esistono
  score += 0.4;

  // connettività
  score += connectedRatio * 0.3;

  // bom
  score += hasBomStructure ? 0.3 : 0;

  score = Math.max(0, Math.min(1, score));

  // --------------------------------------------------
  // CLASSIFICATION
  // --------------------------------------------------

  let level: PlanCoherenceResult["level"];

  if (score >= 0.75) {
    level = "COHERENT";
  } else if (score >= 0.4) {
    level = "SOME_GAPS";
  } else {
    level = "INCOHERENT";
  }

  const coherent = level !== "INCOHERENT";

  return {
    coherent,
    level,
    score,
    reasons,
    metrics: {
      orderCount,
      orderEdges: orderEdgeCount,
      bomEdges: bomEdgeCount,
      connectedRatio,
    },
  };
}