// core/src/simulation/materialFlow.simulator.ts
// ======================================================
// PlannerAgent — Material Flow Simulator
// ======================================================

export interface MaterialNode {

  sku: string;

}

export interface MaterialEdge {

  parent: string;

  component: string;

  qty: number;

}

export function simulateMaterialFlow(params: {

  bom: MaterialEdge[]

  demand: Map<string, number>

  inventory: Map<string, number>

}) {

  const shortages = new Map<string, number>();

  for (const edge of params.bom) {

    const demand = params.demand.get(edge.parent) ?? 0;

    const required = demand * edge.qty;

    const available = params.inventory.get(edge.component) ?? 0;

    if (available < required) {

      shortages.set(
        edge.component,
        required - available
      );

    }

  }

  return shortages;

}