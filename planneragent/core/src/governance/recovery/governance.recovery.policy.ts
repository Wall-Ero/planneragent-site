// ============================================================
// PlannerAgent — Recovery Governance Policy
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/governance.recovery.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Recovery Governance
//
// PURPOSE
// ------------------------------------------------------------
// Govern authorization, scope, and legitimacy of
// recovery operations across operational,
// governance, and constitutional domains.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Recovery may restore systems.
// Recovery must never restore authority.
//
// Recovered data is not automatically
// authoritative data.
//
// Authority must always be reconstructed
// through governance.
//
// DOES NOT:
// - restore backups
// - restore databases
// - restore snapshots
// - execute recovery
// - perform infrastructure recovery
// - perform cryptography
//
// DOES:
// - govern recovery authorization
// - classify recovery domains
// - define recovery restrictions
// - define approval requirements
// - define evidence requirements
// - define ledger requirements
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define which recovery operations are
// permitted, prohibited, or require
// governance approval.
//
// ============================================================

// ============================================================
// RECOVERY DOMAIN
// ============================================================

export type RecoveryDomain =
| "TECHNICAL_SNAPSHOT"
| "OPERATIONAL_SNAPSHOT"
| "DECISION_MEMORY"
| "EXECUTION_MEMORY"
| "COGNITION_SYNTHESIS"
| "AUDIT_LEDGER"
| "GOVERNANCE"
| "OAG"
| "CHARTER";

// ============================================================
// RECOVERY CLASSIFICATION
// ============================================================

export type RecoveryClassification =
| "OPERATIONAL"
| "GOVERNANCE"
| "CONSTITUTIONAL";

// ============================================================
// RECOVERY POLICY
// ============================================================

export interface RecoveryPolicy {

domain:
RecoveryDomain;

classification:
RecoveryClassification;

recovery_allowed:
boolean;

human_approval_required:
boolean;

governance_evidence_required:
boolean;

ledger_record_required:
boolean;

authority_reconstruction_required:
boolean;

recovered_data_authoritative:
boolean;

summary: string[];

}

// ============================================================
// POLICY TABLE
// ============================================================

export const RECOVERY_POLICIES: Record<
  RecoveryDomain,
  RecoveryPolicy
> = {

TECHNICAL_SNAPSHOT: {

domain:
  "TECHNICAL_SNAPSHOT",

classification:
  "OPERATIONAL",

recovery_allowed:
  true,

human_approval_required:
  false,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  false,

recovered_data_authoritative:
  true,

summary: [
  "technical_snapshot_recovery_allowed",
],

},

OPERATIONAL_SNAPSHOT: {

domain:
  "OPERATIONAL_SNAPSHOT",

classification:
  "OPERATIONAL",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  false,

recovered_data_authoritative:
  false,

summary: [
  "operational_snapshot_recovery",
  "reality_revalidation_required",
],

},

DECISION_MEMORY: {

domain:
  "DECISION_MEMORY",

classification:
  "OPERATIONAL",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  false,

recovered_data_authoritative:
  false,

summary: [
  "decision_memory_recovery",
  "approval_required",
],

},

EXECUTION_MEMORY: {

domain:
  "EXECUTION_MEMORY",

classification:
  "OPERATIONAL",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  false,

recovered_data_authoritative:
  false,

summary: [
  "execution_memory_recovery",
  "approval_required",
],

},

COGNITION_SYNTHESIS: {

domain:
  "COGNITION_SYNTHESIS",

classification:
  "OPERATIONAL",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  false,

recovered_data_authoritative:
  false,

summary: [
  "cognition_recovery",
  "approval_required",
],

},

AUDIT_LEDGER: {

domain:
  "AUDIT_LEDGER",

classification:
  "GOVERNANCE",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  false,

recovered_data_authoritative:
  false,

summary: [
  "audit_ledger_recovery",
  "governed_operation",
],

},

GOVERNANCE: {

domain:
  "GOVERNANCE",

classification:
  "GOVERNANCE",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  true,

recovered_data_authoritative:
  false,

summary: [
  "governance_recovery",
  "authority_reconstruction_required",
],

},

OAG: {

domain:
  "OAG",

classification:
  "CONSTITUTIONAL",

recovery_allowed:
  true,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  true,

recovered_data_authoritative:
  false,

summary: [
  "oag_recovery",
  "authority_reconstruction_required",
],

},

CHARTER: {

domain:
  "CHARTER",

classification:
  "CONSTITUTIONAL",

recovery_allowed:
  false,

human_approval_required:
  true,

governance_evidence_required:
  true,

ledger_record_required:
  true,

authority_reconstruction_required:
  true,

recovered_data_authoritative:
  false,

summary: [
  "charter_recovery_forbidden",
  "constitutional_protection",
],

},

};

// ============================================================
// RESOLVE POLICY
// ============================================================

export function getRecoveryPolicy(
domain: RecoveryDomain
): RecoveryPolicy {

return RECOVERY_POLICIES[
domain
];

}