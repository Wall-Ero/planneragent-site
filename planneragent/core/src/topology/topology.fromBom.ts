// core/src/topology/topology.fromBom.ts
// ======================================================
// PlannerAgent — Topology from BOM
// Canonical Source of Truth
// ======================================================

import { TopologyGraph } from "./topology.graph";

export function buildTopologyFromBom(
  graph: TopologyGraph,
  inferredBom?: any
) {

  if (!inferredBom?.bom) return;

  for (const parent of inferredBom.bom) {

    const parentId = parent.parent;

    graph.addNode({
      id: parentId,
      kind: "finished_good"
    });

    for (const component of parent.components) {

      const componentId = component.component;

      graph.addNode({
        id: componentId,
        kind: "component"
      });

      graph.addEdge({
        from: componentId,
        to: parentId,
        relation: "consumes",
        weight: component.median_ratio
      });

    }

  }

}
