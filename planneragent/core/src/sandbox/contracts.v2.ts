// src/sandbox/contracts.v2.ts
// ======================================================
// Canonical Governance & Execution Contracts — V2
// P3 Authority-Aware Sandbox + Signed Snapshot Constitutional Envelope
//
// Source of truth for:
// - Edge Worker (api boundary + snapshot builder + signature)
// - Core Orchestrator (deterministic + governed execution)
// - DL layer (evidence truth)
// - Voice preview (read-only)
//
// Golden Rule:
// Core NEVER runs without a valid signed snapshot.
// ======================================================

// ------------------------------------------------------
// PLAN TIERS — Constitutional Authority Levels
// ------------------------------------------------------
export type PlanTier =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

// ------------------------------------------------------
// INTENTS — Allowed Cognitive Modes
// ------------------------------------------------------
export type Intent =
  | "INFORM"   // Narrate deterministic truth
  | "ADVISE"   // Scenario + tradeoff generation
  | "EXECUTE"  // Delegated execution (authority gated)
  | "WARN";    // Governance / policy boundary narration

// ------------------------------------------------------
// DOMAIN — Planning Context
// ------------------------------------------------------
export type PlanningDomain =
  | "supply_chain"
  | "production"
  | "logistics"
  | "finance"
  | "governance"
  | "general";

// ------------------------------------------------------
// HEALTH — Subsystem Status
// ------------------------------------------------------
export type Health = "ok" | "degraded" | "failed";


// ======================================================
// SNAPSHOT V1 — SIGNED CONSTITUTIONAL ENVELOPE
// ======================================================

export type SignedSnapshotV1 = {
  v: 1;

  company_id: string;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;

  // Authority proof chain (Edge validated)
  oag_proof: OagProof;

  // Budget authority envelope (Principal / system pool)
  budget: {
    budget_remaining_eur: number;
    reset_at: string; // ISO
  };

  // Sovereignty / cost governance
  governance_flags: {
    sovereignty: "paid" | "free" | "oss";
  };

  issued_at: string; // ISO
  signature: string; // Edge Worker signed (crypto verified in Core)
};


// ======================================================
// OAG PROOF — AUTHORITY GRAPH RESULT
// ======================================================

export type OagProof = {
  company_id: string;
  actor_id: string;

  plan: PlanTier;
  domain: PlanningDomain;
  intent: Intent;

  sponsor_id?: string;

  issued_at: string;

  authority: "human" | "board" | "system";
};


// ======================================================
// DETERMINISTIC EVIDENCE — DL TRUTH LAYER
// ======================================================

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
    stockout_risk: number;        // 0..1
    supplier_dependency: number;  // 0..1
  };

  anomaly_signals: string[];
};


// ======================================================
// VISION ADVISORY — INTERPRETATION LAYER
// ======================================================

export type ScenarioAdvisoryV2 = {
  one_liner: string;
  key_signals: string[];
  labels: string[];

  questions: Array<{
    id: string;
    question: string;
    missing_field?: string;
  }>;
};


// ======================================================
// SCENARIOS — HYPOTHESIS LAYER (NON-TRUTH)
// ======================================================

export type ScenarioV2 = {
  id: string;
  title: string;
  summary: string;
  confidence: number; // 0..1
};


// ======================================================
// REQUEST — EDGE → CORE
// ======================================================

export type SandboxEvaluateRequestV2 = {
  company_id: string;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;

  baseline_snapshot_id: string;
  baseline_metrics: Record<string, unknown>;

  // Mandatory constitutional envelope
  snapshot: SignedSnapshotV1;
};


// ======================================================
// SUCCESS RESPONSE
// ======================================================

export type SandboxEvaluateResultV2 = {
  ok: true;

  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  scenarios: ScenarioV2[];

  advisory?: ScenarioAdvisoryV2;

  governance: {
    execution_allowed: boolean;
    reason: string;
  };

  issued_at: string;
};


// ======================================================
// ERROR RESPONSE
// ======================================================

export type SandboxEvaluateErrorV2 = {
  ok: false;
  request_id?: string;
  reason: string;
};


// ======================================================
// UNION RESPONSE
// ======================================================

export type SandboxEvaluateResponseV2 =
  | SandboxEvaluateResultV2
  | SandboxEvaluateErrorV2;