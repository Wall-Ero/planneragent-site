// ============================================================
// PlannerAgent — Key Rotation Mechanism Verification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/mechanisms/
// P9F.key.rotation.mechanism.verification.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Mechanism Verification
//
// DOMAIN
// ------------------------------------------------------------
// P9F.2.3 — Key Rotation Mechanism Verification
//
// PURPOSE
// ------------------------------------------------------------
// Verify key rotation mechanism
// execution results.
//
// Mechanism Verification verifies.
//
// Mechanism Verification does not
// authorize rotation.
//
// Mechanism Verification does not
// execute mechanisms.
//
// This file does not:
//
// - authorize rotation
// - re-execute mechanism policy
// - execute rotation
// - call KMS APIs
// - call Vault APIs
// - generate evidence
// - write ledger records
// - perform audits
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance authorizes.
//
// Mechanism Policy defines.
//
// Mechanism Execution executes.
//
// Mechanism Verification verifies.
//
// Infrastructure provides.
//
// ============================================================

import {
  KeyRotationMechanismExecutionResult,
} from "./P9F.key.rotation.mechanism.execution";


// ============================================================
// VERIFICATION STATUS
// ============================================================

export type KeyRotationMechanismVerificationStatus =
  | "VERIFICATION_PASSED"
  | "VERIFICATION_FAILED";


// ============================================================
// VERIFICATION FAILURE REASON
// ============================================================

export type KeyRotationMechanismVerificationFailureReason =
  | "EXECUTION_NOT_COMPLETED"
  | "MECHANISM_NOT_APPROVED"
  | "WRAPPING_OPERATION_NOT_APPROVED"
  | "EXECUTION_MARKER_MISSING";


// ============================================================
// VERIFICATION INPUT
// ============================================================

export interface KeyRotationMechanismVerificationInput {

  verificationId:
    string;

  verifiedAt:
    string;

  executionResult:
    KeyRotationMechanismExecutionResult;

}


// ============================================================
// VERIFICATION RESULT
// ============================================================

export interface KeyRotationMechanismVerificationResult {

  verificationId:
    string;

  verificationStatus:
    KeyRotationMechanismVerificationStatus;

  verifiedAt:
    string;

  executionStatus:
    KeyRotationMechanismExecutionResult["executionStatus"];

  mechanismApproved:
    boolean;

  wrappingOperationApproved:
    boolean;

  failureReason?:
    KeyRotationMechanismVerificationFailureReason;

  executionSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// VERIFICATION
// ============================================================

export function verifyKeyRotationMechanismExecution(
  input: KeyRotationMechanismVerificationInput
): KeyRotationMechanismVerificationResult {

  const executionResult =
    input.executionResult;

  if (
    executionResult.executionStatus !==
    "EXECUTION_COMPLETED"
  ) {

    return {

      verificationId:
        input.verificationId,

      verificationStatus:
        "VERIFICATION_FAILED",

      verifiedAt:
        input.verifiedAt,

      executionStatus:
        executionResult.executionStatus,

      mechanismApproved:
        executionResult.mechanismApproved,

      wrappingOperationApproved:
        executionResult.wrappingOperationApproved,

      failureReason:
        "EXECUTION_NOT_COMPLETED",

      executionSummary: [
        ...executionResult.summary,
      ],

      summary: [
        ...executionResult.summary,
        "verification_failed",
      ],

    };

  }

  if (!executionResult.mechanismApproved) {

    return {

      verificationId:
        input.verificationId,

      verificationStatus:
        "VERIFICATION_FAILED",

      verifiedAt:
        input.verifiedAt,

      executionStatus:
        executionResult.executionStatus,

      mechanismApproved:
        false,

      wrappingOperationApproved:
        executionResult.wrappingOperationApproved,

      failureReason:
        "MECHANISM_NOT_APPROVED",

      executionSummary: [
        ...executionResult.summary,
      ],

      summary: [
        ...executionResult.summary,
        "verification_failed",
      ],

    };

  }

  if (!executionResult.wrappingOperationApproved) {

    return {

      verificationId:
        input.verificationId,

      verificationStatus:
        "VERIFICATION_FAILED",

      verifiedAt:
        input.verifiedAt,

      executionStatus:
        executionResult.executionStatus,

      mechanismApproved:
        executionResult.mechanismApproved,

      wrappingOperationApproved:
        false,

      failureReason:
        "WRAPPING_OPERATION_NOT_APPROVED",

      executionSummary: [
        ...executionResult.summary,
      ],

      summary: [
        ...executionResult.summary,
        "verification_failed",
      ],

    };

  }

  if (
    !executionResult.summary.includes(
      "execution_completed"
    )
  ) {

    return {

      verificationId:
        input.verificationId,

      verificationStatus:
        "VERIFICATION_FAILED",

      verifiedAt:
        input.verifiedAt,

      executionStatus:
        executionResult.executionStatus,

      mechanismApproved:
        executionResult.mechanismApproved,

      wrappingOperationApproved:
        executionResult.wrappingOperationApproved,

      failureReason:
        "EXECUTION_MARKER_MISSING",

      executionSummary: [
        ...executionResult.summary,
      ],

      summary: [
        ...executionResult.summary,
        "verification_failed",
      ],

    };

  }

  return {

    verificationId:
      input.verificationId,

    verificationStatus:
      "VERIFICATION_PASSED",

    verifiedAt:
      input.verifiedAt,

    executionStatus:
      executionResult.executionStatus,

    mechanismApproved:
      executionResult.mechanismApproved,

    wrappingOperationApproved:
      executionResult.wrappingOperationApproved,

    executionSummary: [
      ...executionResult.summary,
    ],

    summary: [
      ...executionResult.summary,
      "mechanism_verification_passed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Mechanism Verification verifies
// execution results.
//
// Verification does not re-execute
// mechanisms.
//
// Verification does not re-evaluate
// mechanism policy.
//
// Verification does not authorize
// rotation.
//
// Verification identity and verification
// time are supplied externally.
//
// This keeps Verification deterministic,
// testable, and free from side effects.
//
// ============================================================


// ============================================================
// P9F.2.3 PRINCIPLE
// ============================================================
//
// Execution
// ≠
// Verification
//
// Verification
// ≠
// Evidence
//
// Verification
// ≠
// Ledger
//
// Verification verifies execution.
//
// Verification never re-executes
// mechanisms.
//
// Verification never re-evaluates
// mechanism policy.
//
// Verification never authorizes
// rotation.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - authorize rotation
// - evaluate governance policy
// - re-execute mechanism policy
// - execute rotation
// - call KMS APIs
// - call Vault APIs
// - generate evidence
// - write ledger records
// - perform audits
// - provision infrastructure
// - store keys
// - persist ciphertext
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ verify execution result
//
// ✓ verify execution completed
//
// ✓ verify mechanism approved
//
// ✓ verify wrapping operation approved
//
// ✓ verify execution marker
//
// ✓ preserve execution summary
//
// ✗ authorize rotation
//
// ✗ execute rotation
//
// ✗ re-execute mechanism policy
//
// ✗ call KMS
//
// ✗ call Vault
//
// ✗ generate evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================