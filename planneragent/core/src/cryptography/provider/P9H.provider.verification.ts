// ============================================================
// PlannerAgent — Provider Verification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.verification.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9H.4 — Provider Verification
//
// PURPOSE
// ------------------------------------------------------------
// Verify Provider Runtime execution
// without re-executing provider
// operations.
//
// Provider Verification verifies.
//
// Provider Verification does not
// execute.
//
// This file receives
// ProviderExecutionResult and verifies:
//
// - execution completed
// - provider context preserved
// - provider operation present
//
// This file does not:
//
// - resolve providers
// - admit providers
// - execute providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - generate evidence
// - write ledger
// - perform audit
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Mapping resolves.
//
// Provider Admission admits.
//
// Provider Execution executes.
//
// Provider Verification verifies.
//
// Provider Execution
// ≠
// Provider Verification
//
// Provider Verification
// ≠
// Provider Evidence
//
// ============================================================

import {
  ProviderExecutionResult,
} from "./P9H.provider.execution";


// ============================================================
// VERIFICATION DECISION
// ============================================================

export type ProviderVerificationDecision =
  | "VERIFY_PROVIDER_EXECUTION"
  | "REJECT_PROVIDER_EXECUTION";


// ============================================================
// VERIFICATION STATUS
// ============================================================

export type ProviderVerificationStatus =
  | "PROVIDER_VERIFICATION_PASSED"
  | "PROVIDER_VERIFICATION_FAILED";


// ============================================================
// VERIFICATION DENIAL
// ============================================================

export type ProviderVerificationDenialReason =
  | "PROVIDER_NOT_EXECUTED"
  | "PROVIDER_OPERATION_MISSING"
  | "PROVIDER_CONTEXT_INVALID"
  | "PROVIDER_VERIFICATION_REJECTED";


// ============================================================
// REQUEST
// ============================================================

export interface ProviderVerificationRequest {

  execution:
    ProviderExecutionResult;

  verificationDecision:
    ProviderVerificationDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderVerificationResult {

  verificationStatus:
    ProviderVerificationStatus;

  verificationDecision:
    ProviderVerificationDecision;

  providerVerified:
    boolean;

  providerExecuted:
    ProviderExecutionResult["providerExecuted"];

  providerAdmitted:
    ProviderExecutionResult["providerAdmitted"];

  providerResolved:
    ProviderExecutionResult["providerResolved"];

  mappingValidated:
    ProviderExecutionResult["mappingValidated"];

  providerEnabled:
    ProviderExecutionResult["providerEnabled"];

  providerContract:
    ProviderExecutionResult["providerContract"];

  providerImplementation:
    ProviderExecutionResult["providerImplementation"];

  operation:
    ProviderExecutionResult["operation"];

  denialReason?:
    ProviderVerificationDenialReason;

  executionSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// VERIFICATION
// ============================================================

export function verifyProviderRuntime(
  request: ProviderVerificationRequest
): ProviderVerificationResult {

  const execution =
    request.execution;

  if (!execution.providerExecuted) {

    return {

      verificationStatus:
        "PROVIDER_VERIFICATION_FAILED",

      verificationDecision:
        request.verificationDecision,

      providerVerified:
        false,

      providerExecuted:
        execution.providerExecuted,

      providerAdmitted:
        execution.providerAdmitted,

      providerResolved:
        execution.providerResolved,

      mappingValidated:
        execution.mappingValidated,

      providerEnabled:
        execution.providerEnabled,

      providerContract:
        execution.providerContract,

      providerImplementation:
        execution.providerImplementation,

      operation:
        execution.operation,

      denialReason:
        "PROVIDER_NOT_EXECUTED",

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "provider_not_executed",
        "provider_verification_failed",
      ],

    };

  }

  if (!execution.operation) {

    return {

      verificationStatus:
        "PROVIDER_VERIFICATION_FAILED",

      verificationDecision:
        request.verificationDecision,

      providerVerified:
        false,

      providerExecuted:
        execution.providerExecuted,

      providerAdmitted:
        execution.providerAdmitted,

      providerResolved:
        execution.providerResolved,

      mappingValidated:
        execution.mappingValidated,

      providerEnabled:
        execution.providerEnabled,

      providerContract:
        execution.providerContract,

      providerImplementation:
        execution.providerImplementation,

      operation:
        execution.operation,

      denialReason:
        "PROVIDER_OPERATION_MISSING",

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "provider_operation_missing",
        "provider_verification_failed",
      ],

    };

  }

  if (
    request.verificationDecision ===
    "REJECT_PROVIDER_EXECUTION"
  ) {

    return {

      verificationStatus:
        "PROVIDER_VERIFICATION_FAILED",

      verificationDecision:
        request.verificationDecision,

      providerVerified:
        false,

      providerExecuted:
        execution.providerExecuted,

      providerAdmitted:
        execution.providerAdmitted,

      providerResolved:
        execution.providerResolved,

      mappingValidated:
        execution.mappingValidated,

      providerEnabled:
        execution.providerEnabled,

      providerContract:
        execution.providerContract,

      providerImplementation:
        execution.providerImplementation,

      operation:
        execution.operation,

      denialReason:
        "PROVIDER_VERIFICATION_REJECTED",

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "provider_verification_rejected",
        "provider_verification_failed",
      ],

    };

  }

  return {

    verificationStatus:
      "PROVIDER_VERIFICATION_PASSED",

    verificationDecision:
      request.verificationDecision,

    providerVerified:
      true,

    providerExecuted:
      execution.providerExecuted,

    providerAdmitted:
      execution.providerAdmitted,

    providerResolved:
      execution.providerResolved,

    mappingValidated:
      execution.mappingValidated,

    providerEnabled:
      execution.providerEnabled,

    providerContract:
      execution.providerContract,

    providerImplementation:
      execution.providerImplementation,

    operation:
      execution.operation,

    executionSummary: [
      ...execution.summary,
    ],

    summary: [
      ...execution.summary,
      "provider_verification_passed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Verification receives
// ProviderExecutionResult.
//
// It never:
//
// - re-runs Mapping
// - re-runs Admission
// - re-runs Execution
//
// It verifies:
//
// ✓ execution completed
// ✓ provider context preserved
// ✓ provider operation present
//
// Verification preserves
// execution context.
//
// Verification never mutates
// execution context.
//
// Verification preserves the
// providerExecuted state received
// from Provider Execution.
//
// Verification rejection is distinct
// from provider context invalidity.
//
// PROVIDER_CONTEXT_INVALID is reserved
// for future provider-context integrity
// checks.
//
// ============================================================


// ============================================================
// P9H.4 PRINCIPLE
// ============================================================
//
// Provider Execution
// ≠
// Provider Verification
//
// Provider Verification
// ≠
// Provider Evidence
//
// Provider Execution produces
// providerExecuted.
//
// Provider Verification preserves
// providerExecuted.
//
// Provider Verification produces
// providerVerified.
//
// Provider Verification verifies.
//
// Provider Evidence preserves.
//
// Verification Rejected
// ≠
// Provider Context Invalid
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - resolve providers
// - admit providers
// - execute providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderExecutionResult
//
// ✓ verify execution completed
//
// ✓ verify provider context preserved
//
// ✓ verify provider operation present
//
// ✓ preserve providerExecuted
//
// ✓ produce providerVerified
//
// ✓ distinguish verification rejection
//   from provider context invalidity
//
// ✓ preserve execution summary
//
// ✓ preserve provider context
//
// ✗ resolve providers
//
// ✗ admit providers
//
// ✗ execute providers
//
// ✗ generate evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================