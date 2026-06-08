// ============================================================
// PlannerAgent — Infrastructure Provisioning
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// cryptography.infrastructure.provisioning.ts
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
// P9C.7.2 — Infrastructure Provisioning
//
// PURPOSE
// ------------------------------------------------------------
// Provision approved infrastructure classes.
//
// Infrastructure Provisioning provisions.
//
// Infrastructure Provisioning never defines.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Infrastructure Policy defines.
//
// Infrastructure Provisioning provisions.
//
// Infrastructure Provisioning may provision
// approved infrastructure classes.
//
// Infrastructure Provisioning may never
// define infrastructure classes.
//
// DOES
// ------------------------------------------------------------
//
// ✓ provision approved KMS classes
//
// ✓ provision approved vault classes
//
// ✓ provision approved storage classes
//
// ✓ provision approved recovery mechanisms
//
// ✓ validate policy compliance
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ define policy
//
// ✗ access secrets
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
// ✗ perform access control
//
// ✗ perform recovery
//
// ✗ select vendors
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Validate infrastructure provisioning
// requests against Infrastructure Policy.
//
// P9C.7.2 currently implements
// the provisioning authorization boundary.
//
// Real provisioning remains deferred
// to future implementation layers.
//
// Nothing else.
//
// ============================================================

import {
  ApprovedKmsProviderClass,
  ApprovedRecoveryMechanism,
  ApprovedStorageClass,
  ApprovedVaultProviderClass,
  getInfrastructurePolicy,
} from "./cryptography.infrastructure.policy";


// ============================================================
// RESOURCE
// ============================================================

export type InfrastructureProvisioningResource =
  | "KMS"
  | "VAULT"
  | "STORAGE"
  | "RECOVERY";


// ============================================================
// REQUEST
// ============================================================

export interface InfrastructureProvisioningRequest {

  resource:
    InfrastructureProvisioningResource;

  infrastructureClass:
    | ApprovedKmsProviderClass
    | ApprovedVaultProviderClass
    | ApprovedStorageClass
    | ApprovedRecoveryMechanism;

}


// ============================================================
// DENIAL REASON
// ============================================================

export type InfrastructureProvisioningDenialReason =
  | "INFRASTRUCTURE_CLASS_NOT_APPROVED";


// ============================================================
// RESULT
// ============================================================

export interface InfrastructureProvisioningResult {

  provisioningAllowed:
    boolean;

  policyValidated:
    boolean;

  denialReason?:
    InfrastructureProvisioningDenialReason;

  summary:
    string[];

}


// ============================================================
// PROVISIONING VALIDATION
// ============================================================

export function validateInfrastructureProvisioning(
  request: InfrastructureProvisioningRequest
): InfrastructureProvisioningResult {

  const policy =
    getInfrastructurePolicy();

  const approvedClasses = [

    ...policy.approvedKmsProviderClasses,

    ...policy.approvedVaultProviderClasses,

    ...policy.approvedStorageClasses,

    ...policy.approvedRecoveryMechanisms,

  ];

  const policyValidated =
    approvedClasses.includes(
      request.infrastructureClass as never
    );

  if (!policyValidated) {

    return {

      provisioningAllowed:
        false,

      policyValidated:
        false,

      denialReason:
        "INFRASTRUCTURE_CLASS_NOT_APPROVED",

      summary: [
        "infrastructure_class_not_approved",
        "provisioning_denied",
      ],

    };

  }

  return {

    provisioningAllowed:
      true,

    policyValidated:
      true,

    summary: [
      "policy_validated",
      "provisioning_allowed",
    ],

  };

}


// ============================================================
// PLANNERAGENT INFRASTRUCTURE PRINCIPLE
// ============================================================
//
// Infrastructure Policy defines.
//
// Infrastructure Provisioning provisions.
//
// Access Control controls.
//
// Usage uses.
//
// Recovery recovers.
//
// Infrastructure Provisioning currently
// implements the provisioning authorization
// boundary.
//
// Provisioning Authorized
// ≠
// Provisioning Executed
//
// Real provisioning remains deferred
// to future implementation layers.
//
// Infrastructure Provisioning may validate
// provisioning requests against approved
// infrastructure classes.
//
// Infrastructure Provisioning may never
// define infrastructure classes.
//
// Access Control belongs to:
//
// P9C.7.3 Infrastructure Access Control
//
// Vendor selection belongs to future
// implementation layers.
//
// ============================================================