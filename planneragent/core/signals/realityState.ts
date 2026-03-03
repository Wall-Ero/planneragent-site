// planneragent/core/signals/realityState.ts
// =====================================================
// Reality State — Canonical Type
// Represents alignment between plan and real operations
// =====================================================

export type RealityState =
  | "ALIGNED"
  | "DRIFTING"
  | "MISALIGNED";