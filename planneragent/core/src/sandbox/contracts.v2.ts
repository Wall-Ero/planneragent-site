// src/sandbox/contracts.v2.ts
// ======================================================
// Canonical Governance & Execution Contracts — V2
// P3 Authority-Aware Sandbox + Signed Snapshot Constitutional Envelope
// ======================================================

export type PlanTier =
  // Legacy alias kept for backward compatibility (must be normalized at boundary)
  | "BASIC"
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

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

export type Health = "ok" | "degraded" | "failed";

// ------------------------------------------------------
// LEGAL STATE — Week 0 Flag
// ------------------------------------------------------
export type LegalState = "PRE_SRL" | "SRL_ACTIVE";

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

  // Week 0 legal capability switch
  legal_state: LegalState;

  // Authority proof chain (Edge validated)
  oag_proof: OagProof;

  // Budget authority envelope (Principal / system pool)
  budget: {
    budget_remaining_eur: number;
    reset_at: string; // ISO
  };

  governance_flags: {
    sovereignty: "paid" | "free" | "oss";
  };

  issued_at: string; // ISO
  signature: string; // Edge Worker signed
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
    stockout_risk: number;
    supplier_dependency: number;
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
// RATE CONTRACT (Policy v2)
// ======================================================

export type SandboxRateInfo = {
  status: "OK" | "BURST" | "BLOCKED";
  reset_at: string; // ISO
  reason?: "DEBOUNCED" | "QUOTA_EXCEEDED" | "RATE_LIMITED";
};

// ======================================================
// DATA AWARENESS — Dataset Descriptor (Frontend-driven, no inference)
// ======================================================

export type DataAwarenessLevel = "SNAPSHOT" | "BEHAVIORAL" | "STRUCTURAL";

export type DatasetDescriptor = {
  hasSnapshot: boolean;           // CSV/Excel/one-off export
  hasBehavioralEvents: boolean;   // ordini/movimenti/eventi con timestamp
  hasStructuralData: boolean;     // anagrafiche/BOM/routing/capacità/constraint
};

export type DatasetClassificationResult = {
  level: DataAwarenessLevel;
  evidence: string[];
};

// ======================================================
// UI SIGNALS — Constitutional Projection v1 (LOCKED)
// ======================================================

export type DataAwarenessState =
  | "SNAPSHOT"
  | "BEHAVIORAL"
  | "STRUCTURAL";

export type PlanState =
  | "COHERENT"
  | "SOME_GAPS"
  | "INCOHERENT";

export type RealityState =
  | "ALIGNED"
  | "DRIFTING"
  | "MISALIGNED";

export type DecisionPressureState =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type UiSignalsV1 = {
  data_awareness: DataAwarenessState;
  plan: PlanState;
  reality: RealityState;
  decision_pressure: DecisionPressureState;
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

  // Frontend-driven descriptor (no inference). Optional; defaults to SNAPSHOT.
  dataset_descriptor?: DatasetDescriptor;

  snapshot: SignedSnapshotV1;
};

// ======================================================
// RESPONSE
// ======================================================

export type SandboxEvaluateResultV2 = {
  ok: true;

  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  // UI-aligned, constitutionally derived, deterministic
  signals: UiSignalsV1;

  scenarios: ScenarioV2[];
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