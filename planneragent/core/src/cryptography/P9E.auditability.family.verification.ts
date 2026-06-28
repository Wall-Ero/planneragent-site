//core/src/cryptography/P9E.auditability.family.verification.ts

// ============================================================
// PlannerAgent — P9E Auditability Family Verification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/
// P9E.auditability.family.verification.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Auditability Family Verification
//
// DOMAIN
// ------------------------------------------------------------
// P9E.5 — Auditability Family Verification
//
// PURPOSE
// ------------------------------------------------------------
// Verify whether Cryptographic
// Auditability can be expressed
// through an existing architectural
// family or requires a dedicated
// Auditability Family.
//
// This file does not:
//
// - create families
// - create domains
// - create implementations
// - aggregate evidence
//
// This file classifies verification
// outcomes.
//
// EVIDENCE
// ------------------------------------------------------------
//
// P9E.3:
//
// CRYPTOGRAPHIC_AUDITABILITY
// → CANDIDATE_SURVIVES
//
// P9E.4:
//
// AUDITABILITY ASSESSMENT
// → COMPLETE
//
// ============================================================


// ============================================================
// CAPABILITY
// ============================================================

export type AuditabilityCapability =
  | "CRYPTOGRAPHIC_AUDITABILITY";


// ============================================================
// EXISTING FAMILY
// ============================================================

export type ExistingArchitecturalFamily =
  | "GOVERNANCE_FAMILY"
  | "MECHANISM_FAMILY"
  | "INFRASTRUCTURE_FAMILY";


// ============================================================
// CLASSIFICATION
// ============================================================

export type AuditabilityVerificationClassification =
  | "EXPRESSIBLE_THROUGH_EXISTING_FAMILY"
  | "REQUIRES_AUDITABILITY_FAMILY";


// ============================================================
// INPUT
// ============================================================

export interface AuditabilityVerificationInput {

  capability:
    AuditabilityCapability;

  verificationSucceeded:
    boolean;

  existingFamily?:
    ExistingArchitecturalFamily;

  rationale:
    string[];

}


// ============================================================
// RESULT
// ============================================================

export interface AuditabilityVerificationResult {

  capability:
    AuditabilityCapability;

  classification:
    AuditabilityVerificationClassification;

  expressedThrough?:
    ExistingArchitecturalFamily;

  summary:
    string[];

}


// ============================================================
// VERIFICATION ENGINE
// ============================================================

export function verifyAuditabilityFamily(
  input: AuditabilityVerificationInput
): AuditabilityVerificationResult {

  if (input.verificationSucceeded) {

    return {

      capability:
        input.capability,

      classification:
        "EXPRESSIBLE_THROUGH_EXISTING_FAMILY",

      expressedThrough:
        input.existingFamily,

      summary: [
        ...input.rationale,
        "existing_family_sufficient",
      ],

    };

  }

  return {

    capability:
      input.capability,

    classification:
      "REQUIRES_AUDITABILITY_FAMILY",

    summary: [
      ...input.rationale,
      "auditability_family_required",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Candidate Survival
// ≠
// Family Required
//
// Verification determines whether
// surviving evidence can still be
// expressed through an existing
// family.
//
// Verification does not create
// families.
//
// ============================================================


// ============================================================
// P9E.5 PRINCIPLE
// ============================================================
//
// Assessment
// ≠
// Verification
//
// Candidate Survives
// ≠
// Family Required
//
// Existing Family Sufficient
// ≠
// Family Verified
//
// Family Required
// ≠
// Domain Created
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive auditability evidence
//
// ✓ verify family requirement
//
// ✓ classify outcome
//
// ✗ create family
//
// ✗ create domain
//
// ✗ create implementation
//
// ✗ aggregate assessment results
//
// ============================================================