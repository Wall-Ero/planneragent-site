// core/src/topology/topology.graph.ts
// ======================================================
// PlannerAgent — Topology Graph Builder
// Canonical Source of Truth
// ======================================================

import {
  OperationalTopology,
  TopologyNode,
  TopologyEdge
} from "./topology.types";

export class TopologyGraph {

  private nodes = new Map<string, TopologyNode>();
  private edges: TopologyEdge[] = [];

  addNode(node: TopologyNode) {

    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
    }

  }

  addEdge(edge: TopologyEdge) {
    this.edges.push(edge);
  }

  build(): OperationalTopology {

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };

  }

}
