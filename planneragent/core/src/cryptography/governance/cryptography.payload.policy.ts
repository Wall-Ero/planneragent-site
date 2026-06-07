// ============================================================
// PlannerAgent — Payload Encryption Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/cryptography.payload.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Cryptography Governance
//
// PURPOSE
// ------------------------------------------------------------
// Define payload encryption governance policy.
//
// Classify protected payloads.
//
// Define encryption requirements.
//
// Define decryption authority requirements.
//
// DOES NOT:
//
// - perform encryption
// - perform decryption
// - manage keys
// - access KMS
// - generate evidence
// - write ledger records
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define:
//
// - what must be encrypted
// - what may be encrypted
// - who may encrypt
// - who may decrypt
// - which authority is required
//
// Nothing else.
//
// ============================================================


// ============================================================
// PROTECTED PAYLOAD CLASSES
// ============================================================

export type ProtectedPayloadClass =
  | "TENANT_DATA"
  | "GOVERNANCE_EVIDENCE"
  | "AUDIT_LEDGER"
  | "DECISION_MEMORY"
  | "EXECUTION_MEMORY"
  | "OAG"
  | "CHARTER"
  | "SECRET"
  | "API_CREDENTIAL"
  | "RECOVERY_ARTIFACT";


// ============================================================
// ENCRYPTION AUTHORITY LEVELS
// ============================================================

export type EncryptionAuthorityLevel =
  | "SYSTEM"
  | "GOVERNANCE"
  | "PRINCIPAL"
  | "CHARTER";


// ============================================================
// PAYLOAD ENCRYPTION POLICY
// ============================================================

export interface PayloadEncryptionPolicy {

  payloadClass:
    ProtectedPayloadClass;

  encryptionMandatory:
    boolean;

  decryptionAllowed:
    boolean;

  authorityRequired:
    EncryptionAuthorityLevel;

  humanApprovalRequired:
    boolean;

  governanceEvidenceRequired:
    boolean;

  ledgerRecordRequired:
    boolean;

  cryptographicAuditRequired:
    boolean;

  summary:
    string[];

}


// ============================================================
// CANONICAL PAYLOAD POLICIES
// ============================================================

export const PAYLOAD_ENCRYPTION_POLICIES:
  Record<
    ProtectedPayloadClass,
    PayloadEncryptionPolicy
  > = {

  // ----------------------------------------------------------
  // TENANT DATA
  // ----------------------------------------------------------

  TENANT_DATA: {

    payloadClass:
      "TENANT_DATA",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "SYSTEM",

    humanApprovalRequired:
      false,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "tenant_data",
      "encryption_required",
    ],

  },

  // ----------------------------------------------------------
  // GOVERNANCE EVIDENCE
  // ----------------------------------------------------------

  GOVERNANCE_EVIDENCE: {

    payloadClass:
      "GOVERNANCE_EVIDENCE",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "GOVERNANCE",

    humanApprovalRequired:
      false,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "governance_evidence",
      "protected",
    ],

  },

  // ----------------------------------------------------------
  // AUDIT LEDGER
  // ----------------------------------------------------------

  AUDIT_LEDGER: {

    payloadClass:
      "AUDIT_LEDGER",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "GOVERNANCE",

    humanApprovalRequired:
      false,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "audit_ledger",
      "protected",
    ],

  },

  // ----------------------------------------------------------
  // DECISION MEMORY
  // ----------------------------------------------------------

  DECISION_MEMORY: {

    payloadClass:
      "DECISION_MEMORY",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "SYSTEM",

    humanApprovalRequired:
      false,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "decision_memory",
      "protected",
    ],

  },

  // ----------------------------------------------------------
  // EXECUTION MEMORY
  // ----------------------------------------------------------

  EXECUTION_MEMORY: {

    payloadClass:
      "EXECUTION_MEMORY",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "SYSTEM",

    humanApprovalRequired:
      false,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "execution_memory",
      "protected",
    ],

  },

  // ----------------------------------------------------------
  // OAG
  // ----------------------------------------------------------

  OAG: {

    payloadClass:
      "OAG",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "CHARTER",

    humanApprovalRequired:
      true,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "organizational_authority_graph",
      "authority_protected",
    ],

  },

  // ----------------------------------------------------------
  // CHARTER
  // ----------------------------------------------------------

  CHARTER: {

    payloadClass:
      "CHARTER",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "CHARTER",

    humanApprovalRequired:
      true,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "charter",
      "constitution_protected",
    ],

  },

  // ----------------------------------------------------------
  // SECRET
  // ----------------------------------------------------------

  SECRET: {

    payloadClass:
      "SECRET",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "PRINCIPAL",

    humanApprovalRequired:
      true,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "secret",
      "restricted_access",
    ],

  },

  // ----------------------------------------------------------
  // API CREDENTIAL
  // ----------------------------------------------------------

  API_CREDENTIAL: {

    payloadClass:
      "API_CREDENTIAL",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "PRINCIPAL",

    humanApprovalRequired:
      true,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "api_credential",
      "restricted_access",
    ],

  },

  // ----------------------------------------------------------
  // RECOVERY ARTIFACT
  // ----------------------------------------------------------

  RECOVERY_ARTIFACT: {

    payloadClass:
      "RECOVERY_ARTIFACT",

    encryptionMandatory:
      true,

    decryptionAllowed:
      true,

    authorityRequired:
      "GOVERNANCE",

    humanApprovalRequired:
      true,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "recovery_artifact",
      "governed_recovery",
    ],

  },

};


// ============================================================
// POLICY RESOLUTION
// ============================================================

export function getPayloadEncryptionPolicy(
  payloadClass: ProtectedPayloadClass
): PayloadEncryptionPolicy {

  return PAYLOAD_ENCRYPTION_POLICIES[
    payloadClass
  ];

}


// ============================================================
// ROADMAP NOTE
// ============================================================
//
// P9C.4 — Key Management Governance
//
// Evaluate separation between:
//
// - PRINCIPAL
// - KEY_OWNER
//
// Budget authority does not automatically
// imply cryptographic ownership authority.
//
// ============================================================


// ============================================================
// PLANNERAGENT CRYPTOGRAPHIC PRINCIPLE
// ============================================================
//
// Encryption authority does not imply
// data authority.
//
// Decryption authority does not imply
// decision authority.
//
// Cryptographic access never creates
// organizational authority.
//
// Encryption protects payloads.
// Governance governs encryption.
//
// Every cryptographic authority event
// must become observable.
//
// ============================================================