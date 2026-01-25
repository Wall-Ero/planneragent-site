// src/sandbox/contracts.v2.ts
// ==========================================
// Sandbox Contracts v2 — Canonical
// Governance-first, audit-safe, enterprise-grade
//
// Principles:
// - BASIC = VISION (observe + sense, never advise, never execute)
// - JUNIOR = ADVISE (human approval required)
// - SENIOR = EXECUTE (delegated authority)
// - Snapshot is mandatory
// - LLMs are tools, never authorities
// ==========================================

/* ===============================
 * Core Enums
 * =============================== */

export type Health = "ok" | "degraded" | "failed";

export type PlanTier = "BASIC" | "JUNIOR" | "SENIOR";

export type PlanningDomain =
  | "supply_chain"
  | "production"
  | "logistics";

/* ===============================
 * Cognitive Intent (Closed Set)
 * =============================== */
// If it's not here, it does not exist in the system.

export type Intent =
  | "INFORM"   // display / explain / report
  | "SENSE"    // AI-assisted signal extraction (non-advisory)
  | "ADVISE"   // structured recommendation (human approval required)
  | "EXECUTE"; // delegated execution (SENIOR+ only)

/* ===============================
 * Authority Matrix (Documented Governance)
 * =============================== */
// This is governance-visible code. Auditors and boards can read this.

export const PLAN_INTENT_MATRIX: Record<PlanTier, Intent[]> = {
  BASIC: ["INFORM", "SENSE"],              // VISION
  JUNIOR: ["INFORM", "SENSE", "ADVISE"],  // Advisor
  SENIOR: ["INFORM", "SENSE", "ADVISE", "EXECUTE"], // Delegated operator
};

/* ===============================
 * Rate Policy
 * =============================== */

export type RateStatus = "OK" | "BURST" | "BLOCKED";

export type SandboxRateInfo = {
  status: RateStatus;
  /** ISO timestamp when the quota window resets (or next retry window) */
  reset_at: string;
  /** optional details for debugging / UI */
  reason?:
    | "QUOTA_EXCEEDED"
    | "BURST_EXCEEDED"
    | "DEBOUNCED"
    | "RATE_LIMITED"
    | "LOW_QUALITY";
};

/* ===============================
 * Request — Public API Surface
 * =============================== */

export type SandboxEvaluateRequestV2 = {
  /* ---- identity / routing ---- */
  company_id: string;
  plan: PlanTier;
  domain: PlanningDomain;

  /* ---- snapshot (MANDATORY) ---- */
  baseline_snapshot_id: string;

  /* ---- cognitive intent (MANDATORY) ---- */
  intent: Intent;

  /* ---- scenario input (MANDATORY for sandbox) ---- */
  baseline_metrics: Record<string, number>;
  scenario_metrics: Record<string, number>;

  /* ---- optional hints ---- */
  constraints_hint?: Record<string, unknown>;

  requested?: {
    n_scenarios?: number;   // default 3
    horizon_days?: number; // default 21
  };
};

/* ===============================
 * Response — Public Contract
 * =============================== */

export type SandboxEvaluateResponseV2 = {
  ok: boolean;
  /** Always false in Sandbox v2. Non-violable rule. */
  execution_allowed: false;

  event_id: string;
  baseline_snapshot_id: string;

  rate: SandboxRateInfo;

  dl: {
    profile: "signals-v2";
    health: Health;
  };

  llm: {
    fanout: number;        // logical fanout count
    models_used: string[]; // slotA / slotB / slotC or mapped names
    health: Health;
    mode: "sense" | "advise"; // audit trail
  };

  scenarios: ScenarioAdvisoryV2[];

  ranking: {
    method: "DQM";
    top_ids: string[];
  };

  summary: {
    one_liner: string;
    key_tradeoffs: string[];
    questions_for_scm: string[];
    signals_origin?: "synthetic" | "learned";
  };
};

/* ===============================
 * Scenario Pack
 * =============================== */

export type ScenarioActionV2 = {
  action_type: string;
  target?: string;
  quantity?: number;
  meta?: Record<string, unknown>;
};

export type DlEvidenceV2 = {
  source: "synthetic" | "learned";

  demand_forecast?: {
    horizon_days: number;
    p50: number;
    p90: number;
    unit?: string;
  };

  lead_time_pred?: Record<string, number>;

  risk_score?: {
    stockout_risk?: number;        // 0..1
    supplier_dependency?: number; // 0..1
    [k: string]: number | undefined;
  };

  anomaly_signals?: string[];
  meta?: Record<string, unknown>;
};

export type ScenarioExpectedEffectsV2 = {
  lateness_delta_days_p50?: number;
  cost_delta_percent_p50?: number;
  service_level_delta_p50?: number;
  [k: string]: number | undefined;
};

export type ScenarioAdvisoryV2 = {
  scenario_id: string;
  label: string;

  assumptions: string[];
  proposed_actions: ScenarioActionV2[];

  /** DL evidence — REQUIRED in v2 (may be degraded but never missing silently) */
  dl_evidence?: DlEvidenceV2;

  /** Advisory only. Core/DQM may override any expectations. */
  expected_effects?: ScenarioExpectedEffectsV2;

  /** 0..1 confidence (advisory) */
  confidence: number;

  /** failure flags */
  evidence_missing?: boolean;
};

/* ===============================
 * Optional — Canonical Storage Wrapper
 * =============================== */

export type ScenarioAdvisoryPackV2 = {
  submission_meta: {
    submission_id: string;
    source: "exploration_sandbox_v2";
    generated_at: string; // ISO
    llm_profile: "sandbox-explorer-v2";
    dl_profile: "signals-v2";
  };

  context_reference: {
    plan_id: string;
    baseline_snapshot_id: string;
    planning_domain: PlanningDomain;
  };

  scenarios: ScenarioAdvisoryV2[];
};