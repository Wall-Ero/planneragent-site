// core/src/sandbox/contracts.v2.ts
// ======================================================
// PlannerAgent — Sandbox Contracts V2
// Canonical Source of Truth (EXTENDED, NOT REDUCED)
// + IMPROVE + CAPABILITY GOVERNANCE
// ======================================================

import type { DataAwarenessLevel } from "../reality/reality.types";

/* =====================================================
 PLAN TIERS
===================================================== */

export type PlanTier =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

/* =====================================================
 DOMAIN
===================================================== */

export type PlanningDomain =
  | "supply_chain"
  | "production"
  | "logistics"
  | "general";

/* =====================================================
 🔥 INTENT (NUOVO BLOCCO FORTE)
===================================================== */

export type Intent =
  | "INFORM"
  | "ADVISE"
  | "EXECUTE"
  | "IMPROVE"; // 🔥 fondamentale

/* =====================================================
 SIGNAL UI
===================================================== */

export type DataAwarenessState = "SNAPSHOT" | "BEHAVIORAL" | "STRUCTURAL";

export type PlanState = "COHERENT" | "SOME_GAPS" | "INCOHERENT";

export type RealityState =
  | "ALIGNED"
  | "DRIFTING"
  | "MISALIGNED"
  | "ASSUMED";

export type DecisionPressureState = "LOW" | "MEDIUM" | "HIGH";

export interface UiSignalsV1 {
  data_awareness: DataAwarenessState;
  plan: PlanState;
  reality: RealityState;
  decision_pressure: DecisionPressureState;
}

export interface DatasetDescriptor {
  hasSnapshot: boolean;
  hasBehavioralEvents: boolean;
  hasStructuralData: boolean;
}

export interface DatasetClassificationResult {
  level: "SNAPSHOT" | "BEHAVIORAL" | "STRUCTURAL";
}

/* =====================================================
 HEALTH
===================================================== */

export type Health =
  | "ok"
  | "degraded"
  | "failed";

/* =====================================================
 REQUEST
===================================================== */

export interface SandboxEvaluateRequestV2 {

  request_id: string;

  company_id: string;

  actor_id?: string;

  plan: PlanTier;

  intent: string; // 🔥 lasciato compatibile (non rompiamo runtime)

  domain: PlanningDomain;

  dataset_descriptor?: {
    awareness_level?: DataAwarenessLevel;
  };

  baseline_metrics?: Record<string, number>;

  scenario_metrics?: Record<string, number>;

  snapshot?: unknown;

  baseline_snapshot_id?: string;

  constraints_hint?: Record<string, unknown>;

  orders?: unknown[];

  inventory?: unknown[];

  movements?: unknown[];

  movord?: unknown[];

  movmag?: unknown[];

  masterBom?: unknown[];

  bom_reference?: "MASTER" | "PLAN" | "REALITY";

  selected_bom_reference?: "MASTER" | "PLAN" | "REALITY";
}

/* =====================================================
 SCENARIOS
===================================================== */

export type ScenarioV2 = {

  id: string;

  title: string;

  summary: string;

  confidence: number;

};

/* =====================================================
 ADVISORY
===================================================== */

export type ScenarioAdvisoryV2 = {

  one_liner: string;

  key_signals?: string[];

  labels?: string[];

  questions?: string[];

};

/* =====================================================
 DL EVIDENCE
===================================================== */

export type DlEvidenceV2 = {

  demand_forecast: {
    p50: number;
    p90?: number;
  };

  risk_score: {
    stockout_risk: number;
    supplier_dependency: number;
  };

  assumptions?: number;

  topologyConfidence?: {
    confidence: number;
    signals?: string[];
  };

  anomaly_signals: string[];

};

/* =====================================================
 PRESSURE
===================================================== */

export type DecisionPressureLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DecisionPressure = {

  level: DecisionPressureLevel;

  score: number;

  should_intervene: boolean;

};

/* =====================================================
 OPTIMIZER
===================================================== */

export type OptimizerResultV2 = {

  best_score: number | null;

  actions: unknown[];

  candidates: number;

};

/* =====================================================
 🔥 CAPABILITY EXECUTION (NUOVO BLOCCO)
===================================================== */

export type CapabilityExecutionStatus =
  | "EXECUTED"
  | "PENDING_APPROVAL"
  | "SKIPPED"
  | "FALLBACK_TO_RUNTIME"
  | "FAILED";

export type CapabilityExecutionRecord = {

  action_index: number;

  action_type: string;

  capability_id?: string;

  status: CapabilityExecutionStatus;

  provider?: string;

  result?: unknown;

  error?: string;

};

export type ExecutionEngine =
  | "CAPABILITY"
  | "RUNTIME"
  | "HYBRID";

/* =====================================================
 EXECUTION PREVIEW (esteso)
===================================================== */

export type ExecutionMode =
  | "DIRECT"
  | "AGENT";

export type ExecutionIntentPreview = {

  action_kind: string;

  capability_id: string;

  mode: ExecutionMode;

  payload: Record<string, unknown>;

  rationale?: string;

};

/* =====================================================
 GOVERNANCE (esteso)
===================================================== */

export type GovernanceResult = {

  execution_allowed: boolean;

  reason: string;

  // 🔥 NEW — audit layer
  anomaly?: boolean;

  anomaly_reasons?: string[];

  required_actions?: unknown[];

  reality_score?: number | null;

  correction_effect?: "FULL" | "PARTIAL" | "NONE";

  // 🔥 NEW — IMPROVE
  improvement_mode?: boolean;

  // 🔥 NEW — execution engine visibility
  capability_mode?: ExecutionEngine | "DISABLED";

};

/* =====================================================
 🔥 EXPLANATION
===================================================== */

export type DecisionExplanation = {
  summary: string;
  whyChosen: string[];
  tradeoffs: string[];
  risks: string[];
};

/* =====================================================
 🔥 EXECUTION RESULT (NUOVO BLOCCO)
===================================================== */

export type ExecutionResultV2 = {

  capabilities?: CapabilityExecutionRecord[];

  intents?: unknown[];

  results?: unknown[];

  trace?: unknown[];

  engine?: ExecutionEngine;

};

/* =====================================================
 RESPONSE
===================================================== */

export interface SandboxEvaluateResponseV2 {

  ok: boolean;

  request_id: string;

  plan?: PlanTier;

  intent?: string;

  domain?: PlanningDomain;

  signals?: unknown;

  advisory?: ScenarioAdvisoryV2;

  pressure?: DecisionPressure;

  optimizer?: OptimizerResultV2;

  scenarios?: ScenarioV2[];

  execution_preview?: ExecutionIntentPreview[];

  governance?: GovernanceResult;

  execution?: ExecutionResultV2; // 🔥 NEW

  explanation?: DecisionExplanation;

  issued_at?: string;

  reason?: string;

  policy_used?: import("../decision/policy/policy.schema.v1").PolicyRules;
}