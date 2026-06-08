// ============================================================
// PlannerAgent — Storage & Infrastructure Assessment
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// cryptography.infrastructure.assessment.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Architecture Assessment
//
// DOMAIN
// ------------------------------------------------------------
// P9C.7.0 — Storage & Infrastructure Assessment
//
// PURPOSE
// ------------------------------------------------------------
// Determine the natural architectural chain
// of storage and infrastructure domains.
//
// This artifact does not define:
//
// - KMS architecture
// - Vault architecture
// - Secret storage architecture
// - Infrastructure governance
//
// This artifact attempts to discover:
//
// What kind of domain Infrastructure is.
//
// ASSESSMENT OBJECTIVE
// ------------------------------------------------------------
//
// Attempt to falsify the hypothesis that
// Storage & Infrastructure naturally follows:
//
// Policy
// ↓
// Provisioning
// ↓
// Access Control
// ↓
// Usage
// ↓
// Verification
//
// The burden of proof is on the discovery
// of preservation requirements or governance
// requirements intrinsic to infrastructure.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
//
// Assessment discovers.
//
// Assessment does not assume.
//
// Evidence before principle.
//
// Principle before domain.
//
// Domain before implementation.
//
// DOES
// ------------------------------------------------------------
//
// ✓ define assessment candidates
//
// ✓ classify infrastructure objects
//
// ✓ classify architectural concerns
//
// ✓ evaluate assessment outcomes
//
// ✓ support falsification attempts
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ define KMS architecture
//
// ✗ define Vault architecture
//
// ✗ define HSM architecture
//
// ✗ provision infrastructure
//
// ✗ store secrets
//
// ✗ perform encryption
//
// ✗ define governance
//
// ✗ create evidence
//
// ✗ write ledger
//
// ✗ perform audits
//
// ✗ create execution domains
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
//
// Determine the natural architectural chain
// of Storage & Infrastructure.
//
// Nothing else.
//
// ============================================================


// ============================================================
// CLASSIFICATION
// ============================================================

export type InfrastructureAssessmentClassification =
  | "INFRASTRUCTURE_PROVISIONING"
  | "ACCESS_CONTROL"
  | "INFRASTRUCTURE_USAGE"
  | "INFRASTRUCTURE_RECOVERY"
  | "AUDITABILITY_OBJECT";


// ============================================================
// OUTCOME
// ============================================================

export type InfrastructureAssessmentOutcome =
  | "INFRASTRUCTURE_CONTROL_CHAIN"
  | "HYBRID_INFRASTRUCTURE_MODEL"
  | "INFRASTRUCTURE_GOVERNANCE_CHAIN_REQUIRED";


// ============================================================
// CANDIDATE
// ============================================================

export interface InfrastructureAssessmentCandidate {

  candidateId:
    string;

  candidateName:
    string;

}


// ============================================================
// RESULT
// ============================================================

export interface InfrastructureAssessmentResult {

  candidateId:
    string;

  candidateName:
    string;

  classification:
    InfrastructureAssessmentClassification;

  belongsToInfrastructureDomain:
    boolean;

  requiresPreservation:
    boolean;

  summary:
    string[];

}


// ============================================================
// REPORT
// ============================================================

export interface InfrastructureAssessmentReport {

  results:
    InfrastructureAssessmentResult[];

  outcome:
    InfrastructureAssessmentOutcome;

  summary:
    string[];

}


// ============================================================
// CANONICAL CANDIDATES
// ============================================================

export const INFRASTRUCTURE_ASSESSMENT_CANDIDATES:
  InfrastructureAssessmentCandidate[] = [

  {
    candidateId:
      "KMS_INTEGRATION",

    candidateName:
      "KMS Integration",
  },

  {
    candidateId:
      "VAULT_INTEGRATION",

    candidateName:
      "Vault Integration",
  },

  {
    candidateId:
      "SECRET_STORE",

    candidateName:
      "Secret Store",
  },

  {
    candidateId:
      "HSM_BOUNDARY",

    candidateName:
      "HSM Boundary",
  },

  {
    candidateId:
      "ENCRYPTION_AT_REST",

    candidateName:
      "Encryption At Rest",
  },

  {
    candidateId:
      "KEY_STORAGE",

    candidateName:
      "Key Storage",
  },

  {
    candidateId:
      "INFRASTRUCTURE_ACCESS_CONTROL",

    candidateName:
      "Infrastructure Access Control",
  },

  {
    candidateId:
      "RECOVERY_BACKUP_STORAGE",

    candidateName:
      "Recovery Backup Storage",
  },

  {
    candidateId:
      "INFRASTRUCTURE_AUDIT_TRAIL",

    candidateName:
      "Infrastructure Audit Trail",
  },

];


