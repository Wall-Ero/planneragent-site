//core/src/governance/oag/authority.signals.ts

// ======================================================
// OAG — Organizational Authority Signals
// Canonical Source of Truth
// ======================================================

export type AuthoritySignal =
  | "AUTHENTICATED_IDENTITY"
  | "DECLARED_ROLE"
  | "DECLARED_SUPERVISOR"
  | "SPONSORED"
  | "RECIPROCAL_CONFIRMATION"
  | "ERP_SCOPE_MATCH"
  | "EXECUTION_ALIGNMENT"
  | "TEAM_ALIGNMENT"
  | "BUDGET_ALIGNMENT"
  | "API_SCOPE_MATCH";

export type AuthoritySignalWeights = {
  [K in AuthoritySignal]: number;
};

export const DEFAULT_AUTHORITY_SIGNAL_WEIGHTS: AuthoritySignalWeights = {
  AUTHENTICATED_IDENTITY: 0.1,

DECLARED_ROLE: 0.1,
DECLARED_SUPERVISOR: 0.05,

SPONSORED: 0.15,
RECIPROCAL_CONFIRMATION: 0.15,

ERP_SCOPE_MATCH: 0.15,
EXECUTION_ALIGNMENT: 0.15,

TEAM_ALIGNMENT: 0.1,
BUDGET_ALIGNMENT: 0.025,
API_SCOPE_MATCH: 0.025

};