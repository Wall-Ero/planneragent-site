// ============================================================
// PlannerAgent — Cryptography Governance Threat Model
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.governance.threat-model.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Cryptography Governance & Key Management
//
// P9C.1 — Cryptographic Design Review
//
// PURPOSE
// ------------------------------------------------------------
// Define cryptographic threat scenarios,
// protected assets,
// authority boundaries,
// governance assumptions,
// and residual risk requirements
// before cryptographic implementation.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Cryptography protects data.
//
// Governance protects trust.
//
// Keys are authority objects.
//
// Decryption is an authority event.
//
// Secret access is a governance event.
//
// AI Security Review increases discovery.
//
// Governance controls what happens
// after discovery.
//
// Discovery does not authorize action.
//
// Key access does not grant authority.
//
// Decryption does not grant legitimacy.
//
// DOES NOT:
//
// - encrypt payloads
// - decrypt payloads
// - create keys
// - rotate keys
// - store secrets
// - call KMS
// - perform cryptography
//
// DOES:
//
// - define cryptographic threats
// - define protected assets
// - define authority boundaries
// - define governance requirements
// - define residual risk assumptions
//
// FINAL SUCCESS CRITERION
// ------------------------------------------------------------
// Protected data must remain:
//
// - confidential
// - attributable
// - auditable
// - recoverable
// - governance-controlled
//
// even under infrastructure compromise.
//
// ============================================================
//
// PLANNERAGENT AUTHORITY PROTECTION PRINCIPLE
// ------------------------------------------------------------
//
// Traditional systems primarily protect:
//
// - data
// - infrastructure
// - credentials
//
// PlannerAgent must additionally protect:
//
// - authority
// - delegation rights
// - approval rights
// - governance legitimacy
//
// The Organizational Authority Graph (OAG)
// and the CHARTER are therefore treated as
// protected cryptographic assets.
//
// Corruption of authority may be more severe
// than corruption of data.
//
// The most dangerous attack is not:
//
//   data corruption
//
// but:
//
//   authority corruption
//
// because authority determines:
//
// - who may approve
// - who may delegate
// - who may execute
// - who may access keys
// - who may accept residual risk
//
// Cryptography therefore protects not only
// information confidentiality, but also
// governance legitimacy.
//
// ============================================================

// ============================================================
// TRUSTED PROVIDER PRINCIPLE
// ============================================================
//
// Trusted providers are not trusted absolutely.
//
// KMS providers may be compromised,
// misconfigured,
// unavailable,
// or behave unexpectedly.
//
// Governance must therefore remain capable of:
//
// - detecting compromise
// - revoking trust
// - rotating authority
// - preserving evidence
//
// No cryptographic provider is above governance.
//

// ============================================================
// THREAT SCENARIOS
// ============================================================

export type CryptographicThreatScenario =
| "CROSS_TENANT_DECRYPTION"
| "UNAUTHORIZED_DECRYPTION"
| "KEY_EXFILTRATION"
| "SECRET_EXPOSURE"
| "BACKUP_DATA_EXPOSURE"
| "STORAGE_COMPROMISE"
| "LOG_SECRET_LEAKAGE"
| "STALE_KEY_USAGE"
| "REVOKED_KEY_USAGE"
| "UNAPPROVED_KEY_ROTATION"
| "UNAPPROVED_RISK_ACCEPTANCE"
| "AI_ASSISTED_SECRET_DISCOVERY"
| "KEY_AUTHORITY_ESCALATION"
| "COMPROMISED_KMS"
| "CRYPTOGRAPHIC_POLICY_BYPASS";

// ============================================================
// THREAT ACTORS
// ============================================================

export type CryptographicThreatActor =
  | "EXTERNAL_ATTACKER"
  | "INSIDER"
  | "MISSCOPED_OPERATOR"
  | "SUPPLY_CHAIN_COMPROMISE"
  | "COMPROMISED_KMS_PROVIDER"
  | "AUTOMATION"
  | "AI_SYSTEM";

// ============================================================
// PROTECTED ASSETS
// ============================================================

