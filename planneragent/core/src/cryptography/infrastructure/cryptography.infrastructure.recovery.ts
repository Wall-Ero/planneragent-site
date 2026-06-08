// ============================================================
// PlannerAgent — Infrastructure Recovery
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/
// cryptography.infrastructure.recovery.ts
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
// P9C.7.5 — Infrastructure Recovery
//
// PURPOSE
// ------------------------------------------------------------
// Validate recovery requests against
// approved recovery mechanisms.
//
// Infrastructure Recovery recovers.
//
// Infrastructure Recovery never defines.
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
// Infrastructure Recovery currently
// implements the recovery authorization
// boundary.
//
// Recovery Authorized
// ≠
// Recovery Executed
//
// Real recovery execution remains deferred
// to future implementation layers.
//
// DOES
// ------------------------------------------------------------
//
// ✓ validate recovery requests
//
// ✓ validate approved recovery mechanisms
//
// ✓ authorize recovery requests
//
// ✓ deny invalid recovery requests
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ restore backups
//
// ✗ restore snapshots
//
// ✗ rollback infrastructure
//
// ✗ recover secrets
//
// ✗ recover keys
//
// ✗ recover storage
//
// ✗ execute recovery operations
//
// ✗ define policy
//
// ✗ provision infrastructure
//
// ✗ authorize access
//
// ✗ perform usage
//
// ✗ define governance
//
// ✗ create evidence
//
// ✗ write ledger
//
// ✗ perform audits
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Validate infrastructure recovery requests
// against approved recovery mechanisms.
//
// P9C.7.5 currently implements
// the recovery authorization boundary.
//
// Real recovery execution remains deferred
// to future implementation layers.
//
// Nothing else.
//
// ============================================================

import {
  ApprovedRecoveryMechanism,
  getInfrastructurePolicy,
} from "./cryptography.infrastructure.policy";

import {
  InfrastructureResource,
} from "./cryptography.infrastructure.accessControl";


// ============================================================
// RECOVERY OPERATION
// ============================================================

export type InfrastructureRecoveryOperation =
  | "REQUEST_BACKUP_RESTORE";


// ============================================================
// REQUEST
// ============================================================

export interface InfrastructureRecoveryRequest {

  resource:
    InfrastructureResource;

  recoveryMechanism:
    ApprovedRecoveryMechanism;

  operation:
    InfrastructureRecoveryOperation;

  usageAuthorized:
    boolean;

}


// ============================================================
// DENIAL REASON
// ============================================================

export type InfrastructureRecoveryDenialReason =
  | "USAGE_NOT_AUTHORIZED"
  | "RECOVERY_MECHANISM_NOT_APPROVED";


// ============================================================
// RESULT
// ============================================================

export interface InfrastructureRecoveryResult {

  recoveryAllowed:
    boolean;

  recoveryValidated:
    boolean;

  recoveryMechanismValidated:
    boolean;

  denialReason?:
    InfrastructureRecoveryDenialReason;

  summary:
    string[];

}


// ============================================================
// RECOVERY VALIDATION
// ============================================================

export function validateInfrastructureRecovery(
  request: InfrastructureRecoveryRequest
): InfrastructureRecoveryResult {

  if (!request.usageAuthorized) {

    return {

      recoveryAllowed:
        false,

      recoveryValidated:
        false,

      recoveryMechanismValidated:
        false,

      denialReason:
        "USAGE_NOT_AUTHORIZED",

      summary: [
        "usage_not_authorized",
        "recovery_denied",
      ],

    };

  }

  const policy =
    getInfrastructurePolicy();

  const recoveryMechanismValidated =
    policy.approvedRecoveryMechanisms.includes(
      request.recoveryMechanism
    );

  if (!recoveryMechanismValidated) {

    return {

      recoveryAllowed:
        false,

      recoveryValidated:
        false,

      recoveryMechanismValidated:
        false,

      denialReason:
        "RECOVERY_MECHANISM_NOT_APPROVED",

      summary: [
        "recovery_mechanism_not_approved",
        "recovery_denied",
      ],

    };

  }

  return {

    recoveryAllowed:
      true,

    recoveryValidated:
      true,

    recoveryMechanismValidated:
      true,

    summary: [
      "recovery_mechanism_validated",
      "recovery_allowed",
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
// Infrastructure Recovery currently
// implements the recovery authorization
// boundary.
//
// Recovery Authorized
// ≠
// Recovery Executed
//
// Real recovery execution remains deferred
// to future implementation layers.
//
// Infrastructure Recovery may validate
// recovery requests against approved
// recovery mechanisms.
//
// Infrastructure Recovery may never:
//
// - restore backups
// - restore snapshots
// - rollback infrastructure
// - recover secrets
// - recover keys
// - recover storage
// - execute recovery operations
//
// ============================================================