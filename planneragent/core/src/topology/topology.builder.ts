// core/src/topology/topology.builder.ts
// ======================================================
// PlannerAgent — Operational Topology Builder
// Canonical Source of Truth (v1.3)
// ======================================================

import { TopologyGraph } from "./topology.graph";
import { OperationalTopology } from "./topology.types";

import { buildTopologyFromBom } from "./topology.fromBom";
import { buildTopologyFromMovements } from "./topology.fromMovements";

import { normalizeInventory } from "../normalization/inventory.normalizer";
import { normalizeMovements } from "../normalization/movements.normalizer";

import {
  reconstructInventoryFromMovements,
  shouldReconstructInventory
} from "../reconstruction/inventory.reconstruction";

// ======================================================
// MAIN
// ======================================================

export function buildOperationalTopology(params: {
  orders?: any[];
  inventory?: any[];
  movements?: any[];
  movmag?: any[];
  inferredBom?: any;
}): OperationalTopology {
  const graph = new TopologyGraph();

  // --------------------------------------------------
  // ORDERS → finished goods
  // --------------------------------------------------

  for (const order of params.orders ?? []) {
    const sku = order.sku ?? order.article;

    if (!sku) continue;

    graph.addNode({
      id: sku,
      kind: "finished_good"
    });
  }

  // --------------------------------------------------
  // NORMALIZATION
  // --------------------------------------------------

  const rawMovements = params.movements ?? params.movmag ?? [];

  const normalizedMovements = normalizeMovements(rawMovements);

  let normalizedInventory = normalizeInventory(
    params.inventory ?? []
  );

  // --------------------------------------------------
  // DEBUG INPUT
  // --------------------------------------------------

  console.log("MOVEMENTS_RAW", rawMovements);
  console.log("MOVEMENTS_NORMALIZED", normalizedMovements);

  console.log("INVENTORY_RAW", params.inventory ?? []);
  console.log("INVENTORY_NORMALIZED_INITIAL", normalizedInventory);

  // --------------------------------------------------
  // RECONSTRUCTION TRIGGER
  // --------------------------------------------------

  if (shouldReconstructInventory(normalizedInventory)) {
    console.log("⚠️ INVENTORY EMPTY → RECONSTRUCTING FROM MOVEMENTS");

    console.log("RECONSTRUCTION_TRIGGERED", {
      inputInventory: normalizedInventory,
      movementsCount: normalizedMovements.length
    });

    normalizedInventory = reconstructInventoryFromMovements(
      normalizedMovements
    );
  }

  // --------------------------------------------------
  // FINAL STATE
  // --------------------------------------------------

  console.log("INVENTORY_FINAL", normalizedInventory);

  // --------------------------------------------------
  // MOVEMENTS + INVENTORY → topology
  // --------------------------------------------------

  buildTopologyFromMovements(
    graph,
    normalizedMovements,
    normalizedInventory
  );

  // --------------------------------------------------
  // BOM (optional)
  // --------------------------------------------------

  buildTopologyFromBom(
    graph,
    params.inferredBom
  );

  // --------------------------------------------------
  // BUILD
  // --------------------------------------------------

  return graph.build();
}