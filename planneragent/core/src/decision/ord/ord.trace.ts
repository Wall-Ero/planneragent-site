// core/src/decision/ord/ord.trace.ts
// ============================================================
// ORD Decision Trace — Technical Layer
// Canonical Source of Truth
// ============================================================

export type OrdExecutionLevel =
  | "HUMAN"
  | "JUNIOR"
  | "SENIOR"
  | "SYSTEM"

export type OrdDecisionMode =
  | "HUMAN_APPROVED"
  | "DELEGATED_EXECUTION"
  | "OBSERVATION"

// ============================================================
// REALITY
// ============================================================

export interface OrdRealityState {
  ordersSeen: number
  inventorySeen: number
  shortagesDetected: number
}

// ============================================================
// OPTIMIZER
// ============================================================

export interface OrdOptimizerState {
  candidates: number
  bestScore: number
}

// ============================================================
// ACTIONS (UPDATED — ARRAY)
// ============================================================

export interface OrdActionState {
  kind: string
  sku?: string
  qty?: number
}

// ============================================================
// GOVERNANCE
// ============================================================

export interface OrdGovernanceState {
  executionAllowed: boolean
  reason: string
}

// ============================================================
// ROOT TRACE
// ============================================================

export interface OrdDecisionTrace {

  requestId: string
  issuedAt: string

  reality: OrdRealityState

  optimizer: OrdOptimizerState

  actions: OrdActionState[]

  governance: OrdGovernanceState

  executionLevel: OrdExecutionLevel

  decisionMode: OrdDecisionMode
}

// ============================================================
// BUILDER
// ============================================================

export function buildOrdDecisionTrace(input: {

  requestId: string

  ordersSeen: number
  inventorySeen: number
  shortagesDetected: number

  optimizerCandidates: number
  optimizerBestScore: number

  actions?: {
    kind: string
    sku?: string
    qty?: number
  }[]

  executionAllowed: boolean
  governanceReason: string

  executionLevel?: OrdExecutionLevel
  decisionMode?: OrdDecisionMode

}): OrdDecisionTrace {

  return {

    requestId: input.requestId,

    issuedAt: new Date().toISOString(),

    reality: {
      ordersSeen: input.ordersSeen,
      inventorySeen: input.inventorySeen,
      shortagesDetected: input.shortagesDetected
    },

    optimizer: {
      candidates: input.optimizerCandidates,
      bestScore: input.optimizerBestScore
    },

    actions: input.actions || [],

    governance: {
      executionAllowed: input.executionAllowed,
      reason: input.governanceReason
    },

    executionLevel: input.executionLevel || "SYSTEM",

    decisionMode: input.decisionMode || "OBSERVATION"
  }
}
