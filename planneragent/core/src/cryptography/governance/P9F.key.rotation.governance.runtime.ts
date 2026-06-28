// ============================================================
// PlannerAgent — Key Rotation Governance Runtime
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// P9F.key.rotation.governance.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9F.1.2 — Key Rotation Governance Runtime
//
// PURPOSE
// ------------------------------------------------------------
// Evaluate key rotation governance
// requests against Key Rotation
// Governance Policy.
//
// Governance Runtime decides.
//
// Governance Runtime does not execute
// key rotation.
//
// This file decides whether rotation is:
//
// - allowed
// - denied
// - required
//
// This file does not:
//
// - rotate keys
// - execute cryptography
// - call KMS APIs
// - call Vault APIs
// - produce evidence
// - write ledger records
// - perform audits
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Policy defines.
//
// Runtime decides.
//
// Evidence preserves.
//
// Ledger remembers.
//
// Audit verifies.
//
// ============================================================

import {
  RotationAuthority,
  RotationTrigger,
  resolveKeyRotationGovernancePolicy,
} from "./P9F.key.rotation.governance.policy";


// ============================================================
// ROTATION DECISION STATUS
// ============================================================

export type KeyRotationDecisionStatus =
  | "ROTATION_ALLOWED"
  | "ROTATION_DENIED"
  | "ROTATION_REQUIRED";


// ============================================================
// DECISION CODE
// ============================================================
//
// Runtime produces deterministic
// decision codes.
//
// Human-readable explanations belong
// to formatter or narration layers.
//
// ============================================================

export type KeyRotationDecisionCode =
  | "ROTATION_DENIED_AUTHORITY"
  | "ROTATION_DENIED_TRIGGER"
  | "ROTATION_REQUIRED"
  | "ROTATION_ALLOWED";


// ============================================================
// DENIAL REASON
// ============================================================

export type KeyRotationDenialReason =
  | "AUTHORITY_NOT_ALLOWED"
  | "TRIGGER_NOT_ALLOWED";


// ============================================================
// REQUEST
// ============================================================

export interface KeyRotationGovernanceRequest {

  authority:
    RotationAuthority;

  trigger:
    RotationTrigger;

}


// ============================================================
// DECISION
// ============================================================

export interface KeyRotationGovernanceDecision {

  decisionStatus:
    KeyRotationDecisionStatus;

  decisionCode:
    KeyRotationDecisionCode;

  authorityValidated:
    boolean;

  triggerValidated:
    boolean;

  denialReason?:
    KeyRotationDenialReason;

  summary:
    string[];

}


// ============================================================
// RUNTIME
// ============================================================

export function evaluateKeyRotationGovernance(
  request: KeyRotationGovernanceRequest
): KeyRotationGovernanceDecision {

  const policy =
    resolveKeyRotationGovernancePolicy();

  const authorityValidated =
    policy.authorizedAuthorities.includes(
      request.authority
    );

  if (!authorityValidated) {

    return {

      decisionStatus:
        "ROTATION_DENIED",

      decisionCode:
        "ROTATION_DENIED_AUTHORITY",

      authorityValidated:
        false,

      triggerValidated:
        false,

      denialReason:
        "AUTHORITY_NOT_ALLOWED",

      summary: [
        "authority_not_allowed",
        "rotation_denied",
      ],

    };

  }

  const triggerValidated =
    policy.authorizedTriggers.includes(
      request.trigger
    );

  if (!triggerValidated) {

    return {

      decisionStatus:
        "ROTATION_DENIED",

      decisionCode:
        "ROTATION_DENIED_TRIGGER",

      authorityValidated:
        true,

      triggerValidated:
        false,

      denialReason:
        "TRIGGER_NOT_ALLOWED",

      summary: [
        "trigger_not_allowed",
        "rotation_denied",
      ],

    };

  }

  const rotationRequired =
    request.trigger === "KEY_COMPROMISE" ||
    request.trigger === "SUSPECTED_COMPROMISE" ||
    request.trigger === "REGULATORY_REQUIREMENT" ||
    request.trigger === "EMERGENCY_ROTATION";

  if (rotationRequired) {

    return {

      decisionStatus:
        "ROTATION_REQUIRED",

      decisionCode:
        "ROTATION_REQUIRED",

      authorityValidated:
        true,

      triggerValidated:
        true,

      summary: [
        "authority_validated",
        "trigger_validated",
        "rotation_required",
      ],

    };

  }

  return {

    decisionStatus:
      "ROTATION_ALLOWED",

    decisionCode:
      "ROTATION_ALLOWED",

    authorityValidated:
      true,

    triggerValidated:
      true,

    summary: [
      "authority_validated",
      "trigger_validated",
      "rotation_allowed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Governance Runtime decides whether
// rotation is allowed, denied, or required.
//
// Governance Runtime does not rotate keys.
//
// Rotation Authorized
// ≠
// Rotation Executed
//
// Rotation Required
// ≠
// Rotation Executed
//
// Runtime produces deterministic
// decision codes.
//
// Human-readable explanations belong
// to formatter or narration layers.
//
// ============================================================


// ============================================================
// FUTURE EVOLUTION
// ============================================================
//
// Current v1 models some operational
// rotation modes as governance triggers.
//
// In particular:
//
// EMERGENCY_ROTATION
//
// is currently modeled as a governance
// trigger for v1 simplicity.
//
// Future runtimes may separate:
//
// Observed Event
// ↓
// Governance Decision
// ↓
// Execution Mode
//
// Example:
//
// KEY_COMPROMISE
// ↓
// ROTATION_REQUIRED
// ↓
// EMERGENCY_ROTATION
//
// In that future model:
//
// KEY_COMPROMISE
// = Observed Event
//
// ROTATION_REQUIRED
// = Governance Decision
//
// EMERGENCY_ROTATION
// = Execution Mode
//
// This preserves strict responsibility
// boundaries between Governance,
// Mechanism, and Infrastructure.
//
// ============================================================


// ============================================================
// P9F.1.2 PRINCIPLE
// ============================================================
//
// Policy defines.
//
// Runtime decides.
//
// Runtime interprets authorized
// governance triggers.
//
// Runtime may validate authority.
//
// Runtime may validate trigger.
//
// Runtime may require rotation.
//
// Runtime may deny rotation.
//
// Runtime may emit deterministic
// decision codes.
//
// Runtime may never execute rotation.
//
// Runtime may never create evidence.
//
// Runtime may never write ledger records.
//
// Runtime may never perform audit.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - rotate keys
// - call KMS APIs
// - call Vault APIs
// - perform key wrapping
// - perform key unwrapping
// - execute cryptographic mechanisms
// - provision infrastructure
// - enforce infrastructure access
// - generate evidence records
// - write ledger records
// - perform audits
// - generate human-readable explanations
//
// These responsibilities belong to:
//
// Mechanism Family
// Infrastructure Family
// Evidence Layer
// Ledger Layer
// Audit Layer
// Formatter / Narration Layer
//
// ============================================================


// ============================================================
// FREEZE STATUS
// ============================================================
//
// P9F.1.2 Key Rotation Governance Runtime
//
// STATUS:
// FREEZE READY
//
// Verified Outcome:
//
// Policy
// ↓
// Runtime
//
// Verified Principles:
//
// Policy Defines
// ↓
// Runtime Decides
//
// Runtime Produces Deterministic Decisions
//
// Rotation Authorized
// ≠
// Rotation Executed
//
// Rotation Required
// ≠
// Rotation Executed
//
// ============================================================