// ============================================================
// PlannerAgent — Infrastructure Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// cryptography.infrastructure.policy.ts
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
// P9C.7.1 — Infrastructure Policy
//
// PURPOSE
// ------------------------------------------------------------
// Define approved infrastructure component
// classes and infrastructure constraints.
//
// Infrastructure Policy defines.
//
// Infrastructure Policy never provisions.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Infrastructure Policy defines approved
// infrastructure classes.
//
// Infrastructure Policy does not select
// specific vendors.
//
// Vendor selection belongs to future
// provisioning layers.
//
// DOES
// ------------------------------------------------------------
//
// ✓ define approved KMS classes
//
// ✓ define approved vault classes
//
// ✓ define approved storage classes
//
// ✓ define approved access control mechanisms
//
// ✓ define approved recovery mechanisms
//
// ✓ define infrastructure constraints
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ provision infrastructure
//
// ✗ access KMS
//
// ✗ access Vault
//
// ✗ store secrets
//
// ✗ restore backups
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
// ✗ select vendors
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define which infrastructure component
// classes are approved for use.
//
// Nothing else.
//
// ============================================================


// ============================================================
// EVOLUTION RULE
// ============================================================
//
// Additional infrastructure classes may be
// introduced only when supported by observed
// architectural requirements.
//
// Potential future classes are not
// architectural requirements.
//
// Assessment precedes class creation.
//
// ============================================================


// ============================================================
// APPROVED KMS CLASSES
// ============================================================

export type ApprovedKmsProviderClass =
  | "MANAGED_KMS";


// ============================================================
// APPROVED VAULT CLASSES
// ============================================================

export type ApprovedVaultProviderClass =
  | "SECRET_VAULT";


// ============================================================
// APPROVED STORAGE CLASSES
// ============================================================

export type ApprovedStorageClass =
  | "ENCRYPTED_STORAGE";


// ============================================================
// APPROVED ACCESS CONTROLS
// ============================================================

export type ApprovedAccessControl =
  | "ROLE_BASED_ACCESS_CONTROL";


// ============================================================
// APPROVED RECOVERY MECHANISMS
// ============================================================

export type ApprovedRecoveryMechanism =
  | "BACKUP_RESTORE";


// ============================================================
// INFRASTRUCTURE POLICY
// ============================================================

export interface InfrastructurePolicy {

  approvedKmsProviderClasses:
    ApprovedKmsProviderClass[];

  approvedVaultProviderClasses:
    ApprovedVaultProviderClass[];

  approvedStorageClasses:
    ApprovedStorageClass[];

  approvedAccessControls:
    ApprovedAccessControl[];

  approvedRecoveryMechanisms:
    ApprovedRecoveryMechanism[];

  summary:
    string[];

}


// ============================================================
// CANONICAL INFRASTRUCTURE POLICY
// ============================================================

export const CANONICAL_INFRASTRUCTURE_POLICY:
  InfrastructurePolicy = {

  approvedKmsProviderClasses: [
    "MANAGED_KMS",
  ],

  approvedVaultProviderClasses: [
    "SECRET_VAULT",
  ],

  approvedStorageClasses: [
    "ENCRYPTED_STORAGE",
  ],

  approvedAccessControls: [
    "ROLE_BASED_ACCESS_CONTROL",
  ],

  approvedRecoveryMechanisms: [
    "BACKUP_RESTORE",
  ],

  summary: [
    "infrastructure_policy",
    "approved_component_classes_defined",
  ],

};


// ============================================================
// POLICY RESOLUTION
// ============================================================

export function getInfrastructurePolicy():
  InfrastructurePolicy {

  return CANONICAL_INFRASTRUCTURE_POLICY;

}


// ============================================================
// PLANNERAGENT INFRASTRUCTURE PRINCIPLE
// ============================================================
//
// Infrastructure Policy defines.
//
// Provisioning provisions.
//
// Access Control controls.
//
// Usage uses.
//
// Recovery recovers.
//
// Infrastructure Policy may approve
// infrastructure classes.
//
// Infrastructure Policy may never provision
// infrastructure.
//
// Vendor mapping belongs to future
// provisioning layers.
//
// Example:
//
// MANAGED_KMS
// ↓
// AWS_KMS
//
// MANAGED_KMS
// ↓
// AZURE_KEY_VAULT
//
// MANAGED_KMS
// ↓
// GCP_KMS
//
// SECRET_VAULT
// ↓
// HASHICORP_VAULT
//
// ============================================================