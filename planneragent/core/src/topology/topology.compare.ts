// core/src/topology/topology.compare.ts
// ======================================================
// Path: core/src/topology/topology.compare.ts
// PlannerAgent — Topology Comparison Engine
// Canonical Snapshot · Source of Truth
// ======================================================

import type {
  TopologyEdge,
  TopologyGraph,
} from "./topology.builder.v2";

import type { TopologyLayers } from "./topology.layers.builder";

export type TopologyComparison = {
  bomDrift: boolean;
  missingConsumption: boolean;
  unexpectedConsumption: boolean;
  orderBomDrift: boolean;
  alignmentScore: number;
  missingInMovements: TopologyEdge[];
  unexpectedInMovements: TopologyEdge[];
  missingInOrders: TopologyEdge[];
  signals: string[];
};

function comparableEdgeKey(edge: TopologyEdge): string {
  return [edge.from, edge.to].join("::");
}

function filterRelevantEdges(graph: TopologyGraph, kinds: string[]): TopologyEdge[] {
  return (graph.edges ?? []).filter((edge) => kinds.includes(edge.kind));
}

function diffEdges(
  referenceEdges: TopologyEdge[],
  candidateEdges: TopologyEdge[]
): TopologyEdge[] {
  const candidateKeys = new Set(candidateEdges.map(comparableEdgeKey));
  return referenceEdges.filter((edge) => !candidateKeys.has(comparableEdgeKey(edge)));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function compareTopologyLayers(layers: TopologyLayers): TopologyComparison {
  const signals: string[] = [];

  const movementEdges = filterRelevantEdges(layers.fromMovements, [
    "CONSUMPTION",
    "PRODUCTION",
  ]);

  const bomEdges = filterRelevantEdges(layers.fromBom, [
    "BOM",
  ]);

  const orderEdges = filterRelevantEdges(layers.fromOrders, [
    "ORDER_LINK",
  ]);

  const missingInMovements = diffEdges(bomEdges, movementEdges);
  const unexpectedInMovements = diffEdges(movementEdges, bomEdges);
  const missingInOrders = diffEdges(bomEdges, orderEdges);

  const missingConsumption = missingInMovements.length > 0;
  const unexpectedConsumption = unexpectedInMovements.length > 0;
  const orderBomDrift = missingInOrders.length > 0;
  const bomDrift = missingConsumption || unexpectedConsumption || orderBomDrift;

  if (bomDrift) {
    signals.push("BOM_DRIFT_DETECTED");
  }

  if (missingConsumption) {
    signals.push("MISSING_CONSUMPTION");
  }

  if (unexpectedConsumption) {
    signals.push("UNEXPECTED_CONSUMPTION");
  }

  if (orderBomDrift) {
    signals.push("ORDER_BOM_OUTDATED");
  }

  const referenceSize = Math.max(1, bomEdges.length);
  const driftCount =
    missingInMovements.length +
    unexpectedInMovements.length +
    missingInOrders.length;

  const alignmentScore = round3(
    Math.max(0, Math.min(1, 1 - driftCount / referenceSize))
  );

  signals.push(`topology_alignment=${alignmentScore.toFixed(3)}`);
  signals.push(`topology_bom_edges=${bomEdges.length}`);
  signals.push(`topology_movement_edges=${movementEdges.length}`);
  signals.push(`topology_order_edges=${orderEdges.length}`);

  return {
    bomDrift,
    missingConsumption,
    unexpectedConsumption,
    orderBomDrift,
    alignmentScore,
    missingInMovements,
    unexpectedInMovements,
    missingInOrders,
    signals,
  };
}