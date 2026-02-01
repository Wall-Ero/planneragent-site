// src/sandbox/contracts.v2.ts
// ======================================================
// Canonical Governance & Execution Contracts — V2
// Source of truth for types shared by:
// - Edge gateway (worker.ts) via apiBoundary
// - Core orchestrator (orchestrator.v2.ts)
// - Deterministic layer (dl.v2.ts)
// - Read-only voice preview (routes.voice.ts)
// ======================================================

export type PlanTier =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

// Intent aligned to FAQ v4.1
// - VISION: INFORM only (narrate evidence, explain deltas, ask clarifying questions)
// - JUNIOR/SENIOR/PRINCIPAL: ADVISE and (conditionally) EXECUTE
// - WARN: governance/policy/risk boundary narration
export type Intent =
  | "INFORM"
  | "ADVISE"
  | "EXECUTE"
  | "WARN";

export type PlanningDomain =
  | "supply_chain"
  | "production"
  | "logistics"
  | "finance"
  | "governance"
  | "general";

// Health of a subsystem
export type Health = "ok" | "degraded" | "failed";

// -----------------------------
// Snapshot v1 (signed envelope)
// -----------------------------
export type SignedSnapshotV1 = {
  v: 1;

  company_id: string;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;

  oag_proof: OagProof;

  budget: {
    budget_remaining_eur: number;
    reset_at: string; // ISO-8601
  };

  governance_flags: {
    sovereignty: "paid" | "free" | "oss";
  };

  issued_at: string; // ISO-8601
  signature: string;
};

// -----------------------------
// OAG proof (authority graph)
// -----------------------------
export type OagProof = {
  company_id: string;
  actor_id: string;

  plan: PlanTier;
  domain: PlanningDomain;
  intent: Intent;

  sponsor_id?: string;

  issued_at: string; // ISO-8601

  // "human" = real operator (human accountability)
  // "board" = board/charter-approved authority envelope (constitutional)
  // "system" = system-issued proof inside an already-approved charter boundary
  authority: "human" | "board" | "system";
};

// -----------------------------
// Deterministic Evidence (DL)
// -----------------------------
export type DlEvidenceV2 = {
  source: "synthetic" | "system" | "ingested";

  demand_forecast: {
    horizon_days: number;
    p50: number;
    p90: number;
  };

  lead_time_pred: {
    supplier_B_p50_days: number;
    supplier_B_p90_days: number;
  };

  risk_score: {
    stockout_risk: number; // 0..1
    supplier_dependency: number; // 0..1
  };

  // Must be audit-friendly: plain strings (no hidden reasoning)
  anomaly_signals: string[];
};

// -----------------------------
// VISION Advisory (explain, label, ask)
// -----------------------------
export type ScenarioAdvisoryV2 = {
  one_liner: string;

  // “what the deterministic layer is saying”
  key_signals: string[];

  // taxonomy labels (audit-friendly)
  labels: string[];

  // clarifying questions
  questions: Array<{
    id: string;
    question: string;
    missing_field?: string;
  }>;
};

// -----------------------------
// Scenarios (hypotheses, not truth)
// -----------------------------
export type ScenarioV2 = {
  id: string;
  title: string;
  summary: string;
  confidence: number; // 0..1
};

// -----------------------------
// Request/Response V2
// -----------------------------
export type SandboxEvaluateRequestV2 = {
  company_id: string;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;

  baseline_snapshot_id: string;
  baseline_metrics: Record<string, unknown>;

  // Signed constitutional envelope (Edge->Core)
  snapshot: SignedSnapshotV1;
};

export type SandboxEvaluateResultV2 = {
  ok: true;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  // VISION must keep this empty
  scenarios: ScenarioV2[];

  // VISION-only comprehension output
  advisory?: ScenarioAdvisoryV2;

  governance: {
    execution_allowed: boolean;
    reason: string;
  };

  issued_at: string;
};

export type SandboxEvaluateErrorV2 = {
  ok: false;
  request_id?: string;
  reason: string;
};

export type SandboxEvaluateResponseV2 =
  | SandboxEvaluateResultV2
  | SandboxEvaluateErrorV2;