// core/src/topology/topology.layers.builder.ts
// ======================================================
// Path: core/src/topology/topology.layers.builder.ts
// PlannerAgent — Topology Layers Builder
// Canonical Snapshot · Source of Truth
// ======================================================

import {
  buildOperationalTopology,
  type TopologyGraph,
} from "./topology.builder.v2";

type InventoryRow = {
  sku?: string;
  qty?: number;
  warehouse?: string;
};

type MovementRow = {
  sku?: string;
  qty?: number;
  type?: string;
  event?: string;
  orderId?: string;
  commessa?: string;
  batch?: string;
  parentSku?: string;
  producedSku?: string;
  consumedSku?: string;
};

type BomRow = {
  parent?: string;
  component?: string;
  qty?: number;
};

type OrderRow = Record<string, unknown>;

export type TopologyLayers = {
  fromMovements: TopologyGraph;
  fromOrders: TopologyGraph;
  fromBom: TopologyGraph;
};

export function buildTopologyLayers(input: {
  inventory?: InventoryRow[];
  movements?: MovementRow[];
  movmag?: MovementRow[];
  orders?: OrderRow[];
  inferredBom?: BomRow[];
}): TopologyLayers {
  const inventory = input.inventory ?? [];
  const movements = input.movements ?? [];
  const movmag = input.movmag ?? [];
  const orders = input.orders ?? [];
  const inferredBom = input.inferredBom ?? [];

  const fromMovements = buildOperationalTopology({
    inventory,
    movements,
    movmag,
    orders: [],
    inferredBom: [],
  });

  const fromOrders = buildOperationalTopology({
    inventory,
    movements: [],
    movmag: [],
    orders,
    inferredBom: [],
  });

  const fromBom = buildOperationalTopology({
    inventory,
    movements: [],
    movmag: [],
    orders: [],
    inferredBom,
  });

  return {
    fromMovements,
    fromOrders,
    fromBom,
  };
}