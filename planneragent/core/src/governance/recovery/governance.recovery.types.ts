// ============================================================
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/governance.recovery.types.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Recovery Governance
//
// PURPOSE
// ------------------------------------------------------------
// Define canonical contracts for recovery governance.
//
// Recovery contracts describe:
//
// - recovery requests
// - recovery decisions
// - recovery evaluation results
//
// DOES NOT:
//
// - define recovery policies
// - execute recovery decisions
// - generate recovery evidence
// - persist recovery records
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define recovery governance contracts.
//
// ============================================================

import type {
  RecoveryDomain,
  RecoveryClassification,
} from "./governance.recovery.policy";

export type RecoveryDecisionStatus =
  | "ALLOWED"
  | "DENIED"
  | "APPROVAL_REQUIRED"
  | "AUTHORITY_RECONSTRUCTION_REQUIRED";

export interface RecoveryRequest {

  tenantId: string;

  domain: RecoveryDomain;

  requestedBy: string;

  approverId?: string;

  reason?: string;

  requestedAt: string;
}

export interface RecoveryDecision {

  status:
    RecoveryDecisionStatus;

  domain:
    RecoveryDomain;

  classification:
    RecoveryClassification;

  recoveryAllowed:
    boolean;

  authorityReconstructionRequired:
    boolean;

  recoveredDataAuthoritative:
    boolean;

  humanApprovalRequired:
    boolean;

  governanceEvidenceRequired:
    boolean;

  ledgerRecordRequired:
    boolean;

  reason:
    string;

  summary:
    string[];
}

export interface RecoveryEvaluationResult {

  request:
    RecoveryRequest;

  decision:
    RecoveryDecision;
}