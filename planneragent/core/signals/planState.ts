// planneragent/core/signals/planState.ts
// =====================================================
// Plan State — Canonical Type
// Represents coherence of the operational plan
// =====================================================

export type PlanState =
  | "COHERENT"
  | "SOME_GAPS"
  | "INCOHERENT";