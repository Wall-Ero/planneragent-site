// core/src/topology/topology.types.ts
// ======================================================
// PlannerAgent — Operational Topology Types
// Canonical Source of Truth
// ======================================================

export type NodeKind =
  | "supplier"
  | "component"
  | "subassembly"
  | "finished_good"
  | "order"
  | "inventory";

export type EdgeRelation =
  | "consumes"
  | "produces"
  | "supplies"
  | "depends_on"
  | "available";

export type TopologyNode = {
  id: string;
  kind: NodeKind;
};

export type TopologyEdge = {
  from: string;
  to: string;
  relation: EdgeRelation;
  weight?: number;
};

export type OperationalTopology = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
};

