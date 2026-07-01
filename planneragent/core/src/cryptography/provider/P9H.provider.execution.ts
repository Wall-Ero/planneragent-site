// ============================================================
// PlannerAgent — Provider Execution
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.execution.ts
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
// P9H.3 — Provider Execution
//
// PURPOSE
// ------------------------------------------------------------
// Execute the provider operation
// boundary for an admitted provider.
//
// Provider Execution executes.
//
// Provider Execution does not verify.
//
// This file receives ProviderAdmissionResult
// and determines whether provider execution
// may complete at the provider boundary.
//
// This file does not:
//
// - resolve providers
// - admit providers
// - verify provider execution
// - call real provider APIs
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - authorize governance
// - define mechanisms
// - provision infrastructure
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
// Provider Admitted
// ≠
// Provider Executed
//
// Provider Executed
// ≠
// Provider Verified
//
// ============================================================

import {
  ProviderAdmissionResult,
} from "./P9H.provider.admission";


// ============================================================
// PROVIDER OPERATION
// ============================================================

export type ProviderOperation =
  | "ROTATE_KEY"
  | "REWRAP_KEY"
  | "DISABLE_OLD_KEY"
  | "ACTIVATE_NEW_KEY";


// ============================================================
// EXECUTION DECISION
// ============================================================

export type ProviderExecutionDecision =
  | "ALLOW_PROVIDER_EXECUTION"
  | "DENY_PROVIDER_EXECUTION";


// ============================================================
// EXECUTION STATUS
// ============================================================

export type ProviderExecutionStatus =
  | "PROVIDER_EXECUTION_COMPLETED"
  | "PROVIDER_EXECUTION_DENIED";


// ============================================================
// EXECUTION DENIAL REASON
// ============================================================

export type ProviderExecutionDenialReason =
  | "PROVIDER_NOT_ADMITTED"
  | "PROVIDER_EXECUTION_NOT_ALLOWED";


// ============================================================
// REQUEST
// ============================================================

export interface ProviderExecutionRequest {

  admission:
    ProviderAdmissionResult;

  operation:
    ProviderOperation;

  executionDecision:
    ProviderExecutionDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderExecutionResult {

  executionStatus:
    ProviderExecutionStatus;

  executionDecision:
    ProviderExecutionDecision;

  providerExecuted:
    boolean;

  operation:
    ProviderOperation;

  providerAdmitted:
    ProviderAdmissionResult["providerAdmitted"];

  providerResolved:
    ProviderAdmissionResult["providerResolved"];

  mappingValidated:
    ProviderAdmissionResult["mappingValidated"];

  providerEnabled:
    ProviderAdmissionResult["providerEnabled"];

  providerContract:
    ProviderAdmissionResult["providerContract"];

  providerImplementation:
    ProviderAdmissionResult["providerImplementation"];

  denialReason?:
    ProviderExecutionDenialReason;

  admissionSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// EXECUTION
// ============================================================

export function executeProviderRuntime(
  request: ProviderExecutionRequest
): ProviderExecutionResult {

  const admission =
    request.admission;

  if (!admission.providerAdmitted) {

    return {

      executionStatus:
        "PROVIDER_EXECUTION_DENIED",

      executionDecision:
        request.executionDecision,

      providerExecuted:
        false,

      operation:
        request.operation,

      providerAdmitted:
        admission.providerAdmitted,

      providerResolved:
        admission.providerResolved,

      mappingValidated:
        admission.mappingValidated,

      providerEnabled:
        admission.providerEnabled,

      providerContract:
        admission.providerContract,

      providerImplementation:
        admission.providerImplementation,

      denialReason:
        "PROVIDER_NOT_ADMITTED",

      admissionSummary: [
        ...admission.summary,
      ],

      summary: [
        ...admission.summary,
        "provider_not_admitted",
        "provider_execution_denied",
      ],

    };

  }

  if (
    request.executionDecision ===
    "DENY_PROVIDER_EXECUTION"
  ) {

    return {

      executionStatus:
        "PROVIDER_EXECUTION_DENIED",

      executionDecision:
        request.executionDecision,

      providerExecuted:
        false,

      operation:
        request.operation,

      providerAdmitted:
        admission.providerAdmitted,

      providerResolved:
        admission.providerResolved,

      mappingValidated:
        admission.mappingValidated,

      providerEnabled:
        admission.providerEnabled,

      providerContract:
        admission.providerContract,

      providerImplementation:
        admission.providerImplementation,

      denialReason:
        "PROVIDER_EXECUTION_NOT_ALLOWED",

      admissionSummary: [
        ...admission.summary,
      ],

      summary: [
        ...admission.summary,
        "provider_execution_not_allowed",
        "provider_execution_denied",
      ],

    };

  }

  return {

    executionStatus:
      "PROVIDER_EXECUTION_COMPLETED",

    executionDecision:
      request.executionDecision,

    providerExecuted:
      true,

    operation:
      request.operation,

    providerAdmitted:
      admission.providerAdmitted,

    providerResolved:
      admission.providerResolved,

    mappingValidated:
      admission.mappingValidated,

    providerEnabled:
      admission.providerEnabled,

    providerContract:
      admission.providerContract,

    providerImplementation:
      admission.providerImplementation,

    admissionSummary: [
      ...admission.summary,
    ],

    summary: [
      ...admission.summary,
      "provider_execution_completed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Execution receives
// Provider Admission results.
//
// It does not re-run admission.
//
// It does not re-run mapping.
//
// It preserves provider context:
//
// - providerAdmitted
// - providerResolved
// - mappingValidated
// - providerEnabled
// - providerContract
// - providerImplementation
//
// It applies a deterministic provider
// execution decision.
//
// Current implementation is a provider
// execution boundary.
//
// It does not call real providers.
//
// Real provider API calls remain
// deferred to provider adapter layers.
//
// ============================================================


// ============================================================
// P9H.3 PRINCIPLE
// ============================================================
//
// Provider Admission
// ≠
// Provider Execution
//
// Provider Admitted
// ≠
// Provider Executed
//
// Provider Executed
// ≠
// Provider Verified
//
// Provider Execution
// ≠
// Provider Adapter
//
// Boolean Permission
// ≠
// Deterministic Execution Decision
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - resolve providers
// - re-run provider mapping
// - admit providers
// - re-run provider admission
// - verify provider execution
// - call real provider APIs
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - authorize governance
// - define mechanisms
// - provision infrastructure
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderAdmissionResult
//
// ✓ verify provider admitted
//
// ✓ preserve provider context
//
// ✓ apply deterministic execution decision
//
// ✓ execute provider boundary
//
// ✓ deny execution when provider
//   is not admitted
//
// ✓ deny execution when execution
//   decision denies provider execution
//
// ✓ preserve admission summary
//
// ✗ resolve providers
//
// ✗ admit providers
//
// ✗ verify execution
//
// ✗ call provider APIs
//
// ✗ call KMS
//
// ✗ call Vault
//
// ✗ call HSM
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================