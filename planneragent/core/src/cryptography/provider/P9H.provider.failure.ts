// ============================================================
// PlannerAgent — Provider Failure Handling
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.failure.ts
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
// P9H.6 — Provider Failure Handling
//
// PURPOSE
// ------------------------------------------------------------
// Classify provider failure conditions
// from provider evidence.
//
// Provider Failure Handling classifies.
//
// Provider Failure Handling does not
// recover.
//
// Provider Failure Handling does not
// retry provider calls.
//
// Provider Failure Handling does not
// mutate evidence.
//
// This file receives ProviderEvidenceResult
// and produces ProviderFailureResult.
//
// This file does not:
//
// - resolve providers
// - admit providers
// - execute providers
// - verify providers
// - generate provider evidence
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
// Provider Mapping resolves.
//
// Provider Admission admits.
//
// Provider Execution executes.
//
// Provider Verification verifies.
//
// Provider Evidence preserves.
//
// Provider Failure Handling classifies.
//
// Provider Failure Handling
// ≠
// Provider Recovery Bridge
//
// Failure Classified
// ≠
// Recovery Executed
//
// ============================================================

import {
  ProviderEvidenceResult,
} from "./P9H.provider.evidence";


// ============================================================
// FAILURE STATUS
// ============================================================

export type ProviderFailureStatus =
  | "PROVIDER_FAILURE_CLASSIFIED"
  | "NO_PROVIDER_FAILURE";


// ============================================================
// FAILURE CLASSIFICATION
// ============================================================

export type ProviderFailureClassification =
  | "PROVIDER_NOT_RESOLVED"
  | "PROVIDER_NOT_ADMITTED"
  | "PROVIDER_NOT_EXECUTED"
  | "PROVIDER_NOT_VERIFIED"
  | "PROVIDER_EVIDENCE_NOT_GENERATED"
  | "NO_FAILURE_DETECTED";

// ============================================================
// FAILURE SEVERITY
// ============================================================

export type ProviderFailureSeverity =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";


// ============================================================
// REQUEST
// ============================================================

export interface ProviderFailureRequest {

