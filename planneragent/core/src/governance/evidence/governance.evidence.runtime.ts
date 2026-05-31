// core/src/governance/evidence/governance.evidence.runtime.ts
// ============================================================
// PlannerAgent — Governance Evidence Runtime
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/evidence/governance.evidence.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Evidence
//
// PURPOSE
// ------------------------------------------------------------
// Translate runtime governance decisions into
// governance evidence records.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Runtime governance decisions become auditable
// governance evidence before persistence,
// immutability, or cryptographic protection.
//
// DOES NOT:
// - evaluate policy
// - enforce policy
// - persist evidence
// - write to ledger
// - create immutable records
// - perform cryptography
//
// DOES:
// - translate runtime governance outcomes
// - normalize governance decisions
// - create governance evidence records
// - classify runtime governance actions
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Transform runtime governance outcomes into
// canonical governance evidence.
//
// ============================================================

import {
buildGovernanceEvidence,
} from "./governance.evidence.builder";

import type {
GovernanceEvidenceAction,
GovernanceEvidenceRecord,
GovernanceEvidenceSeverity,
GovernanceEvidenceSource,
} from "./governance.evidence.types";

// ============================================================
// INPUT
// ============================================================

export interface GovernanceRuntimeEvent {

source:
GovernanceEvidenceSource;

allowed: boolean;

tenant_id?: string;

domain?: string;

severity:
  | "NONE"
  | "LOW"
  | "HIGH"
  | "CRITICAL";

reason: string;

summary?: string[];
}

// ============================================================
// MAIN
// ============================================================

export function createRuntimeGovernanceEvidence(
event: GovernanceRuntimeEvent
): GovernanceEvidenceRecord {

return buildGovernanceEvidence({

evidence_id:
  crypto.randomUUID(),

source:
  event.source,

action:
  resolveAction(
    event.allowed
  ),

tenant_id:
  event.tenant_id,

domain:
  event.domain,

severity:
  normalizeSeverity(
    event.severity
  ),

reason:
  event.reason,

summary:
  event.summary ?? [],

created_at:
  new Date()
    .toISOString(),

});

}

// ============================================================
// ACTION RESOLUTION
// ============================================================

function resolveAction(
allowed: boolean
): GovernanceEvidenceAction {

if (allowed) {
return "ALLOW";
}

return "DENY";

}

function normalizeSeverity(
  severity:
    "NONE"
    | "LOW"
    | "HIGH"
    | "CRITICAL"
): GovernanceEvidenceSeverity {

  switch (severity) {

    case "HIGH":
      return "HIGH";

    case "CRITICAL":
      return "CRITICAL";

    default:
      return "LOW";
  }
}