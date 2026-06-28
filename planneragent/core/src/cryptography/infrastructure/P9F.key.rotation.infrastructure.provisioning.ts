// ============================================================
// PlannerAgent — Key Rotation Infrastructure Provisioning
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// P9F.key.rotation.infrastructure.provisioning.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Infrastructure Provisioning
//
// DOMAIN
// ------------------------------------------------------------
// P9F.3.2 — Key Rotation Infrastructure Provisioning
//
// PURPOSE
// ------------------------------------------------------------
// Validate key rotation infrastructure
// provisioning requests against
// Key Rotation Infrastructure Policy.
//
// Infrastructure Provisioning authorizes
// provisioning.
//
// Infrastructure Provisioning does not
// execute provisioning.
//
// This file does not:
//
// - authorize rotation
// - execute mechanisms
// - select providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
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
// Provisioning Authorized
// ≠
// Provisioning Executed
//
// ============================================================

import {
  ApprovedEncryptedStorage,
  ApprovedKeyRotationInfrastructure,
  ApprovedRecoveryCapability,
  resolveKeyRotationInfrastructurePolicy,
} from "./P9F.key.rotation.infrastructure.policy";


// ============================================================
// PROVISIONING RESOURCE
// ============================================================

export type KeyRotationProvisioningResource =
  | "KEY_ROTATION_INFRASTRUCTURE"
  | "ENCRYPTED_STORAGE"
  | "RECOVERY_CAPABILITY";


// ============================================================
// PROVISIONING CLASS
// ============================================================

export type KeyRotationProvisioningClass =
  | ApprovedKeyRotationInfrastructure
  | ApprovedEncryptedStorage
  | ApprovedRecoveryCapability;


// ============================================================
// PROVISIONING STATUS
// ============================================================

export type KeyRotationProvisioningStatus =
  | "PROVISIONING_AUTHORIZED"
  | "PROVISIONING_DENIED";


// ============================================================
// DENIAL REASON
// ============================================================

export type KeyRotationProvisioningDenialReason =
  | "INFRASTRUCTURE_CLASS_NOT_APPROVED"
  | "INFRASTRUCTURE_CLASS_RESOURCE_MISMATCH";


// ============================================================
// REQUEST
// ============================================================

export interface KeyRotationInfrastructureProvisioningRequest {

  resource:
    KeyRotationProvisioningResource;

  infrastructureClass:
    KeyRotationProvisioningClass;

}


// ============================================================
// RESULT
// ============================================================

export interface KeyRotationInfrastructureProvisioningResult {

  provisioningStatus:
    KeyRotationProvisioningStatus;

  provisioningAuthorized:
    boolean;

  resource:
    KeyRotationProvisioningResource;

  infrastructureClass:
    KeyRotationProvisioningClass;

  policyValidated:
    boolean;

  resourceCompatible:
    boolean;

  denialReason?:
    KeyRotationProvisioningDenialReason;

  summary:
    string[];

}


// ============================================================
// RESOURCE CLASS RESOLUTION
// ============================================================

function resolveApprovedClassesForResource(
  resource: KeyRotationProvisioningResource
): KeyRotationProvisioningClass[] {

  const policy =
    resolveKeyRotationInfrastructurePolicy();

  if (resource === "KEY_ROTATION_INFRASTRUCTURE") {

    return policy.approvedInfrastructure;

  }

  if (resource === "ENCRYPTED_STORAGE") {

    return policy.approvedEncryptedStorage;

  }

  return policy.approvedRecoveryCapabilities;

}


// ============================================================
// PROVISIONING VALIDATION
// ============================================================

export function authorizeKeyRotationInfrastructureProvisioning(
  request: KeyRotationInfrastructureProvisioningRequest
): KeyRotationInfrastructureProvisioningResult {

  const policy =
    resolveKeyRotationInfrastructurePolicy();

  const approvedClasses: KeyRotationProvisioningClass[] = [

    ...policy.approvedInfrastructure,

    ...policy.approvedEncryptedStorage,

    ...policy.approvedRecoveryCapabilities,

  ];

  const approvedClassesForResource =
    resolveApprovedClassesForResource(
      request.resource
    );

  const policyValidated =
    approvedClasses.includes(
      request.infrastructureClass
    );

  if (!policyValidated) {

    return {

      provisioningStatus:
        "PROVISIONING_DENIED",

      provisioningAuthorized:
        false,

      resource:
        request.resource,

      infrastructureClass:
        request.infrastructureClass,

      policyValidated:
        false,

      resourceCompatible:
        false,

      denialReason:
        "INFRASTRUCTURE_CLASS_NOT_APPROVED",

      summary: [
        "infrastructure_class_not_approved",
        "provisioning_denied",
      ],

    };

  }

  const resourceCompatible =
    approvedClassesForResource.includes(
      request.infrastructureClass
    );

  if (!resourceCompatible) {

    return {

      provisioningStatus:
        "PROVISIONING_DENIED",

      provisioningAuthorized:
        false,

      resource:
        request.resource,

      infrastructureClass:
        request.infrastructureClass,

      policyValidated:
        true,

      resourceCompatible:
        false,

      denialReason:
        "INFRASTRUCTURE_CLASS_RESOURCE_MISMATCH",

      summary: [
        "infrastructure_class_approved",
        "resource_class_mismatch",
        "provisioning_denied",
      ],

    };

  }

  return {

    provisioningStatus:
      "PROVISIONING_AUTHORIZED",

    provisioningAuthorized:
      true,

    resource:
      request.resource,

    infrastructureClass:
      request.infrastructureClass,

    policyValidated:
      true,

    resourceCompatible:
      true,

    summary: [
      "infrastructure_class_approved",
      "resource_class_compatible",
      "provisioning_authorized",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Infrastructure Provisioning validates
// provisioning requests against approved
// infrastructure capabilities.
//
// Provisioning validates both:
//
// - whether the infrastructure class
//   is approved by policy
//
// - whether the infrastructure class
//   is compatible with the requested
//   provisioning resource
//
// Approved Class
// ≠
// Compatible Class
//
// Provisioning does not select providers.
//
// Provisioning does not call providers.
//
// Provisioning does not create real
// infrastructure.
//
// Provisioning identity and execution
// belong to future implementation layers.
//
// ============================================================


// ============================================================
// P9F.3.2 PRINCIPLE
// ============================================================
//
// Infrastructure Policy
// ≠
// Infrastructure Provisioning
//
// Provisioning Authorized
// ≠
// Provisioning Executed
//
// Approved Infrastructure Class
// ≠
// Resource-Compatible Infrastructure Class
//
// Provisioning
// ≠
// Access Control
//
// Provisioning
// ≠
// Usage
//
// Provisioning
// ≠
// Recovery
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
// This file MUST NOT:
//
// - authorize rotation
// - execute mechanisms
// - select providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - create infrastructure
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
// ✓ validate provisioning requests
//
// ✓ validate approved infrastructure classes
//
// ✓ validate resource/class compatibility
//
// ✓ authorize provisioning boundary
//
// ✓ deny unapproved infrastructure classes
//
// ✓ deny resource/class mismatches
//
// ✗ execute provisioning
//
// ✗ select providers
//
// ✗ call provider APIs
//
// ✗ access infrastructure
//
// ✗ use infrastructure
//
// ✗ perform recovery
//
// ============================================================