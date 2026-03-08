// core/src/sandbox/reality/planRealityDiff.v1.ts
// ======================================================
// PlannerAgent — Plan vs Reality Diff
// Canonical Source of Truth
//
// Compares PLAN BOM vs REALITY BOM
// ======================================================

export type PlanComponentUsage = {
  parent: string
  component: string
  expected_ratio: number
}

export type RealityComponentUsage = {
  parent: string
  component: string
  actual_ratio: number
}

export type BomDiscrepancy = {
  parent: string
  component: string
  expected_ratio: number
  actual_ratio: number
  delta: number
}

export type PlanRealityDiff = {
  mismatches: BomDiscrepancy[]
  signals: string[]
}

export function comparePlanReality(
  planBom: PlanComponentUsage[],
  realityBom: RealityComponentUsage[]
): PlanRealityDiff {

  const signals: string[] = []
  const mismatches: BomDiscrepancy[] = []

  const realityMap = new Map<string, RealityComponentUsage>()

  for (const r of realityBom ?? []) {
    const key = `${r.parent}|${r.component}`
    realityMap.set(key, r)
  }

  for (const p of planBom ?? []) {

    const key = `${p.parent}|${p.component}`
    const r = realityMap.get(key)

    if (!r) {

      mismatches.push({
        parent: p.parent,
        component: p.component,
        expected_ratio: p.expected_ratio,
        actual_ratio: 0,
        delta: -p.expected_ratio
      })

      signals.push(`missing_component:${p.parent}->${p.component}`)
      continue

    }

    const delta = r.actual_ratio - p.expected_ratio

    if (Math.abs(delta) > 0.05) {

      mismatches.push({
        parent: p.parent,
        component: p.component,
        expected_ratio: p.expected_ratio,
        actual_ratio: r.actual_ratio,
        delta
      })

      signals.push(
        `bom_drift:${p.parent}->${p.component}:${delta.toFixed(3)}`
      )

    }

  }

  return {
    mismatches,
    signals
  }

}
