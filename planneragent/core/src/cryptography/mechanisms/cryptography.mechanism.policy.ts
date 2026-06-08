// ============================================================
// PlannerAgent — Cryptographic Mechanism Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/mechanisms/
// cryptography.mechanism.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Cryptographic Policy
//
// DOMAIN
// ------------------------------------------------------------
// P9C.6.1 — Cryptographic Mechanism Policy
//
// PURPOSE
// ------------------------------------------------------------
// Define approved cryptographic mechanisms
// for PlannerAgent.
//
// Define:
//
// - approved algorithms
// - approved encryption modes
// - approved key sizes
// - approved envelope mechanisms
// - approved transport protections
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance decides legitimacy.
//
// Mechanism Policy defines approved
// cryptographic methods.
//
// Execution performs cryptography.
//
// Verification verifies cryptographic results.
//
// DOES
// ------------------------------------------------------------
//
// ✓ define approved algorithms
//
// ✓ define approved modes
//
// ✓ define approved key sizes
//
// ✓ define approved transport protections
//
// ✓ define approved envelope mechanisms
//
// DOES NOT
// ------------------------------------------------------------
//
// ✗ encrypt
//
// ✗ decrypt
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
// ✗ define authority
//
// ✗ define governance
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define which cryptographic mechanisms
// are approved for use.
//
// Nothing else.
//
// ============================================================


// ============================================================
// APPROVED ALGORITHMS
// ============================================================

export type ApprovedEncryptionAlgorithm =
  | "AES";


// ============================================================
// APPROVED MODES
// ============================================================

export type ApprovedEncryptionMode =
  | "GCM";


// ============================================================
// APPROVED KEY SIZES
// ============================================================

export type ApprovedKeySize =
  | 256;


// ============================================================
// APPROVED TRANSPORT PROTECTIONS
// ============================================================

export type ApprovedTransportProtection =
  | "TLS_1_3";


// ============================================================
// APPROVED ENVELOPE MECHANISMS
// ============================================================

export type ApprovedEnvelopeMechanism =
  | "ENVELOPE_ENCRYPTION";


// ============================================================
// CRYPTOGRAPHIC MECHANISM
// ============================================================

export interface CryptographicMechanismPolicy {

  algorithm:
    ApprovedEncryptionAlgorithm;

  mode:
    ApprovedEncryptionMode;

  keySize:
    ApprovedKeySize;

  transportProtection:
    ApprovedTransportProtection;

  envelopeMechanism:
    ApprovedEnvelopeMechanism;

  approved:
    boolean;

  summary:
    string[];

}


// ============================================================
// CANONICAL MECHANISM POLICY
// ============================================================

export const CRYPTOGRAPHIC_MECHANISM_POLICY:
  CryptographicMechanismPolicy = {

  algorithm:
    "AES",

  mode:
    "GCM",

  keySize:
    256,

  transportProtection:
    "TLS_1_3",

  envelopeMechanism:
    "ENVELOPE_ENCRYPTION",

  approved:
    true,

  summary: [
    "aes_256_gcm",
    "tls_1_3",
    "envelope_encryption",
    "approved_mechanism",
  ],

};


// ============================================================
// POLICY RESOLUTION
// ============================================================

export function getCryptographicMechanismPolicy():
  CryptographicMechanismPolicy {

  return CRYPTOGRAPHIC_MECHANISM_POLICY;

}


// ============================================================
// PLANNERAGENT MECHANISM PRINCIPLE
// ============================================================
//
// Governance decides legitimacy.
//
// Mechanism Policy defines approved methods.
//
// Execution performs cryptography.
//
// Verification verifies cryptographic results.
//
// Mechanism Policy may approve mechanisms.
//
// Mechanism Policy may never perform
// mechanisms.
//
// ============================================================