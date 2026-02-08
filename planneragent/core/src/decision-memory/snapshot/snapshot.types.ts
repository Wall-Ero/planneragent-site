// core/src/decision-memory/snapshot/snapshot.types.ts
// =====================================================
// Decision Memory — Snapshot Types V1
// Canonical Source of Truth
// =====================================================

import type { PlanTier, Intent, PlanningDomain } from "../../sandbox/contracts.v2";

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
}

// -----------------------------------------------------
// STORE INTERFACE CONTRACT
// -----------------------------------------------------

export interface DecisionStore {
  appendSnapshot(snapshot: DecisionMemorySnapshotV1): Promise<void>;

  getLastSnapshot(
    tenant_id: string,
    context_id: string
  ): Promise<DecisionMemorySnapshotV1 | null>;
}

