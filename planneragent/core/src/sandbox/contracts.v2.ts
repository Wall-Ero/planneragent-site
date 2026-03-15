// core/src/sandbox/contracts.v2.ts
// ======================================================
// PlannerAgent — Sandbox Contracts V2
// Canonical Source of Truth
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

  intent: string;

  domain: string;

  dataset_descriptor?: {
    awareness_level?: DataAwarenessLevel;
  };

  baseline_metrics?: Record<string, number>;

  snapshot?: unknown;

  /* optional raw datasets */

  orders?: unknown[];

  inventory?: unknown[];

  movements?: unknown[];

  movord?: unknown[];

  movmag?: unknown[];

  masterBom?: unknown[];

  /* SCM manual choice */

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
 EXECUTION PREVIEW
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
 GOVERNANCE
===================================================== */

export type GovernanceResult = {

  execution_allowed: boolean;

  reason: string;

};

/* =====================================================
 RESPONSE
===================================================== */

export interface SandboxEvaluateResponseV2 {

  ok: boolean;

  request_id: string;

  plan?: PlanTier;

  intent?: string;

  domain?: string;

  signals?: unknown[];

  advisory?: ScenarioAdvisoryV2;

  pressure?: DecisionPressure;

  optimizer?: OptimizerResultV2;

  scenarios?: ScenarioV2[];

  execution_preview?: ExecutionIntentPreview[];

  governance?: GovernanceResult;

  issued_at?: string;

  reason?: string;
}