// core/src/topology/topology.builder.ts
// ======================================================
// PlannerAgent — Operational Topology Builder
// Canonical Source of Truth
// ======================================================

import { TopologyGraph } from "./topology.graph";
import { OperationalTopology } from "./topology.types";

import { buildTopologyFromBom } from "./topology.fromBom";
import { buildTopologyFromMovements } from "./topology.fromMovements";

export function buildOperationalTopology(params: {
  orders?: any[];
  inventory?: any[];
  movements?: any[];
  inferredBom?: any;
}): OperationalTopology {

  const graph = new TopologyGraph();

  // Orders → finished goods nodes

  for (const order of params.orders ?? []) {

    const sku = order.sku ?? order.article;

    if (!sku) continue;

    graph.addNode({
      id: sku,
      kind: "finished_good"
    });

  }

  // Inventory nodes

  for (const inv of params.inventory ?? []) {

    const sku = inv.sku ?? inv.article;

    if (!sku) continue;

    graph.addNode({
      id: sku,
      kind: "inventory"
    });

  }

  // Movements inference

  buildTopologyFromMovements(
    graph,
    params.movements
  );

  // BOM inference

  buildTopologyFromBom(
    graph,
    params.inferredBom
  );

  return graph.build();

}
