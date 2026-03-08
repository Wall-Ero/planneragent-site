// src/sandbox/reality/inferBomFromProduction.v1.ts
// ======================================================
// PlannerAgent — BOM Inference from Production Reality
// v1 Deterministic Evidence Generator
// Canonical Source of Truth
//
// Reconstructs operational BOM from:
// - MOVORD (production output)
// - MOVMAG (warehouse consumption)
//
// No heuristics beyond:
// median aggregation
// variance calculation
// ======================================================

export type MovOrdRow = {
  order: string
  article: string
  quantity: number
  date?: string
}

export type MovMagRow = {
  order?: string
  article: string
  quantity: number
  causale?: string
  type?: string
  date?: string
}

export type BomComponentEvidence = {
  component: string
  median_ratio: number
  mean_ratio: number
  variance: number
  samples: number
}

export type InferredBom = {
  parent: string
  components: BomComponentEvidence[]
  confidence: number
}

export type BomInferenceResult = {
  bom: InferredBom[]
  signals: string[]
}

export function inferBomFromProduction(
  movord: MovOrdRow[],
  movmag: MovMagRow[]
): BomInferenceResult {

  const signals: string[] = []

  const orders = new Map<string, MovOrdRow>()

  for (const row of movord) {
    if (!row.order) continue
    orders.set(row.order, row)
  }

  const componentUsage: Map<
    string,
    Map<string, number[]>
  > = new Map()

  for (const m of movmag) {

    if (!m.order) continue

    const ord = orders.get(m.order)
    if (!ord) continue

    const parent = ord.article
    const producedQty = Math.max(1, ord.quantity)

    const consumed = Math.abs(m.quantity)

    if (consumed === 0) continue

    const ratio = consumed / producedQty

    const compMap =
      componentUsage.get(parent) ??
      new Map<string, number[]>()

    const arr =
      compMap.get(m.article) ?? []

    arr.push(ratio)

    compMap.set(m.article, arr)

    componentUsage.set(parent, compMap)
  }

  const result: InferredBom[] = []

  for (const [parent, comps] of componentUsage) {

    const components: BomComponentEvidence[] = []

    for (const [component, ratios] of comps) {

      if (ratios.length === 0) continue

      const mean =
        ratios.reduce((a, b) => a + b, 0) / ratios.length

      const variance =
        ratios.reduce(
          (s, x) => s + Math.pow(x - mean, 2),
          0
        ) / ratios.length

      const sorted = [...ratios].sort((a, b) => a - b)

      const mid = Math.floor(sorted.length / 2)

      const median =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid]

      components.push({
        component,
        median_ratio: round3(median),
        mean_ratio: round3(mean),
        variance: round6(variance),
        samples: ratios.length
      })

      if (variance > 0.2) {
        signals.push(
          `component_variance_high:${parent}->${component}`
        )
      }
    }

    const confidence =
      clamp01(
        components.length > 0
          ? components.reduce(
              (s, c) => s + Math.min(1, c.samples / 5),
              0
            ) / components.length
          : 0
      )

    result.push({
      parent,
      components,
      confidence: round3(confidence)
    })
  }

  return {
    bom: result,
    signals
  }
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000
}

function round6(x: number) {
  return Math.round(x * 1_000_000) / 1_000_000
}
