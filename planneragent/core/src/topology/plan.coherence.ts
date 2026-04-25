// core/src/topology/plan.coherence.ts
// ======================================================
// PlannerAgent — Plan Coherence Engine v2
// Canonical Source of Truth
// PLAN ONLY — NO REALITY CONTAMINATION
// ======================================================

type PlanCoherenceInput = {
  orders?: any[];
  inferredBom?: any[];
  inferredBomQuality?: {
    hasParents?: boolean;
    hasComponents?: boolean;
    parentCount?: number;
    componentLinkCount?: number;
    linkCoverage?: number;
    avgComponentsPerParent?: number;
  } | null;

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

    parentCount: number;
    parentWithComponents: number;
    coverage: number;

    avgComponentsPerParent: number;
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

  // --------------------------------------------------
  // BASIC EXISTENCE
  // --------------------------------------------------

  const orderCount = orders.length;

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
        parentCount: 0,
        parentWithComponents: 0,
        coverage: 0,
        avgComponentsPerParent: 0,
      },
    };
  }

  // --------------------------------------------------
  // CONNECTIVITY (ORDERS GRAPH)
  // --------------------------------------------------

  const orderEdgeCount = orderEdges.length;

  const connectedRatio =
    orderNodes.length === 0
      ? 0
      : Math.min(1, orderEdgeCount / orderNodes.length);

  if (connectedRatio < 0.3) {
    reasons.push("LOW_ORDER_CONNECTIVITY");
  }

  // --------------------------------------------------
  // BOM STRUCTURE
  // --------------------------------------------------

  const bomEdgeCount = bomEdges.length;

const hasBomFromSystem = bomEdgeCount > 0;
const hasBomFromOrders = orderEdgeCount > 0;

const hasStrongOrderStructure =
  orderEdgeCount >= 2 && orderCount >= 2;

const hasStructuralPlan =
  hasBomFromSystem || hasStrongOrderStructure;

 if (!hasStructuralPlan) {
  reasons.push("NO_STRUCTURAL_PLAN");
}

  // --------------------------------------------------
  // BOM QUALITY (CRUCIALE)
  // --------------------------------------------------
const q = input.inferredBomQuality;

  const parentCount = q?.parentCount ?? 0;

  const componentLinkCount = q?.componentLinkCount ?? 0;

  const parentWithComponents =
    q?.hasComponents ? parentCount : 0;

  const coverage =
    typeof q?.linkCoverage === "number"
      ? q.linkCoverage
      : 0;

  const avgComponentsPerParent =
    typeof q?.avgComponentsPerParent === "number"
      ? q.avgComponentsPerParent
      : 0;

  if (!q?.hasParents) {
    reasons.push("NO_BOM_PARENTS");
  }

  if (!q?.hasComponents) {
    reasons.push("NO_BOM_COMPONENTS");
  }


  if (coverage < 0.5) {
    reasons.push("LOW_BOM_COVERAGE");
  }

  if (avgComponentsPerParent < 1) {
    reasons.push("WEAK_BOM_STRUCTURE");
  }

  // --------------------------------------------------
  // SCORE (RIBILANCIATO)
  // --------------------------------------------------

  let score = 0;

  // esistenza piano
  score += 0.3;

  // connettività
  score += connectedRatio * 0.25;

  // struttura BOM
score += hasStructuralPlan ? 0.3 : 0;

  // coverage BOM
  score += coverage * 0.15;

  // profondità BOM
  score += Math.min(1, avgComponentsPerParent / 3) * 0.1;

  score = Math.max(0, Math.min(1, score));

  // --------------------------------------------------
  // CLASSIFICATION
  // --------------------------------------------------

  let level: PlanCoherenceResult["level"];

  if (score >= 0.75) {
    level = "COHERENT";
  } else if (score >= 0.45) {
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
      parentCount,
      parentWithComponents,
      coverage,
      avgComponentsPerParent,
    },
  };
}