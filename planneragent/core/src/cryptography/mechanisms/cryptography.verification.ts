// ============================================================
// PlannerAgent — Cryptographic Verification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/mechanisms/
// cryptography.verification.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Cryptographic Verification
//
// DOMAIN
// ------------------------------------------------------------
// P9C.6.4 — Cryptographic Verification
//
// PURPOSE
// ------------------------------------------------------------
// Verify cryptographic execution results.
//
// Verification verifies.
//
// Verification never executes.
//
// Verification never authorizes.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Mechanism Policy approves.
//
// Execution Gate authorizes.
//
// Execution Runtime executes.
//
// Verification verifies.
//
// DOES
// ------------------------------------------------------------
//
// ✓ verify execution completion
//
// ✓ verify output presence
//
// ✓ verify execution result structure
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ authorize execution
//
// ✗ perform encryption
//
// ✗ perform decryption
//
// ✗ define policy
//
// ✗ define governance
//
// ✗ create evidence
//
// ✗ write ledger
//
// ✗ perform audits
//
// ✗ access KMS
//
// ✗ access Vault
//
// ✗ rotate keys
//
// ✗ generate keys
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Verify cryptographic execution results.
//
// Nothing else.
//
// ============================================================

import {
  CryptographicExecutionOperation,
} from "./cryptography.execution";


// ============================================================
// REQUEST
// ============================================================

export interface CryptographicVerificationRequest {

  executed:
    boolean;

  operation:
    CryptographicExecutionOperation;

  output:
    Uint8Array;

}


// ============================================================
// DENIAL REASONS
// ============================================================

export type CryptographicVerificationDenialReason =
  | "EXECUTION_NOT_COMPLETED"
  | "OUTPUT_MISSING";


// ============================================================
// RESULT
// ============================================================

export interface CryptographicVerificationResult {

  verified:
    boolean;

  executionVerified:
    boolean;

  outputVerified:
    boolean;

  denialReason?:
    CryptographicVerificationDenialReason;

  summary:
    string[];

}


// ============================================================
// VERIFICATION
// ============================================================

export function verifyCryptographicExecution(
  request: CryptographicVerificationRequest
): CryptographicVerificationResult {

  const executionVerified =
    request.executed;

  const outputVerified =
    request.output.length > 0;

  if (!executionVerified) {

    return {

      verified:
        false,

      executionVerified:
        false,

      outputVerified,

      denialReason:
        "EXECUTION_NOT_COMPLETED",

      summary: [
        "execution_not_completed",
        "verification_failed",
      ],

    };

  }

  if (!outputVerified) {

    return {

      verified:
        false,

      executionVerified,

      outputVerified:
        false,

      denialReason:
        "OUTPUT_MISSING",

      summary: [
        "output_missing",
        "verification_failed",
      ],

    };

  }

  return {

    verified:
      true,

    executionVerified:
      true,

    outputVerified:
      true,

    summary: [
      "execution_verified",
      "output_verified",
      "verification_completed",
    ],

  };

}


// ============================================================
// VERIFICATION PRINCIPLE
// ============================================================
//
// Mechanism Policy approves.
//
// Execution Gate authorizes.
//
// Execution Runtime executes.
//
// Verification verifies.
//
// Verification may verify results.
//
// Verification may never execute.
//
// Verification may never authorize.
//
// ============================================================