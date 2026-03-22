// core/src/decision/decision.reality.adapter.ts
// ============================================================
// Reality Adapter — VISION → DECISION SAFE CONTRACT
// Canonical Source of Truth
// ============================================================

export interface DecisionRealitySnapshot {
  [key: string]: unknown // 👈 QUESTA È LA CHIAVE

  inventorySeen: number
  ordersSeen: number
  shortagesDetected: number
}

export function adaptRealitySnapshot(
  input: Record<string, unknown>
): DecisionRealitySnapshot {

  return {
    inventorySeen: toNumber(input["inventorySeen"]),
    ordersSeen: toNumber(input["ordersSeen"]),
    shortagesDetected: toNumber(input["shortagesDetected"])
  }
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}