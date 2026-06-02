// ============================================================
// PlannerAgent — Recovery Governance Runtime
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/governance.recovery.runtime.ts
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
// Translate recovery requests into governed
// recovery decisions according to recovery policy.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Recovery is a governance decision.
//
// Recovery may restore systems.
// Recovery must never restore authority.
//
// Recovered data is not automatically
// authoritative data.
//
// Authority must always be reconstructed
// through governance.
//
// DOES NOT:
// - execute recovery
// - restore backups
// - restore databases
// - perform infrastructure operations
// - generate evidence
// - write ledger records
// - perform cryptography
//
// DOES:
// - evaluate recovery requests
// - apply recovery policy
// - classify recovery decisions
// - determine approval requirements
// - determine evidence requirements
// - determine ledger requirements
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Transform recovery requests into
// governed recovery decisions.
//
// Nothing else.
//
// ============================================================

import {
  getRecoveryPolicy,
} from "./governance.recovery.policy";

import type {
  RecoveryRequest,
  RecoveryDecision,
} from "./governance.recovery.types";

// ============================================================
// MAIN
// ============================================================

export function evaluateRecoveryRequest(
  request: RecoveryRequest
): RecoveryDecision {

  const policy =
    getRecoveryPolicy(
      request.domain
    );

  // ----------------------------------------------------------
  // FORBIDDEN
  // ----------------------------------------------------------

  if (
    !policy.recovery_allowed
  ) {

    return {

      status:
        "DENIED",

      domain:
        policy.domain,

      classification:
        policy.classification,

      recoveryAllowed:
        false,

      authorityReconstructionRequired:
        policy.authority_reconstruction_required,

      recoveredDataAuthoritative:
        policy.recovered_data_authoritative,

      humanApprovalRequired:
        policy.human_approval_required,

      governanceEvidenceRequired:
        policy.governance_evidence_required,

      ledgerRecordRequired:
        policy.ledger_record_required,

      reason:
        "Recovery forbidden by governance policy.",

      summary: [

        ...policy.summary,

        "recovery_denied",

      ],

    };

  }

  // ----------------------------------------------------------
  // APPROVAL REQUIRED
  // ----------------------------------------------------------

  if (
    policy.human_approval_required &&
    !request.approverId
  ) {

    return {

      status:
        "APPROVAL_REQUIRED",

      domain:
        policy.domain,

      classification:
        policy.classification,

      recoveryAllowed:
        true,

      authorityReconstructionRequired:
        policy.authority_reconstruction_required,

      recoveredDataAuthoritative:
        policy.recovered_data_authoritative,

      humanApprovalRequired:
        true,

      governanceEvidenceRequired:
        policy.governance_evidence_required,

      ledgerRecordRequired:
        policy.ledger_record_required,

      reason:
        "Human approval required before recovery.",

      summary: [

        ...policy.summary,

        "approval_required",

      ],

    };

  }

  // ----------------------------------------------------------
  // ALLOWED
  // ----------------------------------------------------------

  return {

    status:
      "ALLOWED",

    domain:
      policy.domain,

    classification:
      policy.classification,

    recoveryAllowed:
      true,

    authorityReconstructionRequired:
      policy.authority_reconstruction_required,

    recoveredDataAuthoritative:
      policy.recovered_data_authoritative,

    humanApprovalRequired:
      policy.human_approval_required,

    governanceEvidenceRequired:
      policy.governance_evidence_required,

    ledgerRecordRequired:
      policy.ledger_record_required,

    reason:
      "Recovery permitted under governance policy.",

    summary: [

      ...policy.summary,

      "recovery_allowed",

    ],

  };

}