export type ProtectedCryptographicAsset =
| "OPERATIONAL_DATA"
| "DECISION_MEMORY"
| "EXECUTION_MEMORY"
| "AUDIT_RECORD"
| "BACKUP"
| "SECRET"
| "CRYPTOGRAPHIC_KEY"
| "TENANT_BOUNDARY"
| "GOVERNANCE_EVIDENCE"
| "AUTHORITY_GRAPH"
| "CHARTER";

// ============================================================
// AUTHORITY REQUIREMENTS
// ============================================================

export type CryptographicAuthorityRequirement =
| "TENANT_AUTHORITY_REQUIRED"
| "HUMAN_APPROVAL_REQUIRED"
| "KEY_OWNERSHIP_REQUIRED"
| "ROTATION_AUTHORITY_REQUIRED"
| "REVOCATION_AUTHORITY_REQUIRED"
| "RESIDUAL_RISK_ACCEPTANCE_REQUIRED"
| "GOVERNANCE_POLICY_REQUIRED";

// ============================================================
// THREAT MODEL CONTRACT
// ============================================================

export interface CryptographicThreat {

threatId: string;

scenario:
CryptographicThreatScenario;

actor:
CryptographicThreatActor;

protectedAssets:
ProtectedCryptographicAsset[];

authorityRequirements:
CryptographicAuthorityRequirement[];

failClosedRequired:
boolean;

governanceEvidenceRequired:
boolean;

ledgerRecordRequired:
boolean;

residualRiskRequiresHumanAcceptance:
boolean;

summary:
string[];
}

// ============================================================
// CANONICAL THREAT MODEL
// ============================================================

