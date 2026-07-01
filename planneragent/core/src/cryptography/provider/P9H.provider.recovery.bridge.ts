// ============================================================
// PlannerAgent — Provider Recovery Bridge
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.recovery.bridge.ts
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
// P9H.7 — Provider Recovery Bridge
//
// PURPOSE
// ------------------------------------------------------------
// Route classified provider failures
// toward future recovery runtime.
//
// Provider Recovery Bridge bridges.
//
// Provider Recovery Bridge does not
// recover.
//
// This file receives ProviderFailureResult
// and produces ProviderRecoveryBridgeResult.
//
// This file does not:
//
// - resolve providers
// - admit providers
// - execute providers
// - verify providers
// - generate evidence
// - classify failures again
// - retry provider calls
// - recover providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - write ledger
// - perform audit
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Failure Handling classifies.
//
// Provider Recovery Bridge routes.
//
// Recovery Runtime recovers.
//
// Failure Classified
// ≠
// Recovery Bridge Open
//
// Recovery Bridge Open
// ≠
// Recovery Executed
//
// ============================================================

import {
  ProviderFailureResult,
} from "./P9H.provider.failure";


// ============================================================
// RECOVERY BRIDGE DECISION
// ============================================================

export type ProviderRecoveryBridgeDecision =
  | "OPEN_RECOVERY_BRIDGE"
  | "KEEP_RECOVERY_BRIDGE_CLOSED";


// ============================================================
// RECOVERY BRIDGE STATUS
// ============================================================

export type ProviderRecoveryBridgeStatus =
  | "PROVIDER_RECOVERY_BRIDGE_OPEN"
  | "PROVIDER_RECOVERY_BRIDGE_CLOSED";


// ============================================================
// RECOVERY BRIDGE DENIAL REASON
// ============================================================

export type ProviderRecoveryBridgeDenialReason =
  | "NO_PROVIDER_FAILURE"
  | "RECOVERY_BRIDGE_NOT_ALLOWED";


// ============================================================
// RECOVERY REQUIREMENT
// ============================================================

export type ProviderRecoveryRequirement =
  | "RECOVERY_REQUIRED"
  | "RECOVERY_NOT_REQUIRED";


// ============================================================
// REQUEST
// ============================================================

export interface ProviderRecoveryBridgeRequest {

  failure:
    ProviderFailureResult;

