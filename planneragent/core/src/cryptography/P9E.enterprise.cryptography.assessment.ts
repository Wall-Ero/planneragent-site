// ============================================================
// PlannerAgent — P9E Enterprise Cryptography Assessment
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/
// P9E.enterprise.cryptography.assessment.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Enterprise Cryptography Assessment
//
// DOMAIN
// ------------------------------------------------------------
// P9E.0 — Enterprise Cryptography Assessment
//
// PURPOSE
// ------------------------------------------------------------
// Determine whether enterprise cryptography
// capabilities reuse existing P9C architectural
// families or may require new architectural
// families.
//
// This file does not implement enterprise
// cryptography.
//
// This file assesses the architectural nature
// of enterprise cryptography capabilities.
//
// CORE QUESTION
// ------------------------------------------------------------
// Do enterprise cryptography capabilities
// reuse existing architectural families
//
// or
//
// introduce candidate new architectural
// families requiring dedicated assessment?
//
// CORE RULE
// ------------------------------------------------------------
// Assessment
// ↓
// Principle
// ↓
// Domain
// ↓
// Implementation
//
// ============================================================


// ============================================================
// ENTERPRISE CAPABILITY
// ============================================================

export type EnterpriseCryptographyCapability =
  | "KEY_ROTATION"
  | "ENVELOPE_ENCRYPTION"
  | "KMS_RUNTIME"
  | "ENCRYPTION_AT_REST_RUNTIME"
  | "SECRET_LIFECYCLE"
  | "CRYPTOGRAPHIC_AUDITABILITY";


// ============================================================
// ARCHITECTURAL FAMILY
// ============================================================

export type EnterpriseCryptographyFamily =
  | "GOVERNANCE_FAMILY"
  | "MECHANISM_FAMILY"
  | "INFRASTRUCTURE_FAMILY"
  | "CANDIDATE_LIFECYCLE_FAMILY"
  | "CANDIDATE_AUDITABILITY_FAMILY";


// ============================================================
// ASSESSMENT OUTCOME
// ============================================================

export type EnterpriseCryptographyAssessmentOutcome =
  | "REUSE_EXISTING_FAMILIES"
  | "CANDIDATE_LIFECYCLE_FAMILY_IDENTIFIED"
  | "CANDIDATE_AUDITABILITY_FAMILY_IDENTIFIED"
  | "HYBRID_ENTERPRISE_MODEL";


// ============================================================
// ASSESSMENT RESULT
// ============================================================

export interface EnterpriseCryptographyAssessmentResult {

  capability:
    EnterpriseCryptographyCapability;

  family:
    EnterpriseCryptographyFamily;

  requiresDedicatedAssessment:
    boolean;

  summary:
    string[];

}


// ============================================================
// ASSESSMENT REPORT
// ============================================================

export interface EnterpriseCryptographyAssessmentReport {

  results:
    EnterpriseCryptographyAssessmentResult[];

  outcome:
    EnterpriseCryptographyAssessmentOutcome;

  summary:
    string[];

}


// ============================================================
// CANONICAL RESULTS
// ============================================================

export const ENTERPRISE_CRYPTOGRAPHY_RESULTS:
  EnterpriseCryptographyAssessmentResult[] = [

  {
    capability:
      "KEY_ROTATION",

    family:
      "CANDIDATE_LIFECYCLE_FAMILY",

    requiresDedicatedAssessment:
      true,

    summary: [
      "key_rotation",
      "candidate_lifecycle_family_required",
    ],
  },

  {
    capability:
      "ENVELOPE_ENCRYPTION",

    family:
      "MECHANISM_FAMILY",

    requiresDedicatedAssessment:
      false,

    summary: [
      "envelope_encryption",
      "mechanism_family",
    ],
  },

  {
    capability:
      "KMS_RUNTIME",

    family:
      "INFRASTRUCTURE_FAMILY",

    requiresDedicatedAssessment:
      false,

    summary: [
      "kms_runtime",
      "infrastructure_family",
    ],
  },

  {
    capability:
      "ENCRYPTION_AT_REST_RUNTIME",

    family:
      "INFRASTRUCTURE_FAMILY",

    requiresDedicatedAssessment:
      false,

    summary: [
      "encryption_at_rest_runtime",
      "infrastructure_family",
    ],
  },

  {
    capability:
      "SECRET_LIFECYCLE",

    family:
      "CANDIDATE_LIFECYCLE_FAMILY",

    requiresDedicatedAssessment:
      true,

    summary: [
      "secret_lifecycle",
      "candidate_lifecycle_family_required",
    ],
  },

  {
    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    family:
      "CANDIDATE_AUDITABILITY_FAMILY",

    requiresDedicatedAssessment:
      true,

    summary: [
      "cryptographic_auditability",
      "candidate_auditability_family_required",
    ],
  },

];


// ============================================================
// ASSESSMENT
// ============================================================

export function assessEnterpriseCryptography():
  EnterpriseCryptographyAssessmentReport {

  const lifecycleCandidateDetected =
    ENTERPRISE_CRYPTOGRAPHY_RESULTS.some(
      result =>
        result.family ===
        "CANDIDATE_LIFECYCLE_FAMILY"
    );

  const auditabilityCandidateDetected =
    ENTERPRISE_CRYPTOGRAPHY_RESULTS.some(
      result =>
        result.family ===
        "CANDIDATE_AUDITABILITY_FAMILY"
    );

  const outcome:
    EnterpriseCryptographyAssessmentOutcome =

      lifecycleCandidateDetected &&
      auditabilityCandidateDetected

        ? "HYBRID_ENTERPRISE_MODEL"

        : lifecycleCandidateDetected

          ? "CANDIDATE_LIFECYCLE_FAMILY_IDENTIFIED"

          : auditabilityCandidateDetected

            ? "CANDIDATE_AUDITABILITY_FAMILY_IDENTIFIED"

            : "REUSE_EXISTING_FAMILIES";

  return {

    results:
      ENTERPRISE_CRYPTOGRAPHY_RESULTS,

    outcome,

    summary: [
      "enterprise_cryptography_assessment",
      "candidate_family_analysis",
      "observation_pending_runner_verification",
    ],

  };

}


// ============================================================
// EMERGING OBSERVATION
// ============================================================
//
// Current assessment suggests:
//
// - Envelope Encryption reuses
//   Mechanism Family
//
// - KMS Runtime reuses
//   Infrastructure Family
//
// - Encryption-at-Rest Runtime reuses
//   Infrastructure Family
//
// - Key Rotation may require a
//   Lifecycle Family
//
// - Secret Lifecycle may require a
//   Lifecycle Family
//
// - Cryptographic Auditability may require
//   an Auditability Family
//
// Candidate family discoveries remain
// subject to falsification.
//
// Observation pending runner verification.
//
// ============================================================


// ============================================================
// P9E ASSESSMENT PRINCIPLE
// ============================================================
//
// Candidate Family Identified
// ≠
// Family Verified
//
// Candidate Family Identified
// ≠
// Domain Required
//
// Candidate Family Identified
// →
// Requires Dedicated Assessment
//
// New Topic
// ≠
// New Family
//
// New Family
// ≠
// New Domain
//
// Assessment must falsify candidate
// families before domain creation.
//
// ============================================================