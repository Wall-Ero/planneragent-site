// core/src/decision/optimizer/constraintNormalizer.ts
// ======================================================
// PlannerAgent — Constraint Normalizer
// Canonical Source of Truth
//
// Converts heterogeneous constraints into normalized form
// ======================================================

export interface RawConstraint {

  type: string
  sku?: string
  value?: number

}

export interface NormalizedConstraint {

  type: "CAPACITY" | "SUPPLIER_LIMIT" | "EXPEDITE_LIMIT"
  sku?: string
  value: number

}

export function normalizeConstraints(
  constraints: RawConstraint[]
): NormalizedConstraint[] {

  const result: NormalizedConstraint[] = []

  for (const c of constraints ?? []) {

    if (!c.type) continue

    const t = c.type.toUpperCase()

    if (t === "CAPACITY") {

      result.push({
        type: "CAPACITY",
        sku: c.sku,
        value: Number(c.value ?? 0)
      })

    }

    if (t === "SUPPLIER_LIMIT") {

      result.push({
        type: "SUPPLIER_LIMIT",
        sku: c.sku,
        value: Number(c.value ?? 0)
      })

    }

    if (t === "EXPEDITE_LIMIT") {

      result.push({
        type: "EXPEDITE_LIMIT",
        sku: c.sku,
        value: Number(c.value ?? 0)
      })

    }

  }

  return result

}