  recoveryBridgeDecision:
    ProviderRecoveryBridgeDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRecoveryBridgeResult {

  recoveryBridgeStatus:
    ProviderRecoveryBridgeStatus;

  recoveryBridgeDecision:
    ProviderRecoveryBridgeDecision;

  recoveryBridgeOpen:
    boolean;

  recoveryRequirement:
    ProviderRecoveryRequirement;

  providerFailureClassified:
    ProviderFailureResult["providerFailureClassified"];

  failureStatus:
    ProviderFailureResult["failureStatus"];

  failureClassification:
    ProviderFailureResult["failureClassification"];

  failureSeverity:
    ProviderFailureResult["failureSeverity"];

  providerEvidenceGenerated:
    ProviderFailureResult["providerEvidenceGenerated"];

  providerVerified:
    ProviderFailureResult["providerVerified"];

  providerExecuted:
    ProviderFailureResult["providerExecuted"];

  providerAdmitted:
    ProviderFailureResult["providerAdmitted"];

  providerResolved:
    ProviderFailureResult["providerResolved"];

  mappingValidated:
    ProviderFailureResult["mappingValidated"];

  providerEnabled:
    ProviderFailureResult["providerEnabled"];

  providerContract:
    ProviderFailureResult["providerContract"];

  providerImplementation:
    ProviderFailureResult["providerImplementation"];

  operation:
    ProviderFailureResult["operation"];

  denialReason?:
    ProviderRecoveryBridgeDenialReason;

  failureSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// RECOVERY BRIDGE
// ============================================================

export function bridgeProviderRecovery(
  request: ProviderRecoveryBridgeRequest
): ProviderRecoveryBridgeResult {

  const failure =
    request.failure;

  if (!failure.providerFailureClassified) {

    return {

      recoveryBridgeStatus:
        "PROVIDER_RECOVERY_BRIDGE_CLOSED",

      recoveryBridgeDecision:
        request.recoveryBridgeDecision,

      recoveryBridgeOpen:
        false,

      recoveryRequirement:
        "RECOVERY_NOT_REQUIRED",

      providerFailureClassified:
        failure.providerFailureClassified,

      failureStatus:
        failure.failureStatus,

      failureClassification:
        failure.failureClassification,

      failureSeverity:
        failure.failureSeverity,

      providerEvidenceGenerated:
        failure.providerEvidenceGenerated,

      providerVerified:
        failure.providerVerified,

      providerExecuted:
        failure.providerExecuted,

      providerAdmitted:
        failure.providerAdmitted,

      providerResolved:
        failure.providerResolved,

      mappingValidated:
        failure.mappingValidated,

      providerEnabled:
        failure.providerEnabled,

      providerContract:
        failure.providerContract,

      providerImplementation:
        failure.providerImplementation,

      operation:
        failure.operation,

      denialReason:
        "NO_PROVIDER_FAILURE",

      failureSummary: [
        ...failure.summary,
      ],

      summary: [
        ...failure.summary,
        "no_provider_failure",
        "recovery_bridge_closed",
      ],

    };

  }

  if (
    request.recoveryBridgeDecision ===
    "KEEP_RECOVERY_BRIDGE_CLOSED"
  ) {

    return {

      recoveryBridgeStatus:
        "PROVIDER_RECOVERY_BRIDGE_CLOSED",

      recoveryBridgeDecision:
        request.recoveryBridgeDecision,

      recoveryBridgeOpen:
        false,

      recoveryRequirement:
        "RECOVERY_REQUIRED",

      providerFailureClassified:
        failure.providerFailureClassified,

      failureStatus:
        failure.failureStatus,

      failureClassification:
        failure.failureClassification,

      failureSeverity:
        failure.failureSeverity,

      providerEvidenceGenerated:
        failure.providerEvidenceGenerated,

      providerVerified:
        failure.providerVerified,

      providerExecuted:
        failure.providerExecuted,

      providerAdmitted:
        failure.providerAdmitted,

      providerResolved:
        failure.providerResolved,

      mappingValidated:
        failure.mappingValidated,

      providerEnabled:
        failure.providerEnabled,

      providerContract:
        failure.providerContract,

      providerImplementation:
        failure.providerImplementation,

      operation:
        failure.operation,

      denialReason:
        "RECOVERY_BRIDGE_NOT_ALLOWED",

      failureSummary: [
        ...failure.summary,
      ],

      summary: [
        ...failure.summary,
        "recovery_required",
        "recovery_bridge_not_allowed",
        "recovery_bridge_closed",
      ],

    };

  }

  return {

    recoveryBridgeStatus:
      "PROVIDER_RECOVERY_BRIDGE_OPEN",

    recoveryBridgeDecision:
      request.recoveryBridgeDecision,

    recoveryBridgeOpen:
      true,

    recoveryRequirement:
      "RECOVERY_REQUIRED",

    providerFailureClassified:
      failure.providerFailureClassified,

    failureStatus:
      failure.failureStatus,

    failureClassification:
      failure.failureClassification,

    failureSeverity:
      failure.failureSeverity,

    providerEvidenceGenerated:
      failure.providerEvidenceGenerated,

    providerVerified:
      failure.providerVerified,

    providerExecuted:
      failure.providerExecuted,

    providerAdmitted:
      failure.providerAdmitted,

    providerResolved:
      failure.providerResolved,

    mappingValidated:
      failure.mappingValidated,

    providerEnabled:
      failure.providerEnabled,

    providerContract:
      failure.providerContract,

    providerImplementation:
      failure.providerImplementation,

    operation:
      failure.operation,

    failureSummary: [
      ...failure.summary,
    ],

    summary: [
      ...failure.summary,
      "recovery_required",
      "provider_recovery_bridge_open",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Recovery Bridge receives
// ProviderFailureResult.
//
// It never:
//
// - re-runs Mapping
// - re-runs Admission
// - re-runs Execution
// - re-runs Verification
// - re-generates Evidence
// - re-classifies Failure
//
// It preserves:
//
// ✓ providerFailureClassified
// ✓ failureStatus
// ✓ failureClassification
// ✓ failureSeverity
// ✓ providerEvidenceGenerated
// ✓ providerVerified
// ✓ providerExecuted
// ✓ providerAdmitted
// ✓ providerResolved
// ✓ mappingValidated
// ✓ providerEnabled
// ✓ providerContract
// ✓ providerImplementation
// ✓ operation
//
// Provider Recovery Bridge routes
// classified failures toward future
// recovery runtime.
//
// Provider Recovery Bridge does not
// recover providers.
//
// Provider Recovery Bridge does not
// retry provider calls.
//
// Provider Recovery Bridge does not
// mutate failure or evidence.
//
// ============================================================


// ============================================================
// P9H.7 PRINCIPLE
// ============================================================
//
// Provider Failure Handling
// ≠
// Provider Recovery Bridge
//
// Failure Classified
// ≠
// Recovery Bridge Open
//
// Recovery Bridge Open
// ≠
// Recovery Executed
//
// Recovery Bridge routes.
//
// Recovery Runtime recovers.
//
// Provider Failure remains immutable.
//
// Provider Evidence remains immutable.
//
// Subsequent domains may preserve them.
//
// They never reinterpret them.
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
// - verify providers
// - generate provider evidence
// - classify failures again
// - mutate provider evidence
// - mutate provider failure
// - retry provider calls
// - recover providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - persist evidence
// - write ledger records
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderFailureResult
//
// ✓ preserve failure context
//
// ✓ preserve provider context
//
// ✓ preserve failure summary
//
// ✓ determine recovery requirement
//
// ✓ authorize recovery bridge boundary
//
// ✓ deny bridge when no provider
//   failure exists
//
// ✓ deny bridge when bridge decision
//   keeps recovery closed
//
// ✗ classify failures again
//
// ✗ mutate evidence
//
// ✗ mutate failure
//
// ✗ retry provider calls
//
// ✗ recover providers
//
// ✗ call provider APIs
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================