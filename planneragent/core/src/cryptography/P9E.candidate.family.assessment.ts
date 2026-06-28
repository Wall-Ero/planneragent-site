// ============================================================
// PlannerAgent — P9E Candidate Family Assessment
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/
// P9E.candidate.family.assessment.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Candidate Family Assessment
//
// DOMAIN
// ------------------------------------------------------------
// P9E.1 — Candidate Family Assessment
//
// PURPOSE
// ------------------------------------------------------------
// Determine whether candidate enterprise
// cryptography capabilities can be expressed
// through existing architectural families
// or require dedicated family assessment.
//
// This file does not verify new families.
//
// This file does not create domains.
//
// This file prepares candidate capabilities
// for falsification against existing
// architectural families.
//
// CORE QUESTION
// ------------------------------------------------------------
// Can candidate enterprise cryptography
// capabilities be expressed through:
//
// - Governance Family
// - Mechanism Family
// - Infrastructure Family
//
// or do they survive as candidate
// new architectural families?
//
// ASSESSMENT LEVELS
// ------------------------------------------------------------
//
// Assessment Level 1
//
// Capability
// ↓
// Candidate Family
//
// Assessment Level 2
//
// Candidate Family
// ↓
// Existing Family ?
// ↓
// New Family ?
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
// CANDIDATE CAPABILITY
// ============================================================

export type CandidateFamilyCapability =
  | "KEY_ROTATION"
  | "SECRET_LIFECYCLE"
  | "CRYPTOGRAPHIC_AUDITABILITY";


// ============================================================
// EXISTING ARCHITECTURAL FAMILY
// ============================================================

export type ExistingArchitecturalFamily =
  | "GOVERNANCE_FAMILY"
  | "MECHANISM_FAMILY"
  | "INFRASTRUCTURE_FAMILY";


// ============================================================
// CLASSIFICATION
// ============================================================

export type CandidateFamilyClassification =
  | "UNDER_FALSIFICATION"
  | "EXPRESSIBLE_THROUGH_EXISTING_FAMILY"
  | "CANDIDATE_NEW_FAMILY";


// ============================================================
// ASSESSMENT OUTCOME
// ============================================================

export type CandidateFamilyAssessmentOutcome =
  | "FALSIFICATION_PENDING"
  | "REUSE_EXISTING_FAMILIES"
  | "SINGLE_CANDIDATE_SURVIVES"
  | "MULTIPLE_CANDIDATES_SURVIVE";


// ============================================================
// ASSESSMENT RESULT
// ============================================================

export interface CandidateFamilyAssessmentResult {

  capability:
    CandidateFamilyCapability;

  classification:
    CandidateFamilyClassification;

  expressedThrough?:
    ExistingArchitecturalFamily;

  requiresDedicatedAssessment:
    boolean;

  summary:
    string[];

}


// ============================================================
// ASSESSMENT REPORT
// ============================================================

export interface CandidateFamilyAssessmentReport {

  results:
    CandidateFamilyAssessmentResult[];

  outcome:
    CandidateFamilyAssessmentOutcome;

  summary:
    string[];

}


// ============================================================
// CANONICAL RESULTS
// ============================================================

export const CANDIDATE_FAMILY_RESULTS:
  CandidateFamilyAssessmentResult[] = [

  {
    capability:
      "KEY_ROTATION",

    classification:
      "UNDER_FALSIFICATION",

    requiresDedicatedAssessment:
      true,

    summary: [
      "key_rotation",
      "under_falsification",
    ],
  },

  {
    capability:
      "SECRET_LIFECYCLE",

    classification:
      "UNDER_FALSIFICATION",

    requiresDedicatedAssessment:
      true,

    summary: [
      "secret_lifecycle",
      "under_falsification",
    ],
  },

  {
    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    classification:
      "UNDER_FALSIFICATION",

    requiresDedicatedAssessment:
      true,

    summary: [
      "cryptographic_auditability",
      "under_falsification",
    ],
  },

];


// ============================================================
// ASSESSMENT
// ============================================================

export function assessCandidateFamilies():
  CandidateFamilyAssessmentReport {

  return {

    results:
      CANDIDATE_FAMILY_RESULTS,

    outcome:
      "FALSIFICATION_PENDING",

    summary: [
      "candidate_family_assessment",
      "candidate_families_identified",
      "falsification_pending",
      "family_verification_not_performed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Current assessment has not verified
// any new architectural family.
//
// Current assessment has not verified
// any family survival outcome.
//
// Current assessment identifies candidate
// capabilities requiring falsification
// against existing architectural families.
//
// Candidate Family Identified
// ≠
// Family Verified
//
// Family Verified
// ≠
// Domain Required
//
// Domain Required
// ≠
// Implementation Required
//
// Family verification requires dedicated
// falsification before domain creation.
//
// ============================================================


// ============================================================
// P9E.1 PRINCIPLE
// ============================================================
//
// The purpose of this assessment is not
// to verify new families.
//
// The purpose of this assessment is not
// to create domains.
//
// The purpose of this assessment is to
// prepare candidate capabilities for
// falsification against existing
// architectural families.
//
// UNDER_FALSIFICATION
// ↓
// EXPRESSIBLE_THROUGH_EXISTING_FAMILY
//
// or
//
// UNDER_FALSIFICATION
// ↓
// CANDIDATE_NEW_FAMILY
//
// may only occur after runner verification.
//
// If candidates are absorbed:
//
// REUSE_EXISTING_FAMILIES
// → STOP
//
// If candidates survive:
//
// dedicated family assessment may begin.
//
// ============================================================