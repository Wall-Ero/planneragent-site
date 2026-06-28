// ============================================================
// PlannerAgent — P9E Auditability Family Falsification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/
// P9E.auditability.family.falsification.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Auditability Family Falsification
//
// DOMAIN
// ------------------------------------------------------------
// P9E.6 — Auditability Family Falsification
//
// PURPOSE
// ------------------------------------------------------------
// Determine whether Cryptographic
// Auditability can be expressed through
// an existing architectural family
// or requires a dedicated Auditability
// Family.
//
// This file does not:
//
// - create Auditability Family
// - create domains
// - create implementations
// - write evidence
// - write ledger records
// - perform audits
//
// This file performs the final
// falsification attempt before any
// Auditability Family may be defined.
//
// CORE QUESTION
// ------------------------------------------------------------
// Can CRYPTOGRAPHIC_AUDITABILITY
// be expressed through an existing
// architectural family?
//
// or
//
// does it require a dedicated
// Auditability Family?
//
// CORE RULE
// ------------------------------------------------------------
// Candidate Survival
// ≠
// Family Required
//
// Family Required
// requires final falsification.
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

export type AuditabilityFalsificationClassification =
  | "EXPRESSIBLE_THROUGH_EXISTING_FAMILY"
  | "REQUIRES_AUDITABILITY_FAMILY";


// ============================================================
// OUTCOME
// ============================================================

export type AuditabilityFalsificationOutcome =
  | "REUSE_EXISTING_FAMILY"
  | "AUDITABILITY_FAMILY_REQUIRED";


// ============================================================
// INPUT
// ============================================================

export interface AuditabilityFalsificationInput {

  capability:
    AuditabilityCapability;

  existingFamilyTested?:
    ExistingArchitecturalFamily;

  expressibleThroughExistingFamily:
    boolean;

  rationale:
    string[];

}


// ============================================================
// RESULT
// ============================================================

export interface AuditabilityFalsificationResult {

  capability:
    AuditabilityCapability;

  classification:
    AuditabilityFalsificationClassification;

  outcome:
    AuditabilityFalsificationOutcome;

  expressedThrough?:
    ExistingArchitecturalFamily;

  summary:
    string[];

}


// ============================================================
// FALSIFICATION
// ============================================================

export function falsifyAuditabilityFamily(
  input: AuditabilityFalsificationInput
): AuditabilityFalsificationResult {

  if (input.expressibleThroughExistingFamily) {

    return {

      capability:
        input.capability,

      classification:
        "EXPRESSIBLE_THROUGH_EXISTING_FAMILY",

      outcome:
        "REUSE_EXISTING_FAMILY",

      expressedThrough:
        input.existingFamilyTested,

      summary: [
        ...input.rationale,
        "auditability_absorbed_by_existing_family",
      ],

    };

  }

  return {

    capability:
      input.capability,

    classification:
      "REQUIRES_AUDITABILITY_FAMILY",

    outcome:
      "AUDITABILITY_FAMILY_REQUIRED",

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
// Cryptographic Auditability survived
// candidate-family falsification.
//
// Survival alone does not verify
// family existence.
//
// This file performs the final
// falsification step:
//
// Existing Family Sufficient
// or
// Auditability Family Required.
//
// ============================================================


// ============================================================
// P9E.6 PRINCIPLE
// ============================================================
//
// Candidate Survives
// ≠
// Family Required
//
// Existing Family Insufficient
// →
// Auditability Family Required
//
// Auditability Family Required
// ≠
// Auditability Domain Created
//
// Auditability Domain Creation
// requires verified family existence.
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive auditability falsification input
//
// ✓ test existing family sufficiency
//
// ✓ classify auditability requirement
//
// ✓ produce local falsification outcome
//
// ✗ create family
//
// ✗ create domain
//
// ✗ implement auditability
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ perform audits
//
// ============================================================