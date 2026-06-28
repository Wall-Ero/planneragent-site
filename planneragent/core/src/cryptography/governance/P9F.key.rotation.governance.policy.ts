// ============================================================
// PlannerAgent — Key Rotation Governance Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// P9F.key.rotation.governance.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Policy
//
// DOMAIN
// ------------------------------------------------------------
// P9F.1.1 — Key Rotation Governance Policy
//
// PURPOSE
// ------------------------------------------------------------
// Define governance requirements
// for cryptographic key rotation.
//
// This file defines:
//
// - rotation authority
// - rotation triggers
// - rotation evidence requirements
// - rotation audit requirements
// - rotation recovery requirements
//
// This file does not:
//
// - rotate keys
// - execute cryptography
// - call KMS APIs
// - call Vault APIs
// - interact with providers
//
// KEY PRINCIPLE
// ------------------------------------------------------------
// The purpose of this file is not:
//
// How are keys rotated?
//
// The purpose of this file is:
//
// Who may authorize key rotation?
//
// ============================================================


// ============================================================
// ROTATION AUTHORITY
// ============================================================
//
// Authority
// ≠
// Organizational Role
//
// Organizational roles may be mapped
// to authorities by future domains.
//
// ============================================================

export type RotationAuthority =
  | "PRIMARY_AUTHORITY"
  | "DELEGATED_AUTHORITY"
  | "EMERGENCY_AUTHORITY";


// ============================================================
// ROTATION TRIGGER
// ============================================================

export type RotationTrigger =
  | "SCHEDULED_ROTATION"
  | "POLICY_REQUIRED_ROTATION"
  | "KEY_COMPROMISE"
  | "SUSPECTED_COMPROMISE"
  | "REGULATORY_REQUIREMENT"
  | "EMERGENCY_ROTATION";


// ============================================================
// EVIDENCE REQUIREMENT
// ============================================================

export type RotationEvidenceRequirement =
  | "ROTATION_REQUEST"
  | "ROTATION_AUTHORIZATION"
  | "ROTATION_EXECUTION_EVIDENCE"
  | "ROTATION_VERIFICATION_EVIDENCE";


// ============================================================
// AUDIT REQUIREMENT
// ============================================================

export type RotationAuditRequirement =
  | "AUTHORIZE_ROTATION"
  | "RECORD_ROTATION"
  | "VERIFY_ROTATION"
  | "AUDIT_ROTATION";


// ============================================================
// RECOVERY REQUIREMENT
// ============================================================
//
// Governance defines that recovery
// must exist and be auditable.
//
// Governance does not define:
//
// - rollback implementation
// - key history implementation
// - snapshot implementation
// - restore implementation
//
// Those belong to Infrastructure.
//
// ============================================================

export type RotationRecoveryConstraint =
  | "RECOVERY_REQUIRED"
  | "RECOVERY_EVIDENCE_REQUIRED";


// ============================================================
// POLICY
// ============================================================

export interface KeyRotationGovernancePolicy {

  authorizedAuthorities:
    RotationAuthority[];

  authorizedTriggers:
    RotationTrigger[];

  requiredEvidence:
    RotationEvidenceRequirement[];

  requiredAuditActivities:
    RotationAuditRequirement[];

  requiredRecoveryConstraints:
    RotationRecoveryConstraint[];

}


// ============================================================
// CANONICAL POLICY
// ============================================================

export const KEY_ROTATION_GOVERNANCE_POLICY:
  KeyRotationGovernancePolicy = {

  authorizedAuthorities: [

    "PRIMARY_AUTHORITY",

    "DELEGATED_AUTHORITY",

    "EMERGENCY_AUTHORITY",

  ],

  authorizedTriggers: [

    "SCHEDULED_ROTATION",

    "POLICY_REQUIRED_ROTATION",

    "KEY_COMPROMISE",

    "SUSPECTED_COMPROMISE",

    "REGULATORY_REQUIREMENT",

    "EMERGENCY_ROTATION",

  ],

  requiredEvidence: [

    "ROTATION_REQUEST",

    "ROTATION_AUTHORIZATION",

    "ROTATION_EXECUTION_EVIDENCE",

    "ROTATION_VERIFICATION_EVIDENCE",

  ],

  requiredAuditActivities: [

    "AUTHORIZE_ROTATION",

    "RECORD_ROTATION",

    "VERIFY_ROTATION",

    "AUDIT_ROTATION",

  ],

  requiredRecoveryConstraints: [

    "RECOVERY_REQUIRED",

    "RECOVERY_EVIDENCE_REQUIRED",

  ],

};


// ============================================================
// POLICY ACCESS
// ============================================================

export function resolveKeyRotationGovernancePolicy():
  KeyRotationGovernancePolicy {

  return KEY_ROTATION_GOVERNANCE_POLICY;

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Key Rotation is governed
// before it is executed.
//
// Governance determines:
//
// Who may authorize rotation.
//
// Why rotation may occur.
//
// What evidence is required.
//
// What audit records are required.
//
// Whether recovery must exist.
//
// Governance does not determine:
//
// How rotation is executed.
//
// How recovery works.
//
// ============================================================


// ============================================================
// P9F.1.1 PRINCIPLE
// ============================================================
//
// Governance
// ≠
// Mechanism
//
// Governance
// ≠
// Infrastructure
//
// Rotation Authorized
// ≠
// Rotation Executed
//
// Rotation Executed
// ≠
// Rotation Verified
//
// Recovery Required
// ≠
// Recovery Implemented
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT define:
//
// AES
// RSA
// ECC
// Key Wrapping
// Key Unwrapping
// Envelope Encryption
//
// KMS APIs
// Vault APIs
// Cloud Providers
// Storage Providers
//
// Rollback Implementation
// Key History Implementation
// Snapshot Implementation
// Restore Implementation
//
// These belong to:
//
// Mechanism Family
//
// Infrastructure Family
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ define rotation authority
//
// ✓ define rotation triggers
//
// ✓ define evidence requirements
//
// ✓ define audit requirements
//
// ✓ define recovery requirements
//
// ✗ rotate keys
//
// ✗ execute cryptography
//
// ✗ interact with KMS
//
// ✗ interact with Vault
//
// ✗ interact with Infrastructure
//
// ✗ define recovery implementation
//
// ============================================================