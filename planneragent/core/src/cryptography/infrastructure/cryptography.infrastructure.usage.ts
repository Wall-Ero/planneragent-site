// ============================================================
// PlannerAgent — Infrastructure Usage
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// cryptography.infrastructure.usage.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Infrastructure Usage
//
// DOMAIN
// ------------------------------------------------------------
// P9C.7.4 — Infrastructure Usage
//
// PURPOSE
// ------------------------------------------------------------
// Use approved and authorized
// infrastructure resources.
//
// Infrastructure Usage uses.
//
// Infrastructure Usage never defines.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Infrastructure Policy defines.
//
// Infrastructure Provisioning provisions.
//
// Infrastructure Access Control controls.
//
// Infrastructure Usage uses.
//
// Infrastructure Recovery recovers.
//
// Infrastructure Usage may use approved
// and authorized infrastructure resources.
//
// Infrastructure Usage may never define,
// provision, authorize, or recover.
//
// DOES
// ------------------------------------------------------------
//
// ✓ use approved infrastructure resources
//
// ✓ use authorized infrastructure resources
//
// ✓ request infrastructure operations
//
// ✓ validate usage requests
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ define policy
//
// ✗ provision infrastructure
//
// ✗ authorize access
//
// ✗ perform recovery
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
// Validate infrastructure usage requests
// against approved and authorized
// infrastructure resources.
//
// P9C.7.4 currently implements
// the infrastructure usage boundary.
//
// Real infrastructure operations remain
// deferred to future implementation layers.
//
// Nothing else.
//
// ============================================================

import {
  InfrastructureResource,
} from "./cryptography.infrastructure.accessControl";


// ============================================================
// USAGE OPERATION
// ============================================================

export type InfrastructureUsageOperation =
  | "USE_KMS"
  | "USE_VAULT"
  | "USE_STORAGE"
  | "USE_RECOVERY";


// ============================================================
// REQUEST
// ============================================================

export interface InfrastructureUsageRequest {

  resource:
    InfrastructureResource;

  operation:
    InfrastructureUsageOperation;

  accessAuthorized:
    boolean;

}


// ============================================================
// DENIAL REASON
// ============================================================

export type InfrastructureUsageDenialReason =
  | "ACCESS_NOT_AUTHORIZED";


// ============================================================
// RESULT
// ============================================================

export interface InfrastructureUsageResult {

  usageAllowed:
    boolean;

  usageValidated:
    boolean;

  denialReason?:
    InfrastructureUsageDenialReason;

  summary:
    string[];

}


// ============================================================
// USAGE VALIDATION
// ============================================================

export function validateInfrastructureUsage(
  request: InfrastructureUsageRequest
): InfrastructureUsageResult {

  if (!request.accessAuthorized) {

    return {

      usageAllowed:
        false,

      usageValidated:
        false,

      denialReason:
        "ACCESS_NOT_AUTHORIZED",

      summary: [
        "access_not_authorized",
        "usage_denied",
      ],

    };

  }

  return {

    usageAllowed:
      true,

    usageValidated:
      true,

    summary: [
      "usage_validated",
      "usage_allowed",
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
// Infrastructure Usage uses.
//
// Infrastructure Recovery recovers.
//
// Infrastructure Usage currently
// implements the infrastructure usage
// boundary.
//
// Usage Authorized
// ≠
// Usage Executed
//
// Real infrastructure operations remain
// deferred to future implementation layers.
//
// Infrastructure Usage operates on:
//
// KMS
// VAULT
// STORAGE
// RECOVERY
//
// Infrastructure Usage may never:
//
// - define policy
// - provision infrastructure
// - authorize access
// - perform recovery
//
// ============================================================