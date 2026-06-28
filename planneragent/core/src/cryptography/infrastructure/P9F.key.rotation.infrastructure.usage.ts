// ============================================================
// PlannerAgent — Key Rotation Infrastructure Usage
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// P9F.key.rotation.infrastructure.usage.ts
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
// P9F.3.4 — Key Rotation Infrastructure Usage
//
// PURPOSE
// ------------------------------------------------------------
// Validate whether granted key rotation
// infrastructure access may be used.
//
// Infrastructure Usage authorizes
// usage boundary.
//
// Infrastructure Usage does not execute
// provider operations.
//
// This file does not:
//
// - authorize rotation
// - execute mechanisms
// - provision infrastructure
// - grant access
// - call providers
// - call KMS APIs
// - call Vault APIs
// - execute provider operations
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
// Infrastructure Access Granted
// ≠
// Infrastructure Used
//
// Usage Authorized
// ≠
// Provider Operation Executed
//
// ============================================================

import {
  KeyRotationInfrastructureAccessResult,
} from "./P9F.key.rotation.infrastructure.access";


// ============================================================
// USAGE DECISION
// ============================================================

export type InfrastructureUsageDecision =
  | "ALLOW_USAGE"
  | "DENY_USAGE";


// ============================================================
// USAGE STATUS
// ============================================================

export type InfrastructureUsageStatus =
  | "USAGE_AUTHORIZED"
  | "USAGE_DENIED";


// ============================================================
// USAGE DENIAL REASON
// ============================================================

export type InfrastructureUsageDenialReason =
  | "ACCESS_NOT_GRANTED"
  | "USAGE_NOT_ALLOWED";


// ============================================================
// USAGE REQUEST
// ============================================================

export interface KeyRotationInfrastructureUsageRequest {

  access:
    KeyRotationInfrastructureAccessResult;

  usageDecision:
    InfrastructureUsageDecision;

}


// ============================================================
// USAGE RESULT
// ============================================================

export interface KeyRotationInfrastructureUsageResult {

  usageStatus:
    InfrastructureUsageStatus;

  usageAuthorized:
    boolean;

  usageDecision:
    InfrastructureUsageDecision;

  accessGranted:
    boolean;

  provisioningAuthorized:
    KeyRotationInfrastructureAccessResult["provisioningAuthorized"];

  policyValidated:
    KeyRotationInfrastructureAccessResult["policyValidated"];

  resourceCompatible:
    KeyRotationInfrastructureAccessResult["resourceCompatible"];

  resource:
    KeyRotationInfrastructureAccessResult["resource"];

  infrastructureClass:
    KeyRotationInfrastructureAccessResult["infrastructureClass"];

  denialReason?:
    InfrastructureUsageDenialReason;

  accessSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// USAGE AUTHORIZATION
// ============================================================

export function authorizeKeyRotationInfrastructureUsage(
  request: KeyRotationInfrastructureUsageRequest
): KeyRotationInfrastructureUsageResult {

  const access =
    request.access;

  if (!access.accessGranted) {

    return {

      usageStatus:
        "USAGE_DENIED",

      usageAuthorized:
        false,

      usageDecision:
        request.usageDecision,

      accessGranted:
        false,

      provisioningAuthorized:
        access.provisioningAuthorized,

      policyValidated:
        access.policyValidated,

      resourceCompatible:
        access.resourceCompatible,

      resource:
        access.resource,

      infrastructureClass:
        access.infrastructureClass,

      denialReason:
        "ACCESS_NOT_GRANTED",

      accessSummary: [
        ...access.summary,
      ],

      summary: [
        ...access.summary,
        "access_not_granted",
        "usage_denied",
      ],

    };

  }

  if (request.usageDecision === "DENY_USAGE") {

    return {

      usageStatus:
        "USAGE_DENIED",

      usageAuthorized:
        false,

      usageDecision:
        request.usageDecision,

      accessGranted:
        true,

      provisioningAuthorized:
        access.provisioningAuthorized,

      policyValidated:
        access.policyValidated,

      resourceCompatible:
        access.resourceCompatible,

      resource:
        access.resource,

      infrastructureClass:
        access.infrastructureClass,

      denialReason:
        "USAGE_NOT_ALLOWED",

      accessSummary: [
        ...access.summary,
      ],

      summary: [
        ...access.summary,
        "usage_not_allowed",
        "usage_denied",
      ],

    };

  }

  return {

    usageStatus:
      "USAGE_AUTHORIZED",

    usageAuthorized:
      true,

    usageDecision:
      request.usageDecision,

    accessGranted:
      true,

    provisioningAuthorized:
      access.provisioningAuthorized,

    policyValidated:
      access.policyValidated,

    resourceCompatible:
      access.resourceCompatible,

    resource:
      access.resource,

    infrastructureClass:
      access.infrastructureClass,

    accessSummary: [
      ...access.summary,
    ],

    summary: [
      ...access.summary,
      "usage_authorized",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Infrastructure Usage receives
// access control results.
//
// It does not re-run access control.
//
// It does not re-run provisioning.
//
// It does not validate infrastructure
// policy again.
//
// It preserves infrastructure context:
//
// - provisioningAuthorized
// - policyValidated
// - resourceCompatible
// - resource
// - infrastructureClass
//
// It authorizes a deterministic usage
// boundary.
//
// Usage does not execute provider
// operations.
//
// Usage does not call KMS or Vault.
//
// ============================================================


// ============================================================
// P9F.3.4 PRINCIPLE
// ============================================================
//
// Infrastructure Access Control
// ≠
// Infrastructure Usage
//
// Infrastructure Access Granted
// ≠
// Infrastructure Used
//
// Usage Authorized
// ≠
// Provider Operation Executed
//
// Usage
// ≠
// Recovery
//
// Usage
// ≠
// Provider Runtime
//
// Boolean Permission
// ≠
// Deterministic Usage Decision
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - authorize rotation
// - execute mechanisms
// - evaluate infrastructure policy
// - re-run provisioning validation
// - re-run access control
// - create infrastructure
// - provision infrastructure
// - select providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - execute provider operations
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
// ✓ receive access result
//
// ✓ verify access granted
//
// ✓ preserve provisioning authorization
//
// ✓ preserve policy validation result
//
// ✓ preserve resource compatibility result
//
// ✓ preserve infrastructure resource
//
// ✓ preserve infrastructure class
//
// ✓ apply deterministic usage decision
//
// ✓ authorize usage boundary
//
// ✓ deny usage when access
//   is not granted
//
// ✓ deny usage when usage
//   decision denies usage
//
// ✓ preserve access summary
//
// ✗ authorize rotation
//
// ✗ execute mechanisms
//
// ✗ re-run provisioning
//
// ✗ re-run access control
//
// ✗ call providers
//
// ✗ execute provider operations
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