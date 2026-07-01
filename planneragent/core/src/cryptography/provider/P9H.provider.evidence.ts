// ============================================================
// PlannerAgent — Provider Evidence
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.evidence.ts
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
// P9H.5 — Provider Evidence
//
// PURPOSE
// ------------------------------------------------------------
// Preserve Provider Runtime
// verification results as provider
// evidence.
//
// Provider Evidence preserves.
//
// Provider Evidence does not decide.
//
// Provider Evidence does not verify.
//
// Provider Evidence does not execute.
//
// Provider Evidence does not persist
// evidence.
//
// This file receives
// ProviderVerificationResult and produces
// ProviderEvidenceResult.
//
// This file does not:
//
// - resolve providers
// - admit providers
// - execute providers
// - verify providers
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
// Provider Executed
// ↓
// Provider Verified
// ↓
// Provider Evidence Generated
//
// Provider Verified
// ≠
// Provider Evidence Generated
//
// Evidence Generated
// ≠
// Evidence Persisted
//
// ============================================================

import {
  ProviderVerificationResult,
} from "./P9H.provider.verification";


// ============================================================
// EVIDENCE STATUS
// ============================================================

export type ProviderEvidenceStatus =
  | "PROVIDER_EVIDENCE_GENERATED"
  | "PROVIDER_EVIDENCE_NOT_GENERATED";


// ============================================================
// EVIDENCE DENIAL
// ============================================================

export type ProviderEvidenceDenialReason =
  | "PROVIDER_NOT_VERIFIED";


// ============================================================
// REQUEST
// ============================================================

export interface ProviderEvidenceRequest {

  verification:
    ProviderVerificationResult;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderEvidenceResult {

  evidenceStatus:
    ProviderEvidenceStatus;

  providerEvidenceGenerated:
    boolean;

  providerVerified:
    ProviderVerificationResult["providerVerified"];

  providerExecuted:
    ProviderVerificationResult["providerExecuted"];

  providerAdmitted:
    ProviderVerificationResult["providerAdmitted"];

  providerResolved:
    ProviderVerificationResult["providerResolved"];

  mappingValidated:
    ProviderVerificationResult["mappingValidated"];

  providerEnabled:
    ProviderVerificationResult["providerEnabled"];

  providerContract:
    ProviderVerificationResult["providerContract"];

  providerImplementation:
    ProviderVerificationResult["providerImplementation"];

  operation:
    ProviderVerificationResult["operation"];

  denialReason?:
    ProviderEvidenceDenialReason;

  verificationSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// EVIDENCE
// ============================================================

export function generateProviderEvidence(
  request: ProviderEvidenceRequest
): ProviderEvidenceResult {

  const verification =
    request.verification;

  if (!verification.providerVerified) {

    return {

      evidenceStatus:
        "PROVIDER_EVIDENCE_NOT_GENERATED",

      providerEvidenceGenerated:
        false,

      providerVerified:
        verification.providerVerified,

      providerExecuted:
        verification.providerExecuted,

      providerAdmitted:
        verification.providerAdmitted,

      providerResolved:
        verification.providerResolved,

      mappingValidated:
        verification.mappingValidated,

      providerEnabled:
        verification.providerEnabled,

      providerContract:
        verification.providerContract,

      providerImplementation:
        verification.providerImplementation,

      operation:
        verification.operation,

      denialReason:
        "PROVIDER_NOT_VERIFIED",

      verificationSummary: [
        ...verification.summary,
      ],

      summary: [
        ...verification.summary,
        "provider_not_verified",
        "provider_evidence_not_generated",
      ],

    };

  }

  return {

    evidenceStatus:
      "PROVIDER_EVIDENCE_GENERATED",

    providerEvidenceGenerated:
      true,

    providerVerified:
      verification.providerVerified,

    providerExecuted:
      verification.providerExecuted,

    providerAdmitted:
      verification.providerAdmitted,

    providerResolved:
      verification.providerResolved,

    mappingValidated:
      verification.mappingValidated,

    providerEnabled:
      verification.providerEnabled,

    providerContract:
      verification.providerContract,

    providerImplementation:
      verification.providerImplementation,

    operation:
      verification.operation,

    verificationSummary: [
      ...verification.summary,
    ],

    summary: [
      ...verification.summary,
      "provider_evidence_generated",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Evidence receives
// ProviderVerificationResult.
//
// It never:
//
// - re-runs Mapping
// - re-runs Admission
// - re-runs Execution
// - re-runs Verification
//
// It preserves:
//
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
// Provider Evidence preserves
// verification as provider evidence.
//
// Provider Evidence is immutable.
//
// Subsequent domains may preserve it.
//
// They never reinterpret it.
//
// Provider Evidence does not persist
// evidence.
//
// Provider Evidence does not write
// ledger records.
//
// ============================================================


// ============================================================
// P9H.5 PRINCIPLE
// ============================================================
//
// Provider Verification
// ≠
// Provider Evidence
//
// Provider Executed
// ↓
// Provider Verified
// ↓
// Provider Evidence Generated
//
// Provider Verified
// ≠
// Provider Evidence Generated
//
// Provider Evidence
// ≠
// Provider Ledger
//
// Evidence Generated
// ≠
// Evidence Persisted
//
// Evidence preserves.
//
// Ledger persists.
//
// Audit verifies persistence.
//
// Evidence does not decide.
//
// Evidence never introduces a new
// operational decision point.
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
// - decide whether evidence should
//   be generated beyond verification
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
// ✓ receive ProviderVerificationResult
//
// ✓ preserve verification result
//
// ✓ preserve provider context
//
// ✓ preserve verification summary
//
// ✓ generate provider evidence boundary
//
// ✓ produce providerEvidenceGenerated
//
// ✗ decide
//
// ✗ verify provider
//
// ✗ execute provider
//
// ✗ call provider APIs
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================