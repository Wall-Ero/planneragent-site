// sandbox/contracts.v2.ts
// Canonical Governance & Execution Contracts — V2

export type PlanTier =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

export type Intent =
  | "INFORM"   // Vision: observation, signals, governance narration
  | "ADVISE"   // Junior/Senior/Principal: propose actions
  | "EXECUTE" // Only if authority allows (Junior approved, Senior delegated, Principal budgeted)
  | "WARN";   // Governance / risk / policy boundary

export type PlanningDomain =
  | "supply_chain"
  | "production"
  | "logistics"
  | "finance"
  | "governance"
  | "general";

export type SandboxEvaluateRequestV2 = {
  company_id: string;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;

  baseline_snapshot_id: string;
  baseline_metrics: Record<string, number>;

  snapshot: SignedSnapshotV1;
};

export type ScenarioV2 = {
  id: string;
  title: string;
  summary: string;
  confidence: number; // 0..1
};

export type SandboxEvaluateResultV2 = {
  ok: true;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  scenarios: ScenarioV2[];

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

// Forward declaration to avoid circular imports
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
    reset_at: string;
  };

  governance_flags: {
    sovereignty: "paid" | "free" | "oss";
  };

  issued_at: string;
  signature: string;
};

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