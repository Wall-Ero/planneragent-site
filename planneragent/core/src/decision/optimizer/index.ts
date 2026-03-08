// src/decision/optimizer/index.ts
// ======================================================
// PlannerAgent Optimizer v1
// Canonical Snapshot
// Source of Truth
//
// Responsibilities
// - evaluate material shortages
// - use inferred BOM
// - expand demand multi-level
// - propose operational actions
// ======================================================

import { expandMultiLevelDemand } from "./multiLevelDemand.v1"

export type OptimizerInput = {
  requestId: string
  plan: string
  asOf: string

  orders: any[]
  inventory: any[]
  movements: any[]

  baseline_metrics?: Record<string, number>
  scenario_metrics?: Record<string, number>
  constraints_hint?: Record<string, unknown>
  dlSignals?: Record<string, number>

  inferredBom?: {
    parent: string
    component: string
    ratio: number
  }[]
}

export async function runOptimizerV1(
  input: OptimizerInput
) {
  const actions: any[] = []
  const candidates: any[] = []

  const bom = input.inferredBom ?? []

  const rootDemand = (input.orders ?? [])
    .filter((o: any) => o?.sku && (o?.qty ?? 0) > 0)
    .map((o: any) => ({
      sku: o.sku,
      qty: o.qty
    }))

  const expandedDemand =
    bom.length > 0
      ? expandMultiLevelDemand(rootDemand, bom)
      : rootDemand.map((d: any) => ({
          sku: d.sku,
          required: d.qty,
          level: 0,
          path: [d.sku]
        }))

  for (const demand of expandedDemand) {
    if (demand.level === 0) continue

    const inv = (input.inventory ?? []).find(
      (i: any) => i.sku === demand.sku
    )

    const onHand =
      inv?.onHand ??
      inv?.on_hand ??
      inv?.qty ??
      0

    const shortage = demand.required - onHand

    if (shortage > 0) {
      candidates.push({
        type: "MATERIAL_SHORTAGE",
        sku: demand.sku,
        shortage,
        level: demand.level,
        path: demand.path
      })

      actions.push({
        action: "EXPEDITE_SUPPLIER",
        sku: demand.sku,
        qty: shortage,
        level: demand.level
      })
    }
  }

  const bestScore =
    candidates.length > 0
      ? Math.min(1, candidates.length * 0.3)
      : 0

  return {
    best: {
      score: bestScore,
      actions
    },
    candidates
  }
}
