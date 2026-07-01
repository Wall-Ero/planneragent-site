// ============================================================
// PlannerAgent — Provider Admission
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.admission.ts
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
// P9H.2 — Provider Admission
//
// PURPOSE
// ------------------------------------------------------------
// Decide whether a resolved provider
// mapping may enter Provider Runtime.
//
// Provider Admission admits.
//
// Provider Admission does not execute.
//
// This file receives ProviderMappingResult
// and determines whether the provider
// is admitted to runtime.
//
// This file does not:
//
// - resolve providers
// - execute provider operations
// - call provider APIs
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
// Provider Resolved
// ≠
// Provider Admitted
//
// Provider Admitted
// ≠
// Provider Executed
//
// ============================================================

import {
  ProviderMappingResult,
} from "./P9H.provider.mapping";


// ============================================================
// ADMISSION DECISION
// ============================================================

export type ProviderAdmissionDecision =
  | "ADMIT_PROVIDER"
  | "DENY_PROVIDER";


// ============================================================
// ADMISSION STATUS
// ============================================================

export type ProviderAdmissionStatus =
  | "PROVIDER_ADMITTED"
  | "PROVIDER_NOT_ADMITTED";


// ============================================================
// ADMISSION DENIAL REASON
// ============================================================

export type ProviderAdmissionDenialReason =
  | "PROVIDER_NOT_RESOLVED"
  | "PROVIDER_ADMISSION_DENIED";


// ============================================================
// REQUEST
// ============================================================

export interface ProviderAdmissionRequest {

  mapping:
    ProviderMappingResult;

  admissionDecision:
    ProviderAdmissionDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderAdmissionResult {

  admissionStatus:
    ProviderAdmissionStatus;

  admissionDecision:
    ProviderAdmissionDecision;

  providerAdmitted:
    boolean;

  providerResolved:
    ProviderMappingResult["providerResolved"];

  mappingValidated:
    ProviderMappingResult["mappingValidated"];

  providerEnabled:
    ProviderMappingResult["providerEnabled"];

  providerContract:
    ProviderMappingResult["providerContract"];

  providerImplementation:
    ProviderMappingResult["providerImplementation"];

  denialReason?:
    ProviderAdmissionDenialReason;

  mappingSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// ADMISSION
// ============================================================

export function admitProviderRuntime(
  request: ProviderAdmissionRequest
): ProviderAdmissionResult {

  const mapping =
    request.mapping;

  if (!mapping.providerResolved) {

    return {

      admissionStatus:
        "PROVIDER_NOT_ADMITTED",

      admissionDecision:
        request.admissionDecision,

      providerAdmitted:
        false,

      providerResolved:
        mapping.providerResolved,

      mappingValidated:
        mapping.mappingValidated,

      providerEnabled:
        mapping.providerEnabled,

      providerContract:
        mapping.providerContract,

      providerImplementation:
        mapping.providerImplementation,

      denialReason:
        "PROVIDER_NOT_RESOLVED",

      mappingSummary: [
        ...mapping.summary,
      ],

      summary: [
        ...mapping.summary,
        "provider_not_resolved",
        "provider_not_admitted",
      ],

    };

  }

  if (request.admissionDecision === "DENY_PROVIDER") {

    return {

      admissionStatus:
        "PROVIDER_NOT_ADMITTED",

      admissionDecision:
        request.admissionDecision,

      providerAdmitted:
        false,

      providerResolved:
        mapping.providerResolved,

      mappingValidated:
        mapping.mappingValidated,

      providerEnabled:
        mapping.providerEnabled,

      providerContract:
        mapping.providerContract,

      providerImplementation:
        mapping.providerImplementation,

      denialReason:
        "PROVIDER_ADMISSION_DENIED",

      mappingSummary: [
        ...mapping.summary,
      ],

      summary: [
        ...mapping.summary,
        "provider_admission_denied",
        "provider_not_admitted",
      ],

    };

  }

  return {

    admissionStatus:
      "PROVIDER_ADMITTED",

    admissionDecision:
      request.admissionDecision,

    providerAdmitted:
      true,

    providerResolved:
      mapping.providerResolved,

    mappingValidated:
      mapping.mappingValidated,

    providerEnabled:
      mapping.providerEnabled,

    providerContract:
      mapping.providerContract,

    providerImplementation:
      mapping.providerImplementation,

    mappingSummary: [
      ...mapping.summary,
    ],

    summary: [
      ...mapping.summary,
      "provider_admitted",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Admission receives
// Provider Mapping results.
//
// It does not re-run mapping.
//
// It does not resolve providers.
//
// It preserves mapping context:
//
// - providerResolved
// - mappingValidated
// - providerEnabled
// - providerContract
// - providerImplementation
//
// It applies a deterministic admission
// decision.
//
// Provider Admission does not execute
// provider operations.
//
// Provider Admission does not call
// provider APIs.
//
// ============================================================


// ============================================================
// P9H.2 PRINCIPLE
// ============================================================
//
// Provider Mapping
// ≠
// Provider Admission
//
// Provider Resolved
// ≠
// Provider Admitted
//
// Provider Admitted
// ≠
// Provider Executed
//
// Admission
// ≠
// Execution
//
// Boolean Permission
// ≠
// Deterministic Admission Decision
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
// - execute provider operations
// - call provider APIs
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
// ✓ receive ProviderMappingResult
//
// ✓ verify provider resolved
//
// ✓ preserve mapping validation result
//
// ✓ preserve provider enabled state
//
// ✓ preserve provider contract
//
// ✓ preserve provider implementation
//
// ✓ apply deterministic admission decision
//
// ✓ admit provider boundary
//
// ✓ deny admission when provider
//   is not resolved
//
// ✓ deny admission when admission
//   decision denies provider
//
// ✓ preserve mapping summary
//
// ✗ resolve providers
//
// ✗ re-run mapping
//
// ✗ execute providers
//
// ✗ call provider APIs
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================