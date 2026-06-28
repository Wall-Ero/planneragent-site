// ============================================================
// PlannerAgent — Key Rotation Mechanism Execution
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/mechanisms/
// P9F.key.rotation.mechanism.execution.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Mechanism Execution
//
// DOMAIN
// ------------------------------------------------------------
// P9F.2.2 — Key Rotation Mechanism Execution
//
// PURPOSE
// ------------------------------------------------------------
// Execute approved key rotation
// cryptographic mechanisms.
//
// Mechanism Execution executes.
//
// Mechanism Execution does not
// authorize rotation.
//
// Mechanism Execution does not
// interact with infrastructure.
//
// This file does not:
//
// - authorize rotation
// - evaluate governance
// - call KMS APIs
// - call Vault APIs
// - store keys
// - write evidence
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
  ApprovedKeyRotationMechanism,
  ApprovedKeyWrappingOperation,
  resolveKeyRotationMechanismPolicy,
} from "./P9F.key.rotation.mechanism.policy";


// ============================================================
// EXECUTION STATUS
// ============================================================

export type KeyRotationMechanismExecutionStatus =
  | "EXECUTION_COMPLETED"
  | "EXECUTION_DENIED";


// ============================================================
// EXECUTION DENIAL REASON
// ============================================================

export type KeyRotationMechanismExecutionDenialReason =
  | "ROTATION_NOT_AUTHORIZED"
  | "MECHANISM_NOT_APPROVED"
  | "WRAPPING_OPERATION_NOT_APPROVED";


// ============================================================
// EXECUTION REQUEST
// ============================================================

export interface KeyRotationMechanismExecutionRequest {

  rotationAuthorized:
    boolean;

  mechanism:
    ApprovedKeyRotationMechanism;

  wrappingOperation:
    ApprovedKeyWrappingOperation;

}


// ============================================================
// EXECUTION RESULT
// ============================================================

export interface KeyRotationMechanismExecutionResult {

  executionStatus:
    KeyRotationMechanismExecutionStatus;

  rotationAuthorized:
    boolean;

  mechanismApproved:
    boolean;

  wrappingOperationApproved:
    boolean;

  mechanism:
    ApprovedKeyRotationMechanism;

  wrappingOperation:
    ApprovedKeyWrappingOperation;

  denialReason?:
    KeyRotationMechanismExecutionDenialReason;

  summary:
    string[];

}


// ============================================================
// EXECUTION
// ============================================================

export function executeKeyRotationMechanism(
  request: KeyRotationMechanismExecutionRequest
): KeyRotationMechanismExecutionResult {

  if (!request.rotationAuthorized) {

    return {

      executionStatus:
        "EXECUTION_DENIED",

      rotationAuthorized:
        false,

      mechanismApproved:
        false,

      wrappingOperationApproved:
        false,

      mechanism:
        request.mechanism,

      wrappingOperation:
        request.wrappingOperation,

      denialReason:
        "ROTATION_NOT_AUTHORIZED",

      summary: [
        "rotation_not_authorized",
        "execution_denied",
      ],

    };

  }

  const policy =
    resolveKeyRotationMechanismPolicy();

  const mechanismApproved =
    policy.approvedRotationMechanisms.includes(
      request.mechanism
    );

  if (!mechanismApproved) {

    return {

      executionStatus:
        "EXECUTION_DENIED",

      rotationAuthorized:
        true,

      mechanismApproved:
        false,

      wrappingOperationApproved:
        false,

      mechanism:
        request.mechanism,

      wrappingOperation:
        request.wrappingOperation,

      denialReason:
        "MECHANISM_NOT_APPROVED",

      summary: [
        "mechanism_not_approved",
        "execution_denied",
      ],

    };

  }

  const wrappingOperationApproved =
    policy.approvedKeyWrappingOperations.includes(
      request.wrappingOperation
    );

  if (!wrappingOperationApproved) {

    return {

      executionStatus:
        "EXECUTION_DENIED",

      rotationAuthorized:
        true,

      mechanismApproved:
        true,

      wrappingOperationApproved:
        false,

      mechanism:
        request.mechanism,

      wrappingOperation:
        request.wrappingOperation,

      denialReason:
        "WRAPPING_OPERATION_NOT_APPROVED",

      summary: [
        "wrapping_operation_not_approved",
        "execution_denied",
      ],

    };

  }

  return {

    executionStatus:
      "EXECUTION_COMPLETED",

    rotationAuthorized:
      true,

    mechanismApproved:
      true,

    wrappingOperationApproved:
      true,

    mechanism:
      request.mechanism,

    wrappingOperation:
      request.wrappingOperation,

    summary: [
      "rotation_authorized",
      "mechanism_approved",
      "wrapping_operation_approved",
      "execution_completed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Mechanism Execution executes approved
// cryptographic mechanism requests.
//
// Execution depends on governance
// authorization.
//
// Execution validates mechanism policy.
//
// Execution does not authorize rotation.
//
// Execution does not interact with
// infrastructure.
//
// Current implementation is a deterministic
// execution boundary.
//
// Real cryptographic operations remain
// deferred to future cryptographic runtimes.
//
// ============================================================


// ============================================================
// P9F.2.2 PRINCIPLE
// ============================================================
//
// Governance Authorization
// ≠
// Mechanism Execution
//
// Mechanism Approved
// ≠
// Mechanism Executed
//
// Mechanism Executed
// ≠
// Mechanism Verified
//
// Mechanism Execution
// ≠
// Infrastructure Usage
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
// - generate governance evidence
// - write governance ledger records
// - perform governance audits
// - call KMS APIs
// - call Vault APIs
// - provision infrastructure
// - store keys
// - persist ciphertext
// - perform provider-specific operations
//
// These responsibilities belong to:
//
// Governance Family
// Infrastructure Family
// Evidence Layer
// Ledger Layer
// Audit Layer
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ require governance authorization
//
// ✓ validate approved rotation mechanism
//
// ✓ validate approved wrapping operation
//
// ✓ produce deterministic execution result
//
// ✓ preserve requested mechanism
//
// ✓ preserve requested wrapping operation
//
// ✗ authorize rotation
//
// ✗ call KMS
//
// ✗ call Vault
//
// ✗ store keys
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================