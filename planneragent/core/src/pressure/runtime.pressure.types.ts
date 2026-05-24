// core/src/pressure/runtime.pressure.types.ts
// ============================================================
// PlannerAgent — Runtime Governance Pressure Types
// Canonical Source of Truth
// ============================================================

export type GovernancePressureLevel =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type GovernancePressureTrend =
  | "STABLE"
  | "INCREASING"
  | "DECREASING"
  | "VOLATILE";

export type GovernancePressureDomain =
  | "STRUCTURAL_FRICTION"
  | "WORKFLOW_FATIGUE"
  | "EXCEPTION_RECURRENCE"
  | "PROCESS_INSTABILITY"
  | "GOVERNANCE_SATURATION";

export type StabilizationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface GovernancePressureEvidence {

  rollbackRate: number;

  overrideRate: number;

  correctionFailureRate: number;

  repeatedApprovals: number;

  manualInterventions: number;

  recurringExceptions: number;

  unstableExecutions: number;

  reconciliationVolatility: number;

  decisionChurn: number;

  delegatedExecutionLoad: number;

  governanceReviews: number;

  unresolvedGovernancePressure: number;
}

export interface GovernancePressureBreakdown {

  structuralFriction: number;

  workflowFatigue: number;

  exceptionRecurrence: number;

  processInstability: number;

  governanceSaturation: number;
}

export interface GovernancePressureResult {

  level: GovernancePressureLevel;

  trend: GovernancePressureTrend;

  dominantPressure: GovernancePressureDomain;

  stabilizationRisk: StabilizationRisk;

  breakdown: GovernancePressureBreakdown;

  pressureScore: number;

  summary: string[];

  governanceRelevant: boolean;
}