// ============================================================
// CANONICAL RESULTS
// ============================================================

export const CANONICAL_INFRASTRUCTURE_RESULTS:
  InfrastructureAssessmentResult[] = [

  {
    candidateId:
      "KMS_INTEGRATION",

    candidateName:
      "KMS Integration",

    classification:
      "INFRASTRUCTURE_PROVISIONING",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "kms",
      "provisioning",
    ],
  },

  {
    candidateId:
      "VAULT_INTEGRATION",

    candidateName:
      "Vault Integration",

    classification:
      "INFRASTRUCTURE_PROVISIONING",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "vault",
      "provisioning",
    ],
  },

  {
    candidateId:
      "SECRET_STORE",

    candidateName:
      "Secret Store",

    classification:
      "INFRASTRUCTURE_USAGE",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "secret_store",
      "usage",
    ],
  },

  {
    candidateId:
      "HSM_BOUNDARY",

    candidateName:
      "HSM Boundary",

    classification:
      "ACCESS_CONTROL",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "hsm",
      "access_control",
    ],
  },

  {
    candidateId:
      "ENCRYPTION_AT_REST",

    candidateName:
      "Encryption At Rest",

    classification:
      "INFRASTRUCTURE_USAGE",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "encryption_at_rest",
      "usage",
    ],
  },

  {
    candidateId:
      "KEY_STORAGE",

    candidateName:
      "Key Storage",

    classification:
      "INFRASTRUCTURE_USAGE",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "key_storage",
      "usage",
    ],
  },

  {
    candidateId:
      "INFRASTRUCTURE_ACCESS_CONTROL",

    candidateName:
      "Infrastructure Access Control",

    classification:
      "ACCESS_CONTROL",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "access_control",
    ],
  },

  {
    candidateId:
      "RECOVERY_BACKUP_STORAGE",

    candidateName:
      "Recovery Backup Storage",

    classification:
      "INFRASTRUCTURE_RECOVERY",

    belongsToInfrastructureDomain:
      true,

    requiresPreservation:
      false,

    summary: [
      "recovery",
      "backup",
    ],
  },

  {
    candidateId:
      "INFRASTRUCTURE_AUDIT_TRAIL",

    candidateName:
      "Infrastructure Audit Trail",

    classification:
      "AUDITABILITY_OBJECT",

    belongsToInfrastructureDomain:
      false,

    requiresPreservation:
      true,

    summary: [
      "auditability_candidate",
      "classification_under_review",
    ],
  },

];


// ============================================================
// ASSESSMENT
// ============================================================

export function assessInfrastructureDomain():
  InfrastructureAssessmentReport {

  const preservationRequiredInsideInfrastructureDomain =
    CANONICAL_INFRASTRUCTURE_RESULTS.some(
      result =>
        result.belongsToInfrastructureDomain &&
        result.requiresPreservation
    );

  const outcome:
    InfrastructureAssessmentOutcome =

    preservationRequiredInsideInfrastructureDomain
      ? "HYBRID_INFRASTRUCTURE_MODEL"
      : "INFRASTRUCTURE_CONTROL_CHAIN";

  return {

    results:
      CANONICAL_INFRASTRUCTURE_RESULTS,

    outcome,

    summary: [

      "assessment_completed",

      "infrastructure_domain_evaluated",

      "natural_chain_under_evaluation",

    ],

  };

}


// ============================================================
// EMERGING OBSERVATION
// ============================================================
//
// Governance Domains
//
// Policy
// ↓
// Runtime
// ↓
// Evidence
// ↓
// Ledger
// ↓
// Audit
//
// Mechanism Domains
//
// Policy
// ↓
// Execution
// ↓
// Verification
//
// Infrastructure Domains
//
// Policy
// ↓
// Provisioning
// ↓
// Access Control
// ↓
// Usage
// ↓
// Recovery
//
// Observation not yet frozen.
//
// ============================================================