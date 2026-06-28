// ============================================================
// PlannerAgent — Key Rotation Infrastructure Recovery
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// P9F.key.rotation.infrastructure.recovery.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Infrastructure Recovery
//
// DOMAIN
// ------------------------------------------------------------
// P9F.3.5 — Key Rotation Infrastructure Recovery
//
// PURPOSE
// ------------------------------------------------------------
// Validate whether authorized key
// rotation infrastructure usage may
// enter the recovery boundary.
//
// Infrastructure Recovery authorizes
// recovery boundary.
//
// Infrastructure Recovery does not
// execute recovery.
//
// This file does not:
//
// - authorize rotation
// - execute mechanisms
// - provision infrastructure
// - grant access
// - use infrastructure
// - call providers
// - call KMS APIs
// - call Vault APIs
// - execute recovery operations
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
// Infrastructure Usage
// ≠
// Infrastructure Recovery
//
// Usage Authorized
// ≠
// Recovery Authorized
//
// Recovery Authorized
// ≠
// Recovery Executed
//
// ============================================================

import {
  KeyRotationInfrastructureUsageResult,
} from "./P9F.key.rotation.infrastructure.usage";


// ============================================================
// RECOVERY DECISION
// ============================================================

export type InfrastructureRecoveryDecision =
  | "ALLOW_RECOVERY"
  | "DENY_RECOVERY";


// ============================================================
// RECOVERY STATUS
// ============================================================

export type InfrastructureRecoveryStatus =
  | "RECOVERY_AUTHORIZED"
  | "RECOVERY_DENIED";


// ============================================================
// RECOVERY DENIAL REASON
// ============================================================

export type InfrastructureRecoveryDenialReason =
  | "USAGE_NOT_AUTHORIZED"
  | "RECOVERY_NOT_ALLOWED";


// ============================================================
// RECOVERY REQUEST
// ============================================================

export interface KeyRotationInfrastructureRecoveryRequest {

  usage:
    KeyRotationInfrastructureUsageResult;

  recoveryDecision:
    InfrastructureRecoveryDecision;

}


// ============================================================
// RECOVERY RESULT
// ============================================================

export interface KeyRotationInfrastructureRecoveryResult {

  recoveryStatus:
    InfrastructureRecoveryStatus;

  recoveryAuthorized:
    boolean;

  recoveryDecision:
    InfrastructureRecoveryDecision;

  usageAuthorized:
    boolean;

  accessGranted:
    KeyRotationInfrastructureUsageResult["accessGranted"];

  provisioningAuthorized:
    KeyRotationInfrastructureUsageResult["provisioningAuthorized"];

  policyValidated:
    KeyRotationInfrastructureUsageResult["policyValidated"];

  resourceCompatible:
    KeyRotationInfrastructureUsageResult["resourceCompatible"];

  resource:
    KeyRotationInfrastructureUsageResult["resource"];

  infrastructureClass:
    KeyRotationInfrastructureUsageResult["infrastructureClass"];

  denialReason?:
    InfrastructureRecoveryDenialReason;

  usageSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// RECOVERY AUTHORIZATION
// ============================================================

export function authorizeKeyRotationInfrastructureRecovery(
  request: KeyRotationInfrastructureRecoveryRequest
): KeyRotationInfrastructureRecoveryResult {

  const usage =
    request.usage;

  if (!usage.usageAuthorized) {

    return {

      recoveryStatus:
        "RECOVERY_DENIED",

      recoveryAuthorized:
        false,

      recoveryDecision:
        request.recoveryDecision,

      usageAuthorized:
        false,

      accessGranted:
        usage.accessGranted,

      provisioningAuthorized:
        usage.provisioningAuthorized,

      policyValidated:
        usage.policyValidated,

      resourceCompatible:
        usage.resourceCompatible,

      resource:
        usage.resource,

      infrastructureClass:
        usage.infrastructureClass,

      denialReason:
        "USAGE_NOT_AUTHORIZED",

      usageSummary: [
        ...usage.summary,
      ],

      summary: [
        ...usage.summary,
        "usage_not_authorized",
        "recovery_denied",
      ],

    };

  }

  if (request.recoveryDecision === "DENY_RECOVERY") {

    return {

      recoveryStatus:
        "RECOVERY_DENIED",

      recoveryAuthorized:
        false,

      recoveryDecision:
        request.recoveryDecision,

      usageAuthorized:
        true,

      accessGranted:
        usage.accessGranted,

      provisioningAuthorized:
        usage.provisioningAuthorized,

      policyValidated:
        usage.policyValidated,

      resourceCompatible:
        usage.resourceCompatible,

      resource:
        usage.resource,

      infrastructureClass:
        usage.infrastructureClass,

      denialReason:
        "RECOVERY_NOT_ALLOWED",

      usageSummary: [
        ...usage.summary,
      ],

      summary: [
        ...usage.summary,
        "recovery_not_allowed",
        "recovery_denied",
      ],

    };

  }

  return {

    recoveryStatus:
      "RECOVERY_AUTHORIZED",

    recoveryAuthorized:
      true,

    recoveryDecision:
      request.recoveryDecision,

    usageAuthorized:
      true,

    accessGranted:
      usage.accessGranted,

    provisioningAuthorized:
      usage.provisioningAuthorized,

    policyValidated:
      usage.policyValidated,

    resourceCompatible:
      usage.resourceCompatible,

    resource:
      usage.resource,

    infrastructureClass:
      usage.infrastructureClass,

    usageSummary: [
      ...usage.summary,
    ],

    summary: [
      ...usage.summary,
      "recovery_authorized",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Infrastructure Recovery receives
// usage results.
//
// It does not re-run usage.
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
// - usageAuthorized
// - accessGranted
// - provisioningAuthorized
// - policyValidated
// - resourceCompatible
// - resource
// - infrastructureClass
//
// It authorizes a deterministic recovery
// boundary.
//
// Recovery does not execute provider
// recovery operations.
//
// Recovery does not call KMS or Vault.
//
// ============================================================


// ============================================================
// P9F.3.5 PRINCIPLE
// ============================================================
//
// Infrastructure Usage
// ≠
// Infrastructure Recovery
//
// Usage Authorized
// ≠
// Recovery Authorized
//
// Recovery Authorized
// ≠
// Recovery Executed
//
// Recovery
// ≠
// Provider Runtime
//
// Boolean Permission
// ≠
// Deterministic Recovery Decision
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
// - re-run usage authorization
// - create infrastructure
// - provision infrastructure
// - select providers
// - call provider APIs
// - call KMS APIs
// - call Vault APIs
// - execute provider operations
// - execute recovery operations
// - generate evidence
// - write ledger records
// - perform audits
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive usage result
//
// ✓ verify usage authorized
//
// ✓ preserve access granted result
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
// ✓ apply deterministic recovery decision
//
// ✓ authorize recovery boundary
//
// ✓ deny recovery when usage
//   is not authorized
//
// ✓ deny recovery when recovery
//   decision denies recovery
//
// ✓ preserve usage summary
//
// ✗ authorize rotation
//
// ✗ execute mechanisms
//
// ✗ re-run provisioning
//
// ✗ re-run access control
//
// ✗ re-run usage
//
// ✗ call providers
//
// ✗ execute recovery operations
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================