export const CRYPTOGRAPHIC_THREAT_MODEL:
CryptographicThreat[] = [

// ----------------------------------------------------------
// CRYPTO_THREAT_001
// ----------------------------------------------------------

{
threatId:
"CRYPTO_THREAT_001",

scenario:
  "CROSS_TENANT_DECRYPTION",

actor:
  "MISSCOPED_OPERATOR",

protectedAssets: [
  "OPERATIONAL_DATA",
  "TENANT_BOUNDARY",
  "CRYPTOGRAPHIC_KEY",
  "AUTHORITY_GRAPH",
],

authorityRequirements: [
  "TENANT_AUTHORITY_REQUIRED",
  "KEY_OWNERSHIP_REQUIRED",
  "GOVERNANCE_POLICY_REQUIRED",
],

failClosedRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

residualRiskRequiresHumanAcceptance:
  false,

summary: [
  "cross_tenant_access_forbidden",
  "tenant_boundary_violation",
  "decryption_denied",
],

},

// ----------------------------------------------------------
// CRYPTO_THREAT_002
// ----------------------------------------------------------

{
threatId:
"CRYPTO_THREAT_002",

scenario:
  "UNAUTHORIZED_DECRYPTION",

actor:
  "INSIDER",

protectedAssets: [
  "OPERATIONAL_DATA",
  "SECRET",
  "CRYPTOGRAPHIC_KEY",
  "AUTHORITY_GRAPH",
],

authorityRequirements: [
  "KEY_OWNERSHIP_REQUIRED",
  "HUMAN_APPROVAL_REQUIRED",
],

failClosedRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

residualRiskRequiresHumanAcceptance:
  true,

summary: [
  "unauthorized_decryption_detected",
  "decryption_denied",
  "evidence_required",
],

},

// ----------------------------------------------------------
// CRYPTO_THREAT_003
// ----------------------------------------------------------

{
threatId:
"CRYPTO_THREAT_003",

scenario:
  "AI_ASSISTED_SECRET_DISCOVERY",

actor:
  "AI_SYSTEM",

protectedAssets: [
  "SECRET",
  "CRYPTOGRAPHIC_KEY",
  "CHARTER",
],

authorityRequirements: [
  "GOVERNANCE_POLICY_REQUIRED",
  "HUMAN_APPROVAL_REQUIRED",
],

failClosedRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

residualRiskRequiresHumanAcceptance:
  true,

summary: [
  "discovery_does_not_authorize_execution",
  "human_approval_required",
  "secret_access_governed",
],

},

// ----------------------------------------------------------
// CRYPTO_THREAT_004
// ----------------------------------------------------------

{
threatId:
"CRYPTO_THREAT_004",

scenario:
  "KEY_EXFILTRATION",

actor:
  "EXTERNAL_ATTACKER",

protectedAssets: [
  "CRYPTOGRAPHIC_KEY",
  "SECRET",
  "OPERATIONAL_DATA",
  "AUTHORITY_GRAPH",
],

authorityRequirements: [
  "REVOCATION_AUTHORITY_REQUIRED",
  "ROTATION_AUTHORITY_REQUIRED",
],

failClosedRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

residualRiskRequiresHumanAcceptance:
  true,

summary: [
  "key_compromise_detected",
  "rotation_required",
  "revocation_required",
],

},

// ----------------------------------------------------------
// CRYPTO_THREAT_005
// ----------------------------------------------------------

{
threatId:
"CRYPTO_THREAT_005",

scenario:
  "KEY_AUTHORITY_ESCALATION",

actor:
  "MISSCOPED_OPERATOR",

protectedAssets: [
  "OPERATIONAL_DATA",
  "DECISION_MEMORY",
  "EXECUTION_MEMORY",
  "CRYPTOGRAPHIC_KEY",
  "GOVERNANCE_EVIDENCE",
  "AUTHORITY_GRAPH",
  "CHARTER",
],

authorityRequirements: [
  "TENANT_AUTHORITY_REQUIRED",
  "GOVERNANCE_POLICY_REQUIRED",
  "KEY_OWNERSHIP_REQUIRED",
],

failClosedRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

residualRiskRequiresHumanAcceptance:
  false,

summary: [
  "key_authority_escalation_blocked",
  "key_access_does_not_grant_authority",
  "authority_reconstruction_required",
],

},

// ----------------------------------------------------------
// CRYPTO_THREAT_006
// ----------------------------------------------------------

{
  threatId:
    "CRYPTO_THREAT_006",

  scenario:
    "COMPROMISED_KMS",

  actor:
    "COMPROMISED_KMS_PROVIDER",

  protectedAssets: [
    "CRYPTOGRAPHIC_KEY",
    "SECRET",
    "OPERATIONAL_DATA",
    "BACKUP",
    "AUDIT_RECORD",
    "AUTHORITY_GRAPH",
  ],

  authorityRequirements: [
    "REVOCATION_AUTHORITY_REQUIRED",
    "ROTATION_AUTHORITY_REQUIRED",
    "RESIDUAL_RISK_ACCEPTANCE_REQUIRED",
    "HUMAN_APPROVAL_REQUIRED",
  ],

  failClosedRequired:
    true,

  governanceEvidenceRequired:
    true,

  ledgerRecordRequired:
    true,

  residualRiskRequiresHumanAcceptance:
    true,

  summary: [
    "kms_compromise_detected",
    "emergency_governance_required",
    "key_rotation_required",
    "key_revocation_required",
    "human_risk_acceptance_required",
  ],
},

// ----------------------------------------------------------
// CRYPTO_THREAT_007
// ----------------------------------------------------------

{
threatId:
"CRYPTO_THREAT_007",

scenario:
  "CRYPTOGRAPHIC_POLICY_BYPASS",

actor:
  "MISSCOPED_OPERATOR",

protectedAssets: [
  "CRYPTOGRAPHIC_KEY",
  "SECRET",
  "GOVERNANCE_EVIDENCE",
  "AUDIT_RECORD",
  "TENANT_BOUNDARY",
  "AUTHORITY_GRAPH",
  "CHARTER",
],

authorityRequirements: [
  "GOVERNANCE_POLICY_REQUIRED",
  "HUMAN_APPROVAL_REQUIRED",
  "KEY_OWNERSHIP_REQUIRED",
],

failClosedRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

residualRiskRequiresHumanAcceptance:
  false,

summary: [
  "cryptographic_governance_bypass_detected",
  "authority_chain_broken",
  "governance_reconstruction_required",
  "direct_cryptographic_action_forbidden",
],

},

];