// src/sandbox/contracts.v2.ts
// ==========================================
// Sandbox Contracts v2 (governance-safe)
// - advisory only (no execution)
// - DL evidence required (may be degraded)
// - rate policy always on
// ==========================================

export interface NormalizedLlmAdvice {
  label: string;
  assumptions: string[];
  proposed_actions: {
    action_type: string;
    target: string;
    quantity?: number;
  }[];
  expected_effects: Record<string, number>;
  confidence: number;
}

export type Health = "ok" | "degraded" | "failed";

export type PlanTier = "BASIC" | "JUNIOR" | "SENIOR";
export type PlanningDomain = "supply_chain" | "production" | "logistics";

// ---------- Rate policy ----------

export type RateStatus = "OK" | "BURST" | "BLOCKED";

export type SandboxRateInfo = {
  status: RateStatus;
  /** ISO timestamp when the quota window resets (or next retry window) */
  reset_at: string;
  /** optional details for debugging / UI */
  reason?: "QUOTA_EXCEEDED" | "BURST_EXCEEDED" | "DEBOUNCED" | "RATE_LIMITED" | "LOW_QUALITY";
};

// ---------- Request/Response (public surface via Gateway, executed in Core) ----------

export type SandboxEvaluateRequestV2 = {
  /* ---- identity / routing ---- */
  company_id: string;
  plan: PlanTier;
  domain: PlanningDomain;

  /* ---- snapshot ---- */
  baseline_snapshot_id: string;

  /* ---- advisory intent (MANDATORY) ---- */
  intent: string;

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
    fanout: number; // logical fanout count
    models_used: string[]; // aliases (slotA/slotB/slotC or mapped names)
    health: Health;
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

// ---------- Scenario pack ----------

export type ScenarioActionV2 = {
  action_type: string;
  target?: string;
  quantity?: number;
  meta?: Record<string, unknown>;
};

export type DlEvidenceV2 = {
  source: "syntethic" | "learned";
  demand_forecast?: {
    horizon_days: number;
    p50: number;
    p90: number;
    unit?: string;
  };
  lead_time_pred?: Record<string, number>;
  risk_score?: {
    stockout_risk?: number; // 0..1
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

  /** In v2 every scenario SHOULD include dl_evidence. If DL fails, it can be present but partial + marked degraded. */
  dl_evidence?: DlEvidenceV2;

  /** Advisory only. Core/DQM may override any expectations. */
  expected_effects?: ScenarioExpectedEffectsV2;

  /** 0..1 confidence (advisory) */
  confidence: number;

  /** flags for failure modes */
  evidence_missing?: boolean;
};

// ---------- Optional: canonical pack wrapper (handy for storage) ----------

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
