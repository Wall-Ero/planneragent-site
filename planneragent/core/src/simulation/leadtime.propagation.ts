// core/src/simulation/leadtime.propagation.ts
// ======================================================
// PlannerAgent — Lead Time Propagation
// Canonical Source of Truth
//
// Propagates delays across material graph
// ======================================================

export interface LeadTimeEdge {
  parent: string
  component: string
  leadtime: number
}

export function propagateLeadtime(
  delays: Map<string, number>,
  edges: LeadTimeEdge[]
): Map<string, number> {

  const result = new Map(delays)

  let changed = true

  while (changed) {

    changed = false

    for (const edge of edges) {

      const compDelay = result.get(edge.component)

      if (compDelay === undefined) continue

      const newDelay = compDelay + edge.leadtime

      if (
        !result.has(edge.parent) ||
        newDelay > result.get(edge.parent)!
      ) {

        result.set(edge.parent, newDelay)
        changed = true

      }

    }

  }

  return result

}
