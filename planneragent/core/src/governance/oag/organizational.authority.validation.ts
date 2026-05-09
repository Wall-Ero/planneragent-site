// core/src/governance/oag/organizational.authority.validation.ts
// ======================================================
// Organizational Authority Validation
// Canonical Source of Truth
// ======================================================

import type {
  OrganizationalAuthorityLink
} from "./organizational.authority.link";

export interface OrganizationalAuthorityValidationResult {

  valid: boolean;

  confidence: number;

  reconstructed: boolean;

  reasons: string[];
}

export function validateOrganizationalAuthorityLink(
  link: OrganizationalAuthorityLink
): OrganizationalAuthorityValidationResult {

  const reasons: string[] = [];

  let confidence =
    link.authority_confidence;

  // --------------------------------------------------
  // RECIPROCAL CONFIRMATION
  // --------------------------------------------------

  if (link.reciprocal_confirmation) {
    confidence += 0.2;

    reasons.push(
      "RECIPROCAL_CONFIRMATION"
    );
  }

  // --------------------------------------------------
  // VALIDATED STATE
  // --------------------------------------------------

  if (
  link.validation_state ===
  "VALIDATED"
) {
  confidence += 0.2;

    reasons.push(
      "VALIDATED_STATE"
    );
  }

  // --------------------------------------------------
  // EXECUTION DELEGATION
  // --------------------------------------------------

  if (link.delegated_execution) {
    confidence += 0.1;

    reasons.push(
      "EXECUTION_SCOPE"
    );
  }

  // --------------------------------------------------
  // BUDGET AUTHORITY
  // --------------------------------------------------

  if (link.delegated_budget) {
    confidence += 0.15;

    reasons.push(
      "BUDGET_SCOPE"
    );
  }

  // --------------------------------------------------
  // CLAMP
  // --------------------------------------------------

  confidence =
    Math.min(1, confidence);

  return {

    valid:
      confidence >= 0.5,

    reconstructed:
      confidence >= 0.8,

    confidence,

    reasons
  };
}