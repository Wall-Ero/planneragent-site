// core/src/decision-memory/snapshot/snapshot.types.ts
// =====================================================
// Decision Memory — Snapshot Types V1
// Canonical Source of Truth
//
// Includes:
// - deterministic ORD evidence
// - append-only hash chain
// - execution outcome (for learning & replay)
// =====================================================

import { PlanTier } from "../../sandbox/contracts.v2";

type Intent = string;
type PlanningDomain = string;

// -----------------------------------------------------
// HASH CHAIN
// -----------------------------------------------------

export interface DecisionMemoryHashChain {
  previous_hash: string | null;
  current_hash: string;
}

// -----------------------------------------------------
// ORD EVIDENCE (Deterministic — No AI)
// -----------------------------------------------------

export interface OrdEvidence {
  pressure_score: number;
  confidence_score: number;
  ord_gate: {
    allow_paid_llm: boolean;
    recommended_tier: "OSS" | "PAID";
    reason: string;
  };
}

// -----------------------------------------------------
// EXECUTION MEMORY (NEW — critical for replay)
// -----------------------------------------------------

export type DecisionOutcome = "SUCCESS" | "FAIL";

export interface DecisionExecutionMemory {
  outcome: DecisionOutcome;
  anomaly: boolean;

  // actions actually executed by the system
  executed_actions: string[];
}

// -----------------------------------------------------
// SNAPSHOT CORE STRUCTURE
// -----------------------------------------------------

export interface DecisionMemorySnapshotV1 {
  // Identity
  snapshot_id: string;

  tenant_id: string;
  company_id: string;
  context_id: string;

  // Planning
  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  // Baseline
  baseline_snapshot_id: string;
  baseline_metrics: Record<string, number>;

  // Evidence (Deterministic only)
  ord: OrdEvidence;

  // 👇 NEW — execution memory (separato per chiarezza semantica)
   
  execution: {
  outcome: "SUCCESS" | "FAIL" | "PARTIAL";
  anomaly: boolean;
  executed_actions: string[];
};

  // Hash Chain (Append-only guarantee)
  hash_chain: DecisionMemoryHashChain;

  // Time
  created_at: string;
}

// -----------------------------------------------------
// BUILDER INPUT
// -----------------------------------------------------

export interface BuildDecisionMemorySnapshotInputV1 {
  tenant_id: string;
  company_id: string;
  context_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  baseline_snapshot_id: string;
  baseline_metrics: Record<string, number>;

  ord: OrdEvidence;

  previous_hash: string | null;

  execution?: {
  outcome: "SUCCESS" | "FAIL" | "PARTIAL";
  anomaly: boolean;
  executed_actions: string[];
};
}

// -----------------------------------------------------
// STORE INTERFACE CONTRACT
// -----------------------------------------------------

export interface DecisionStore {
  appendSnapshot(snapshot: DecisionMemorySnapshotV1): Promise<void>;

  getLastSnapshot(
    company_id: string,
    context_id: string
  ): Promise<DecisionMemorySnapshotV1 | null>;

  getRecentSnapshots(
    company_id: string,
    context_id: string,
    limit: number
  ): Promise<DecisionMemorySnapshotV1[]>;
}