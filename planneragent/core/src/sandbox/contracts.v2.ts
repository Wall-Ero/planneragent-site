// core/src/sandbox/contracts.v2.ts
// ======================================================
// PlannerAgent — Sandbox Contracts V2
// Canonical Source of Truth (EXTENDED, NOT REDUCED)
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
 DOMAIN (🔥 aggiunto, NON rompe nulla)
===================================================== */

export type PlanningDomain =
  | "supply_chain"
  | "production"
  | "logistics"
  | "general";

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

  domain: PlanningDomain;

  dataset_descriptor?: {
    awareness_level?: DataAwarenessLevel;
  };

  baseline_metrics?: Record<string, number>;

  scenario_metrics?: Record<string, number>; // 🔥 aggiunto

  snapshot?: unknown;

  baseline_snapshot_id?: string; // 🔥 aggiunto

  constraints_hint?: Record<string, unknown>; // 🔥 aggiunto

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
 SCENARIOS (🔥 RIAGGIUNTO)
===================================================== */

export type ScenarioV2 = {

  id: string;

  title: string;

  summary: string;

  confidence: number;

};

/* =====================================================
 ADVISORY (intatto)
===================================================== */

export type ScenarioAdvisoryV2 = {

  one_liner: string;

  key_signals?: string[];

  labels?: string[];

  questions?: string[];

};

/* =====================================================
 DL EVIDENCE (intatto)
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
 PRESSURE (intatto)
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
 OPTIMIZER (intatto)
===================================================== */

export type OptimizerResultV2 = {

  best_score: number | null;

  actions: unknown[];

  candidates: number;

};

/* =====================================================
 EXECUTION PREVIEW (intatto)
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
 GOVERNANCE (intatto)
===================================================== */

export type GovernanceResult = {

  execution_allowed: boolean;

  reason: string;

};

/* =====================================================
 🔥 EXPLANATION (NUOVO BLOCCO)
===================================================== */

export type DecisionExplanation = {
  summary: string;
  whyChosen: string[];
  tradeoffs: string[];
  risks: string[];
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

  explanation?: DecisionExplanation; // 🔥 aggiunto

  issued_at?: string;

  reason?: string;

  policy_used?: import("../decision/policy/policy.schema.v1").PolicyRules;
  
}