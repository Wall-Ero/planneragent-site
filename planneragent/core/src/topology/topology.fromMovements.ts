// core/src/topology/topology.fromMovements.ts
// ======================================================
// PlannerAgent — Topology from Movements
// Canonical Source of Truth
// ======================================================

import { TopologyGraph } from "./topology.graph";

export function buildTopologyFromMovements(
  graph: TopologyGraph,
  movements?: any[]
) {

  if (!movements) return;

  for (const m of movements) {

    const sku = m.sku ?? m.article;

    if (!sku) continue;

    graph.addNode({
      id: sku,
      kind: "inventory"
    });

  }

}
