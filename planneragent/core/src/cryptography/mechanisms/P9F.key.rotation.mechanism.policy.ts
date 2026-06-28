// ============================================================
// PlannerAgent — Key Rotation Mechanism Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/mechanisms/
// P9F.key.rotation.mechanism.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Mechanism Policy
//
// DOMAIN
// ------------------------------------------------------------
// P9F.2.1 — Key Rotation Mechanism Policy
//
// PURPOSE
// ------------------------------------------------------------
// Define approved cryptographic
// mechanisms for key rotation.
//
// Mechanism Policy defines.
//
// Mechanism Policy does not authorize
// rotation.
//
// Mechanism Policy does not execute
// rotation.
//
// This file does not:
//
// - authorize rotation
// - execute rotation
// - call KMS APIs
// - call Vault APIs
// - store keys
// - write evidence
// - write ledger records
// - perform audits
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance authorizes rotation.
//
// Mechanism Policy defines approved
// cryptographic rotation methods.
//
// Execution performs approved
// mechanisms.
//
// Verification verifies cryptographic
// results.
//
// ============================================================


// ============================================================
// APPROVED KEY ROTATION MECHANISM
// ============================================================

export type ApprovedKeyRotationMechanism =
  | "KEY_REWRAP"
  | "KEY_REENCRYPTION"
  | "KEY_VERSION_ADVANCE";


// ============================================================
// APPROVED KEY WRAPPING OPERATION
// ============================================================

export type ApprovedKeyWrappingOperation =
  | "WRAP_KEY"
  | "UNWRAP_KEY"
  | "REWRAP_KEY";


// ============================================================
// APPROVED ROTATION VERIFICATION REQUIREMENT
// ============================================================

export type ApprovedRotationVerificationRequirement =
  | "OLD_KEY_DISABLED"
  | "NEW_KEY_ACTIVE"
  | "PAYLOAD_DECRYPTION_VERIFIED"
  | "ROTATION_RESULT_VERIFIED";


// ============================================================
// POLICY
// ============================================================

export interface KeyRotationMechanismPolicy {

  approvedRotationMechanisms:
    ApprovedKeyRotationMechanism[];

  approvedKeyWrappingOperations:
    ApprovedKeyWrappingOperation[];

  approvedVerificationRequirements:
    ApprovedRotationVerificationRequirement[];

}


// ============================================================
// CANONICAL POLICY
// ============================================================

export const KEY_ROTATION_MECHANISM_POLICY:
  KeyRotationMechanismPolicy = {

  approvedRotationMechanisms: [

    "KEY_REWRAP",

    "KEY_REENCRYPTION",

    "KEY_VERSION_ADVANCE",

  ],

  approvedKeyWrappingOperations: [

    "WRAP_KEY",

    "UNWRAP_KEY",

    "REWRAP_KEY",

  ],

  approvedVerificationRequirements: [

    "OLD_KEY_DISABLED",

    "NEW_KEY_ACTIVE",

    "PAYLOAD_DECRYPTION_VERIFIED",

    "ROTATION_RESULT_VERIFIED",

  ],

};


// ============================================================
// POLICY ACCESS
// ============================================================

export function resolveKeyRotationMechanismPolicy():
  KeyRotationMechanismPolicy {

  return KEY_ROTATION_MECHANISM_POLICY;

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Key Rotation Mechanism Policy defines
// how key rotation may be cryptographically
// performed.
//
// It does not decide whether rotation is
// authorized.
//
// It does not execute rotation.
//
// It does not interact with infrastructure.
//
// ============================================================


// ============================================================
// P9F.2.1 PRINCIPLE
// ============================================================
//
// Governance
// ≠
// Mechanism
//
// Mechanism
// ≠
// Infrastructure
//
// Rotation Authorized
// ≠
// Rotation Executed
//
// Mechanism Approved
// ≠
// Mechanism Executed
//
// Mechanism Executed
// ≠
// Mechanism Verified
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT define:
//
// Rotation Authority
// Rotation Triggers
// Governance Evidence
// Governance Ledger
// Governance Audit
//
// KMS APIs
// Vault APIs
// Cloud Providers
// Storage Providers
//
// This file MUST NOT:
//
// - authorize rotation
// - execute rotation
// - call KMS
// - call Vault
// - persist keys
// - generate evidence
// - write ledger records
// - perform audits
//
// These belong to:
//
// Governance Family
// Infrastructure Family
// Evidence Layer
// Ledger Layer
// Audit Layer
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ define approved key rotation mechanisms
//
// ✓ define approved key wrapping operations
//
// ✓ define approved verification requirements
//
// ✗ authorize rotation
//
// ✗ execute rotation
//
// ✗ interact with KMS
//
// ✗ interact with Vault
//
// ✗ store keys
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================