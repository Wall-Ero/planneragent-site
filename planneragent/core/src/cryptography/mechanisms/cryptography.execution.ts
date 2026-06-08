// ============================================================
// PlannerAgent — Cryptographic Execution Gate
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/mechanisms/
// cryptography.execution.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Cryptographic Execution Control
//
// DOMAIN
// ------------------------------------------------------------
// P9C.6.2 — Cryptographic Execution Gate
//
// PURPOSE
// ------------------------------------------------------------
// Determine whether an approved
// cryptographic operation may proceed.
//
// This layer does not perform
// cryptographic execution.
//
// This layer authorizes execution.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// A cryptographic operation may be
// technically possible.
//
// If it violates Mechanism Policy,
// it must not proceed.
//
// DOES
// ------------------------------------------------------------
//
// ✓ validate cryptographic execution requests
//
// ✓ enforce mechanism policy
//
// ✓ authorize approved execution requests
//
// ✓ deny non-compliant execution requests
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ encrypt
//
// ✗ decrypt
//
// ✗ execute envelope encryption
//
// ✗ generate ciphertext
//
// ✗ generate plaintext
//
// ✗ access KMS
//
// ✗ access Vault
//
// ✗ access HSM
//
// ✗ rotate keys
//
// ✗ generate keys
//
// ✗ perform verification
//
// ✗ create evidence
//
// ✗ write ledger
//
// ✗ perform audits
//
// ✗ define governance
//
// ✗ define authority
//
// ✗ define approved algorithms
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Validate whether a cryptographic
// operation may proceed.
//
// Nothing else.
//
// ============================================================

import {
  ApprovedEncryptionAlgorithm,
  ApprovedEncryptionMode,
  ApprovedKeySize,
  getCryptographicMechanismPolicy,
} from "./cryptography.mechanism.policy";


// ============================================================
// OPERATIONS
// ============================================================

export type CryptographicExecutionOperation =
  | "ENCRYPT"
  | "DECRYPT";


// ============================================================
// REQUEST
// ============================================================

export interface CryptographicExecutionRequest {

  operation:
    CryptographicExecutionOperation;

  algorithm:
    ApprovedEncryptionAlgorithm;

  mode:
    ApprovedEncryptionMode;

  keySize:
    ApprovedKeySize;

}


// ============================================================
// RESULT
// ============================================================

export interface CryptographicExecutionGateResult {

  executionAuthorized:
    boolean;

  policyValidated:
    boolean;

  denialReason?:
    "POLICY_VALIDATION_FAILED";

  summary:
    string[];

}


// ============================================================
// EXECUTION GATE
// ============================================================

export function authorizeCryptographicExecution(
  request: CryptographicExecutionRequest
): CryptographicExecutionGateResult {

  const policy =
    getCryptographicMechanismPolicy();

  const policyValidated =

    request.algorithm ===
      policy.algorithm &&

    request.mode ===
      policy.mode &&

    request.keySize ===
      policy.keySize &&

    policy.approved;

  if (!policyValidated) {

    return {

      executionAuthorized:
        false,

      policyValidated:
        false,

      denialReason:
        "POLICY_VALIDATION_FAILED",

      summary: [
        "policy_validation_failed",
        "execution_denied",
      ],

    };

  }

  return {

    executionAuthorized:
      true,

    policyValidated:
      true,

    summary: [
      "policy_validated",
      "execution_authorized",
    ],

  };

}


// ============================================================
// EXECUTION GATE PRINCIPLE
// ============================================================
//
// Mechanism Policy approves.
//
// Execution Gate authorizes execution.
//
// Execution performs cryptography.
//
// Verification verifies results.
//
// Execution Gate may authorize execution.
//
// Execution Gate may never perform
// cryptographic execution.
//
// ============================================================