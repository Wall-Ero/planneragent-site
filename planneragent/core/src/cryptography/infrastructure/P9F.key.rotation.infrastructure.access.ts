// ============================================================
// PlannerAgent — Key Rotation Infrastructure Access Control
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// P9F.key.rotation.infrastructure.access.ts
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
// P9F.3.3 — Key Rotation Infrastructure Access Control
//
// PURPOSE
// ------------------------------------------------------------
// Validate whether authorized key
// rotation infrastructure provisioning
// may access infrastructure.
//
// Infrastructure Access Control controls.
//
// Infrastructure Access Control does not
// provision infrastructure.
//
// Infrastructure Access Control does not
// use infrastructure.
//
// This file answers one question:
//
// Can this authorized provisioning
// access infrastructure?
//
// This file does not:
//
// - authorize rotation
// - execute mechanisms
// - create infrastructure
// - provision infrastructure
// - call providers
// - call KMS APIs
// - call Vault APIs
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
// Infrastructure Access Granted
//
// Infrastructure Access Granted
// ≠
// Infrastructure Used
//
// ============================================================

import {
  KeyRotationInfrastructureProvisioningResult,
} from "./P9F.key.rotation.infrastructure.provisioning";


// ============================================================
// ACCESS DECISION
// ============================================================

export type InfrastructureAccessDecision =
  | "ALLOW_ACCESS"
  | "DENY_ACCESS";


// ============================================================
// ACCESS STATUS
// ============================================================

export type InfrastructureAccessStatus =
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED";


// ============================================================
// ACCESS DENIAL REASON
// ============================================================

export type InfrastructureAccessDenialReason =
  | "PROVISIONING_NOT_AUTHORIZED"
  | "ACCESS_NOT_ALLOWED";


// ============================================================
// ACCESS REQUEST
// ============================================================

export interface KeyRotationInfrastructureAccessRequest {

  provisioning:
    KeyRotationInfrastructureProvisioningResult;

  accessDecision:
    InfrastructureAccessDecision;

}


// ============================================================
// ACCESS RESULT
// ============================================================

export interface KeyRotationInfrastructureAccessResult {

  accessStatus:
    InfrastructureAccessStatus;

  accessGranted:
    boolean;

  accessDecision:
    InfrastructureAccessDecision;

  provisioningAuthorized:
    boolean;

  policyValidated:
    KeyRotationInfrastructureProvisioningResult["policyValidated"];

  resourceCompatible:
    KeyRotationInfrastructureProvisioningResult["resourceCompatible"];

  resource:
    KeyRotationInfrastructureProvisioningResult["resource"];

  infrastructureClass:
    KeyRotationInfrastructureProvisioningResult["infrastructureClass"];

  denialReason?:
    InfrastructureAccessDenialReason;

  provisioningSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// ACCESS CONTROL
// ============================================================

export function authorizeKeyRotationInfrastructureAccess(
  request: KeyRotationInfrastructureAccessRequest
): KeyRotationInfrastructureAccessResult {

  const provisioning =
    request.provisioning;

  if (!provisioning.provisioningAuthorized) {

    return {

      accessStatus:
        "ACCESS_DENIED",

      accessGranted:
        false,

      accessDecision:
        request.accessDecision,

      provisioningAuthorized:
        false,

      policyValidated:
        provisioning.policyValidated,

      resourceCompatible:
        provisioning.resourceCompatible,

      resource:
        provisioning.resource,

      infrastructureClass:
        provisioning.infrastructureClass,

      denialReason:
        "PROVISIONING_NOT_AUTHORIZED",

      provisioningSummary: [
        ...provisioning.summary,
      ],

      summary: [
        ...provisioning.summary,
        "provisioning_not_authorized",
        "access_denied",
      ],

    };

  }

  if (request.accessDecision === "DENY_ACCESS") {

    return {

      accessStatus:
        "ACCESS_DENIED",

      accessGranted:
        false,

      accessDecision:
        request.accessDecision,

      provisioningAuthorized:
        true,

      policyValidated:
        provisioning.policyValidated,

      resourceCompatible:
        provisioning.resourceCompatible,

      resource:
        provisioning.resource,

      infrastructureClass:
        provisioning.infrastructureClass,

      denialReason:
        "ACCESS_NOT_ALLOWED",

      provisioningSummary: [
        ...provisioning.summary,
      ],

      summary: [
        ...provisioning.summary,
        "access_not_allowed",
        "access_denied",
      ],

    };

  }

  return {

    accessStatus:
      "ACCESS_GRANTED",

    accessGranted:
      true,

    accessDecision:
      request.accessDecision,

    provisioningAuthorized:
      true,

    policyValidated:
      provisioning.policyValidated,

    resourceCompatible:
      provisioning.resourceCompatible,

    resource:
      provisioning.resource,

    infrastructureClass:
      provisioning.infrastructureClass,

    provisioningSummary: [
      ...provisioning.summary,
    ],

    summary: [
      ...provisioning.summary,
      "access_granted",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Infrastructure Access Control receives
// provisioning results.
//
// It does not re-run provisioning.
//
// It does not validate infrastructure
// policy again.
//
// It preserves provisioning validation
// outcomes:
//
// - policyValidated
// - resourceCompatible
//
// It applies a deterministic access
// decision:
//
// ALLOW_ACCESS
// or
// DENY_ACCESS
//
// Access Control does not use
// infrastructure.
//
// Access Control does not call providers.
//
// ============================================================


// ============================================================
// P9F.3.3 PRINCIPLE
// ============================================================
//
// Infrastructure Policy
// ≠
// Infrastructure Provisioning
//
// Infrastructure Provisioning
// ≠
// Infrastructure Access Control
//
// Provisioning Authorized
// ≠
// Infrastructure Access Granted
//
// Infrastructure Access Granted
// ≠
// Infrastructure Used
//
// Boolean Permission
// ≠
// Deterministic Access Decision
//
// Access Control
// ≠
// Usage
//
// Access Control
// ≠
// Recovery
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
// - create infrastructure
// - provision infrastructure
// - select providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
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
// ✓ receive provisioning result
//
// ✓ verify provisioning authorization
//
// ✓ preserve policy validation result
//
// ✓ preserve resource compatibility result
//
// ✓ apply deterministic access decision
//
// ✓ grant access boundary
//
// ✓ deny access when provisioning
//   is not authorized
//
// ✓ deny access when access
//   decision denies access
//
// ✓ preserve provisioning summary
//
// ✗ authorize rotation
//
// ✗ execute mechanisms
//
// ✗ re-run provisioning
//
// ✗ call providers
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