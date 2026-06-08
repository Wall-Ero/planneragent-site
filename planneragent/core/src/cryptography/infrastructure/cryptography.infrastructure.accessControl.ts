// ============================================================
// PlannerAgent — Infrastructure Access Control
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// cryptography.infrastructure.accessControl.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Infrastructure Access Control
//
// DOMAIN
// ------------------------------------------------------------
// P9C.7.3 — Infrastructure Access Control
//
// PURPOSE
// ------------------------------------------------------------
// Control access to approved infrastructure
// resources.
//
// Infrastructure Access Control controls.
//
// Infrastructure Access Control never defines.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Infrastructure Policy defines.
//
// Infrastructure Provisioning provisions.
//
// Infrastructure Access Control controls.
//
// Infrastructure Access Control may grant
// or deny access.
//
// Infrastructure Access Control may never
// define infrastructure resources.
//
// DOES
// ------------------------------------------------------------
//
// ✓ validate access control mechanism
//
// ✓ validate infrastructure resource access
//
// ✓ grant approved access
//
// ✓ deny unapproved access
//
// ✓ validate access requests
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ define policy
//
// ✗ provision infrastructure
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
// ✗ perform recovery
//
// ✗ select vendors
//
// ✗ enforce access
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Validate infrastructure access requests
// against approved access control mechanisms.
//
// P9C.7.3 currently implements
// the access authorization boundary.
//
// Real access enforcement remains deferred
// to future implementation layers.
//
// Nothing else.
//
// ============================================================

import {
  ApprovedAccessControl,
  getInfrastructurePolicy,
} from "./cryptography.infrastructure.policy";


// ============================================================
// INFRASTRUCTURE RESOURCE
// ============================================================

export type InfrastructureResource =
  | "KMS"
  | "VAULT"
  | "STORAGE"
  | "RECOVERY";


// ============================================================
// ACCESS REQUEST
// ============================================================

export interface InfrastructureAccessRequest {

  accessControl:
    ApprovedAccessControl;

  requestedResource:
    InfrastructureResource;

}


// ============================================================
// DENIAL REASON
// ============================================================

export type InfrastructureAccessDenialReason =
  | "ACCESS_CONTROL_NOT_APPROVED";


// ============================================================
// RESULT
// ============================================================

export interface InfrastructureAccessResult {

  accessAllowed:
    boolean;

  accessControlValidated:
    boolean;

  denialReason?:
    InfrastructureAccessDenialReason;

  summary:
    string[];

}


// ============================================================
// ACCESS CONTROL VALIDATION
// ============================================================

export function validateInfrastructureAccess(
  request: InfrastructureAccessRequest
): InfrastructureAccessResult {

  const policy =
    getInfrastructurePolicy();

  const approvedAccessControls =
    policy.approvedAccessControls;

  const accessControlValidated =
    approvedAccessControls.includes(
      request.accessControl
    );

  if (!accessControlValidated) {

    return {

      accessAllowed:
        false,

      accessControlValidated:
        false,

      denialReason:
        "ACCESS_CONTROL_NOT_APPROVED",

      summary: [
        "access_control_not_approved",
        "access_denied",
      ],

    };

  }

  return {

    accessAllowed:
      true,

    accessControlValidated:
      true,

    summary: [
      "access_control_validated",
      "access_allowed",
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
// Infrastructure Access Control controls.
//
// Usage uses.
//
// Recovery recovers.
//
// Infrastructure Access Control currently
// implements the access authorization
// boundary.
//
// Access Authorized
// ≠
// Access Enforced
//
// Real access enforcement remains deferred
// to future implementation layers.
//
// Infrastructure Access Control operates on:
//
// KMS
// VAULT
// STORAGE
// RECOVERY
//
// and may not introduce additional
// infrastructure resources without
// prior assessment and policy approval.
//
// ============================================================