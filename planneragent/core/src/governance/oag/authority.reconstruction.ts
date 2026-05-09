// core/src/governance/oag/authority.reconstruction.ts

// ======================================================
// OAG — Organizational Authority Reconstruction
// Canonical Source of Truth
// ======================================================

import type {
  AuthoritySignal
} from "./authority.signals";

import {
  computeAuthorityConfidence
} from "./authority.confidence";

export type AuthorityReconstructionInput = {
  authenticated: boolean;

  declared_role?: string;

  declared_supervisor?: string;

  sponsored?: boolean;

  reciprocal_confirmation?: boolean;

  erp_scope_match?: boolean;

  execution_alignment?: boolean;

  team_alignment?: boolean;

  budget_alignment?: boolean;

  api_scope_match?: boolean;
};

export type AuthorityReconstructionResult = {
  authority_state:
    | "UNDECLARED"
    | "DECLARED"
    | "RECONSTRUCTED"
    | "VALIDATED";

  organizational_confidence: number;

  authority_signals: AuthoritySignal[];
};

export function reconstructOrganizationalAuthority(
  input: AuthorityReconstructionInput
): AuthorityReconstructionResult {

  const signals: AuthoritySignal[] = [];

  // --------------------------------------------------
  // IDENTITY
  // --------------------------------------------------

  if (input.authenticated) {
    signals.push("AUTHENTICATED_IDENTITY");
  }

  // --------------------------------------------------
  // DECLARATION
  // --------------------------------------------------

  if (input.declared_role) {
    signals.push("DECLARED_ROLE");
  }

  if (input.declared_supervisor) {
    signals.push("DECLARED_SUPERVISOR");
  }

  // --------------------------------------------------
  // ORGANIZATIONAL VALIDATION
  // --------------------------------------------------

  if (input.sponsored) {
    signals.push("SPONSORED");
  }

  if (input.reciprocal_confirmation) {
    signals.push("RECIPROCAL_CONFIRMATION");
  }

  // --------------------------------------------------
  // OPERATIONAL ALIGNMENT
  // --------------------------------------------------

  if (input.erp_scope_match) {
    signals.push("ERP_SCOPE_MATCH");
  }

  if (input.execution_alignment) {
    signals.push("EXECUTION_ALIGNMENT");
  }

  if (input.team_alignment) {
    signals.push("TEAM_ALIGNMENT");
  }

  if (input.budget_alignment) {
    signals.push("BUDGET_ALIGNMENT");
  }

  if (input.api_scope_match) {
    signals.push("API_SCOPE_MATCH");
  }

  // --------------------------------------------------
  // CONFIDENCE
  // --------------------------------------------------

  const resolved =
    computeAuthorityConfidence({
      signals
    });

  return {
    authority_state: resolved.state,

    organizational_confidence:
      resolved.confidence,

    authority_signals: signals
  };
}
