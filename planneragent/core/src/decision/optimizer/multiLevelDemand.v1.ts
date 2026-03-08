// src/decision/optimizer/multiLevelDemand.v1.ts
// ======================================================
// PlannerAgent — Multi-Level Demand Propagation
// Canonical Snapshot
// Source of Truth
//
// Purpose
// Expand demand across an inferred multi-level BOM graph.
// Deterministic, auditable, no recursion side-effects.
// ======================================================

export type BomEdge = {
  parent: string
  component: string
  ratio: number
}

export type DemandRow = {
  sku: string
  qty: number
}

export type ExpandedDemandRow = {
  sku: string
  required: number
  level: number
  path: string[]
}

export function expandMultiLevelDemand(
  roots: DemandRow[],
  bom: BomEdge[],
  opts?: { maxDepth?: number }
): ExpandedDemandRow[] {

  const maxDepth = Math.max(1, Math.min(12, Math.round(opts?.maxDepth ?? 6)))

  const out: ExpandedDemandRow[] = []
  const queue: Array<{ sku: string; qty: number; level: number; path: string[] }> = []

  for (const root of roots) {
    if (!root.sku || root.qty <= 0) continue
    queue.push({
      sku: root.sku,
      qty: root.qty,
      level: 0,
      path: [root.sku]
    })
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    out.push({
      sku: current.sku,
      required: current.qty,
      level: current.level,
      path: current.path
    })

    if (current.level >= maxDepth) continue

    const children = bom.filter((b) => b.parent === current.sku)

    for (const child of children) {
      const childQty = current.qty * child.ratio
      if (childQty <= 0) continue

      queue.push({
        sku: child.component,
        qty: childQty,
        level: current.level + 1,
        path: [...current.path, child.component]
      })
    }
  }

  return aggregateExpandedDemand(out)
}

function aggregateExpandedDemand(
  rows: ExpandedDemandRow[]
): ExpandedDemandRow[] {

  const map = new Map<string, ExpandedDemandRow>()

  for (const row of rows) {
    const key = `${row.sku}::${row.level}`

    const prev = map.get(key)

    if (!prev) {
      map.set(key, {
        sku: row.sku,
        required: row.required,
        level: row.level,
        path: row.path
      })
      continue
    }

    map.set(key, {
      sku: row.sku,
      required: prev.required + row.required,
      level: row.level,
      path: prev.path.length <= row.path.length ? prev.path : row.path
    })
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return a.sku.localeCompare(b.sku)
  })
}
