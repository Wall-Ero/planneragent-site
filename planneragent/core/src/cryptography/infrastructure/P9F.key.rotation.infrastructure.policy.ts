// ============================================================
// PlannerAgent — Key Rotation Infrastructure Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// P9F.key.rotation.infrastructure.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Infrastructure Policy
//
// DOMAIN
// ------------------------------------------------------------
// P9F.3.1 — Key Rotation Infrastructure Policy
//
// PURPOSE
// ------------------------------------------------------------
// Define approved infrastructure
// capabilities for key rotation.
//
// Infrastructure Policy defines.
//
// Infrastructure Policy does not
// provision infrastructure.
//
// Infrastructure Policy does not
// access infrastructure.
//
// Infrastructure Policy does not
// use infrastructure.
//
// Infrastructure Policy does not
// perform recovery.
//
// This file does not:
//
// - authorize rotation
// - execute mechanisms
// - call providers
// - provision infrastructure
// - access infrastructure
// - use infrastructure
// - perform recovery
// - generate evidence
// - write ledger records
// - perform audits
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance authorizes.
//
// Mechanism executes.
//
// Infrastructure provides approved
// execution environment.
//
// ============================================================


// ============================================================
// APPROVED KEY ROTATION INFRASTRUCTURE
// ============================================================

export type ApprovedKeyRotationInfrastructure =
  | "MANAGED_KMS"
  | "HSM"
  | "SECRET_VAULT";


// ============================================================
// APPROVED ENCRYPTED STORAGE
// ============================================================

export type ApprovedEncryptedStorage =
  | "DATABASE"
  | "OBJECT_STORAGE"
  | "BACKUP_STORAGE";


// ============================================================
// APPROVED RECOVERY CAPABILITY
// ============================================================

export type ApprovedRecoveryCapability =
  | "KEY_RECOVERY"
  | "KEY_BACKUP"
  | "KEY_RESTORE";


// ============================================================
// POLICY
// ============================================================

export interface KeyRotationInfrastructurePolicy {

  approvedInfrastructure:
    ApprovedKeyRotationInfrastructure[];

  approvedEncryptedStorage:
    ApprovedEncryptedStorage[];

  approvedRecoveryCapabilities:
    ApprovedRecoveryCapability[];

}


// ============================================================
// CANONICAL POLICY
// ============================================================

export const KEY_ROTATION_INFRASTRUCTURE_POLICY:
  KeyRotationInfrastructurePolicy = {

  approvedInfrastructure: [

    "MANAGED_KMS",

    "HSM",

    "SECRET_VAULT",

  ],

  approvedEncryptedStorage: [

    "DATABASE",

    "OBJECT_STORAGE",

    "BACKUP_STORAGE",

  ],

  approvedRecoveryCapabilities: [

    "KEY_RECOVERY",

    "KEY_BACKUP",

    "KEY_RESTORE",

  ],

};


// ============================================================
// POLICY ACCESS
// ============================================================

export function resolveKeyRotationInfrastructurePolicy():
  KeyRotationInfrastructurePolicy {

  return KEY_ROTATION_INFRASTRUCTURE_POLICY;

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Key Rotation Infrastructure Policy
// defines approved infrastructure
// capabilities for key rotation.
//
// It does not select providers.
//
// It does not provision infrastructure.
//
// It does not access infrastructure.
//
// It does not execute mechanisms.
//
// It does not authorize governance.
//
// ============================================================


// ============================================================
// P9F.3.1 PRINCIPLE
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
// Infrastructure Policy
// ≠
// Infrastructure Provisioning
//
// Infrastructure Provisioning
// ≠
// Infrastructure Access Control
//
// Infrastructure Usage
// ≠
// Infrastructure Recovery
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT define:
//
// AWS_KMS
// GCP_KMS
// AZURE_KEY_VAULT
// HASHICORP_VAULT
// Cloud Provider APIs
// Provider Credentials
// Provider Regions
//
// Provider mapping belongs to future
// provisioning or provider mapping layers.
//
// This file MUST NOT:
//
// - authorize rotation
// - execute mechanisms
// - call KMS APIs
// - call Vault APIs
// - provision infrastructure
// - access infrastructure
// - use infrastructure
// - perform recovery
// - generate evidence
// - write ledger records
// - perform audits
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ define approved key rotation infrastructure
//
// ✓ define approved encrypted storage classes
//
// ✓ define approved recovery capabilities
//
// ✗ authorize rotation
//
// ✗ execute mechanisms
//
// ✗ call providers
//
// ✗ provision infrastructure
//
// ✗ access infrastructure
//
// ✗ use infrastructure
//
// ✗ recover
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================