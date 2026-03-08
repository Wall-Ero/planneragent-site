// core/src/decision/optimizer/demandPropagation.v1.ts
// ======================================================
// PlannerAgent — Demand Propagation
// Canonical Source of Truth
//
// Computes multi-level demand propagation through BOM
// ======================================================

export interface DemandRow {
  sku: string
  qty: number
}

export interface BomEdge {
  parent: string
  component: string
  ratio: number
}

export function propagateDemand(
  demand: DemandRow[],
  bom: BomEdge[]
): Map<string, number> {

  const result = new Map<string, number>()

  for (const d of demand) {

    const stack = [{ sku: d.sku, qty: d.qty }]

    while (stack.length) {

      const node = stack.pop()!

      result.set(
        node.sku,
        (result.get(node.sku) ?? 0) + node.qty
      )

      for (const edge of bom) {

        if (edge.parent !== node.sku) continue

        stack.push({
          sku: edge.component,
          qty: node.qty * edge.ratio
        })

      }

    }

  }

  return result
}