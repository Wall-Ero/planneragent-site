// core/src/governance/evidence/governance.evidence.types.ts
// ============================================================
// PlannerAgent — Governance Evidence Types
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Define canonical governance evidence contracts.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance evidence preserves proof that a governance
// decision occurred.
//
// DOES NOT:
// - enforce policy
// - persist records
// - create immutable chains
// - perform cryptography
//
// DOES:
// - define governance evidence
// - classify governance actions
// - classify governance sources
//
// ============================================================

// ============================================================
// GOVERNANCE SOURCE
// ============================================================

export type GovernanceEvidenceSource =
  | "ENCRYPTION_POLICY"
  | "SOVEREIGNTY_POLICY"
  | "TENANT_BOUNDARY"
  | "EXECUTION_GUARD"
  | "AUTHORITY_GRAPH";

// ============================================================
// GOVERNANCE ACTION
// ============================================================

export type GovernanceEvidenceAction =
  | "ALLOW"
  | "DENY"
  | "BLOCK"
  | "ESCALATE";

// ============================================================
// SEVERITY
// ============================================================

export type GovernanceEvidenceSeverity =
  | "LOW"
  | "HIGH"
  | "CRITICAL";

// ============================================================
// RECORD
// ============================================================

export interface GovernanceEvidenceRecord {

  evidence_id: string;

  source:
    GovernanceEvidenceSource;

  action:
    GovernanceEvidenceAction;

  tenant_id?: string;

  domain?: string;

  severity:
    GovernanceEvidenceSeverity;

  reason: string;

  summary: string[];

  created_at: string;
}