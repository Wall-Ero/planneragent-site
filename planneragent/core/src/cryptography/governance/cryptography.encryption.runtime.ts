// ============================================================
// PlannerAgent — Encryption Runtime
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.encryption.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Cryptography Governance
//
// P9C.3 — Encryption Runtime
//
// PURPOSE
// ------------------------------------------------------------
// Translate encryption requests into
// governed encryption decisions.
//
// Determine whether encryption is legitimate
// according to:
//
// - payload policy
// - authority validation
// - approval validation
// - encryption eligibility
//
// before any cryptographic operation may occur.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Encryption is not a cryptographic decision.
//
// Encryption eligibility is a governance decision.
//
// Cryptography may execute encryption.
// Governance determines whether encryption
// is permitted.
//
// DOES NOT:
//
// - encrypt payload bytes
// - decrypt payload bytes
// - manage keys
// - rotate keys
// - access KMS
// - access secret stores
// - generate evidence
// - write ledger records
// - perform cryptographic operations
//
// DOES:
//
// - evaluate encryption requests
// - resolve payload policy
// - validate authority
// - validate approval requirements
// - determine encryption eligibility
// - fail closed
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Transform encryption requests into
// governed encryption decisions.
//
// Nothing else.
//
// ============================================================

import {
  getPayloadEncryptionPolicy,
} from "./cryptography.payload.policy";

import type {
  ProtectedPayloadClass,
  EncryptionAuthorityLevel,
} from "./cryptography.payload.policy";

// ============================================================
// DECISION STATUS
// ============================================================

export type EncryptionDecisionStatus =
  | "ALLOWED"
  | "DENIED"
  | "APPROVAL_REQUIRED";

// ============================================================
// DENIAL REASON
// ============================================================

export type EncryptionDenialReason =
  | "AUTHORITY_INVALID"
  | "APPROVAL_MISSING"
  | "PAYLOAD_POLICY_DENIED"
  | "FAIL_CLOSED";

// ============================================================
// REQUEST
// ============================================================

export interface EncryptionRequest {

  payloadClass:
    ProtectedPayloadClass;

  authority:
    EncryptionAuthorityLevel;

  approvalProvided:
    boolean;

}

// ============================================================
// DECISION
// ============================================================

export interface EncryptionDecision {

  status:
    EncryptionDecisionStatus;

  payloadClass:
    ProtectedPayloadClass;

  authorityValidated:
    boolean;

  approvalValidated:
    boolean;

  encryptionEligible:
    boolean;

  governanceEvidenceRequired:
    boolean;

  ledgerRecordRequired:
    boolean;

  cryptographicAuditRequired:
    boolean;

  denialReason?:
    EncryptionDenialReason;

  reason:
    string;

  summary:
    string[];

}

// ============================================================
// MAIN
// ============================================================

export function evaluateEncryptionRequest(
  request: EncryptionRequest
): EncryptionDecision {

  const policy =
    getPayloadEncryptionPolicy(
      request.payloadClass
    );

  // ----------------------------------------------------------
  // FAIL CLOSED
  // ----------------------------------------------------------

  if (!policy) {

    return {

      status:
        "DENIED",

      payloadClass:
        request.payloadClass,

      authorityValidated:
        false,

      approvalValidated:
        false,

      encryptionEligible:
        false,

      governanceEvidenceRequired:
        true,

      ledgerRecordRequired:
        true,

      cryptographicAuditRequired:
        true,

      denialReason:
        "FAIL_CLOSED",

      reason:
        "Payload policy not found.",

      summary: [
        "fail_closed",
        "payload_policy_missing",
      ],

    };

  }

  // ----------------------------------------------------------
  // ENCRYPTION NOT REQUIRED
  // ----------------------------------------------------------

  if (
    !policy.encryptionMandatory
  ) {

    return {

      status:
        "ALLOWED",

      payloadClass:
        policy.payloadClass,

      authorityValidated:
        true,

      approvalValidated:
        true,

      encryptionEligible:
        false,

      governanceEvidenceRequired:
        policy.governanceEvidenceRequired,

      ledgerRecordRequired:
        policy.ledgerRecordRequired,

      cryptographicAuditRequired:
        policy.cryptographicAuditRequired,

      reason:
        "Payload encryption not required by policy.",

      summary: [
        "encryption_not_required",
      ],

    };

  }

  // ----------------------------------------------------------
  // AUTHORITY VALIDATION
  // ----------------------------------------------------------

  // TODO P9C.4
  // Replace equality validation with
  // authority hierarchy validation.
  //
  // CHARTER
  //   > PRINCIPAL
  //   > GOVERNANCE
  //   > SYSTEM

  const authorityValidated =
    request.authority ===
    policy.authorityRequired;

  if (
    !authorityValidated
  ) {

    return {

      status:
        "DENIED",

      payloadClass:
        policy.payloadClass,

      authorityValidated:
        false,

      approvalValidated:
        false,

      encryptionEligible:
        false,

      governanceEvidenceRequired:
        policy.governanceEvidenceRequired,

      ledgerRecordRequired:
        policy.ledgerRecordRequired,

      cryptographicAuditRequired:
        policy.cryptographicAuditRequired,

      denialReason:
        "AUTHORITY_INVALID",

      reason:
        "Authority validation failed.",

      summary: [
        "authority_invalid",
      ],

    };

  }

  // ----------------------------------------------------------
  // APPROVAL VALIDATION
  // ----------------------------------------------------------

  if (
    policy.humanApprovalRequired &&
    !request.approvalProvided
  ) {

    return {

      status:
        "APPROVAL_REQUIRED",

      payloadClass:
        policy.payloadClass,

      authorityValidated:
        true,

      approvalValidated:
        false,

      encryptionEligible:
        false,

      governanceEvidenceRequired:
        policy.governanceEvidenceRequired,

      ledgerRecordRequired:
        policy.ledgerRecordRequired,

      cryptographicAuditRequired:
        policy.cryptographicAuditRequired,

      reason:
        "Human approval required.",

      summary: [
        "approval_required",
      ],

    };

  }

  // ----------------------------------------------------------
  // ALLOWED
  // ----------------------------------------------------------

  return {

    status:
      "ALLOWED",

    payloadClass:
      policy.payloadClass,

    authorityValidated:
      true,

    approvalValidated:
      true,

    encryptionEligible:
      true,

    governanceEvidenceRequired:
      policy.governanceEvidenceRequired,

    ledgerRecordRequired:
      policy.ledgerRecordRequired,

    cryptographicAuditRequired:
      policy.cryptographicAuditRequired,

    reason:
      "Encryption permitted under policy.",

    summary: [
      "encryption_allowed",
    ],

  };

}