  evidence:
    ProviderEvidenceResult;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderFailureResult {

  failureStatus:
    ProviderFailureStatus;

  failureClassification:
    ProviderFailureClassification;

  failureSeverity:
    ProviderFailureSeverity;

  providerFailureClassified:
    boolean;

  providerEvidenceGenerated:
    ProviderEvidenceResult["providerEvidenceGenerated"];

  providerVerified:
    ProviderEvidenceResult["providerVerified"];

  providerExecuted:
    ProviderEvidenceResult["providerExecuted"];

  providerAdmitted:
    ProviderEvidenceResult["providerAdmitted"];

  providerResolved:
    ProviderEvidenceResult["providerResolved"];

  mappingValidated:
    ProviderEvidenceResult["mappingValidated"];

  providerEnabled:
    ProviderEvidenceResult["providerEnabled"];

  providerContract:
    ProviderEvidenceResult["providerContract"];

  providerImplementation:
    ProviderEvidenceResult["providerImplementation"];

  operation:
    ProviderEvidenceResult["operation"];

  evidenceSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// FAILURE CLASSIFICATION
// ============================================================

export function classifyProviderFailure(
  request: ProviderFailureRequest
): ProviderFailureResult {

  const evidence =
    request.evidence;

  if (!evidence.providerResolved) {

    return {

      failureStatus:
        "PROVIDER_FAILURE_CLASSIFIED",

      failureClassification:
        "PROVIDER_NOT_RESOLVED",

      failureSeverity:
        "HIGH",

      providerFailureClassified:
        true,

      providerEvidenceGenerated:
        evidence.providerEvidenceGenerated,

      providerVerified:
        evidence.providerVerified,

      providerExecuted:
        evidence.providerExecuted,

      providerAdmitted:
        evidence.providerAdmitted,

      providerResolved:
        evidence.providerResolved,

      mappingValidated:
        evidence.mappingValidated,

      providerEnabled:
        evidence.providerEnabled,

      providerContract:
        evidence.providerContract,

      providerImplementation:
        evidence.providerImplementation,

      operation:
        evidence.operation,

      evidenceSummary: [
        ...evidence.summary,
      ],

      summary: [
        ...evidence.summary,
        "provider_not_resolved",
        "provider_failure_classified",
      ],

    };

  }

  if (!evidence.providerAdmitted) {

    return {

      failureStatus:
        "PROVIDER_FAILURE_CLASSIFIED",

      failureClassification:
        "PROVIDER_NOT_ADMITTED",

      failureSeverity:
        "HIGH",

      providerFailureClassified:
        true,

      providerEvidenceGenerated:
        evidence.providerEvidenceGenerated,

      providerVerified:
        evidence.providerVerified,

      providerExecuted:
        evidence.providerExecuted,

      providerAdmitted:
        evidence.providerAdmitted,

      providerResolved:
        evidence.providerResolved,

      mappingValidated:
        evidence.mappingValidated,

      providerEnabled:
        evidence.providerEnabled,

      providerContract:
        evidence.providerContract,

      providerImplementation:
        evidence.providerImplementation,

      operation:
        evidence.operation,

      evidenceSummary: [
        ...evidence.summary,
      ],

      summary: [
        ...evidence.summary,
        "provider_not_admitted",
        "provider_failure_classified",
      ],

    };

  }

  if (!evidence.providerExecuted) {

    return {

      failureStatus:
        "PROVIDER_FAILURE_CLASSIFIED",

      failureClassification:
        "PROVIDER_NOT_EXECUTED",

      failureSeverity:
        "CRITICAL",

      providerFailureClassified:
        true,

      providerEvidenceGenerated:
        evidence.providerEvidenceGenerated,

      providerVerified:
        evidence.providerVerified,

      providerExecuted:
        evidence.providerExecuted,

      providerAdmitted:
        evidence.providerAdmitted,

      providerResolved:
        evidence.providerResolved,

      mappingValidated:
        evidence.mappingValidated,

      providerEnabled:
        evidence.providerEnabled,

      providerContract:
        evidence.providerContract,

      providerImplementation:
        evidence.providerImplementation,

      operation:
        evidence.operation,

      evidenceSummary: [
        ...evidence.summary,
      ],

      summary: [
        ...evidence.summary,
        "provider_not_executed",
        "provider_failure_classified",
      ],

    };

  }

  if (!evidence.providerVerified) {

    return {

      failureStatus:
        "PROVIDER_FAILURE_CLASSIFIED",

      failureClassification:
        "PROVIDER_NOT_VERIFIED",

      failureSeverity:
        "HIGH",

      providerFailureClassified:
        true,

      providerEvidenceGenerated:
        evidence.providerEvidenceGenerated,

      providerVerified:
        evidence.providerVerified,

      providerExecuted:
        evidence.providerExecuted,

      providerAdmitted:
        evidence.providerAdmitted,

      providerResolved:
        evidence.providerResolved,

      mappingValidated:
        evidence.mappingValidated,

      providerEnabled:
        evidence.providerEnabled,

      providerContract:
        evidence.providerContract,

      providerImplementation:
        evidence.providerImplementation,

      operation:
        evidence.operation,

      evidenceSummary: [
        ...evidence.summary,
      ],

      summary: [
        ...evidence.summary,
        "provider_not_verified",
        "provider_failure_classified",
      ],

    };

  }

  if (!evidence.providerEvidenceGenerated) {

    return {

      failureStatus:
        "PROVIDER_FAILURE_CLASSIFIED",

      failureClassification:
        "PROVIDER_EVIDENCE_NOT_GENERATED",

      failureSeverity:
        "MEDIUM",

      providerFailureClassified:
        true,

      providerEvidenceGenerated:
        evidence.providerEvidenceGenerated,

      providerVerified:
        evidence.providerVerified,

      providerExecuted:
        evidence.providerExecuted,

      providerAdmitted:
        evidence.providerAdmitted,

      providerResolved:
        evidence.providerResolved,

      mappingValidated:
        evidence.mappingValidated,

      providerEnabled:
        evidence.providerEnabled,

      providerContract:
        evidence.providerContract,

      providerImplementation:
        evidence.providerImplementation,

      operation:
        evidence.operation,

      evidenceSummary: [
        ...evidence.summary,
      ],

      summary: [
        ...evidence.summary,
        "provider_evidence_not_generated",
        "provider_failure_classified",
      ],

    };

  }

  return {

    failureStatus:
      "NO_PROVIDER_FAILURE",

    failureClassification:
      "NO_FAILURE_DETECTED",

    failureSeverity:
      "NONE",

    providerFailureClassified:
      false,

    providerEvidenceGenerated:
      evidence.providerEvidenceGenerated,

    providerVerified:
      evidence.providerVerified,

    providerExecuted:
      evidence.providerExecuted,

    providerAdmitted:
      evidence.providerAdmitted,

    providerResolved:
      evidence.providerResolved,

    mappingValidated:
      evidence.mappingValidated,

    providerEnabled:
      evidence.providerEnabled,

    providerContract:
      evidence.providerContract,

    providerImplementation:
      evidence.providerImplementation,

    operation:
      evidence.operation,

    evidenceSummary: [
      ...evidence.summary,
    ],

    summary: [
      ...evidence.summary,
      "no_provider_failure_detected",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Failure Handling receives
// ProviderEvidenceResult.
//
// It never:
//
// - re-runs Mapping
// - re-runs Admission
// - re-runs Execution
// - re-runs Verification
// - re-generates Evidence
//
// It classifies failure conditions
// from preserved provider evidence.
//
// It preserves:
//
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
// Provider Failure Handling does not
// mutate evidence.
//
// Failure Handling preserves the
// observed failure.
//
// It never infers additional failures.
//
//
// Provider Failure Handling does not
// retry provider calls.
//
// Provider Failure Handling does not
// recover providers.
//
// ============================================================


// ============================================================
// P9H.6 PRINCIPLE
// ============================================================
//
// Provider Evidence
// ≠
// Provider Failure Handling
//
// Provider Failure Handling
// ≠
// Provider Recovery Bridge
//
// Failure Observed
// ≠
// Failure Classified
//
// Failure Classified
// ≠
// Recovery Authorized
//
// Recovery Authorized
// ≠
// Recovery Executed
//
// Failure Handling classifies.
//
// Recovery Bridge routes recovery.
//
// Provider Evidence remains immutable.
//
// Subsequent domains may preserve it.
//
// They never reinterpret it.
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
// - mutate provider evidence
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
// ✓ receive ProviderEvidenceResult
//
// ✓ classify provider failure conditions
//
// ✓ preserve failure context
//
// ✓ preserve provider context
//
// ✓ preserve evidence summary
//
// ✗ mutate evidence
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