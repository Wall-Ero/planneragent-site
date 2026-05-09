// core/src/identity/identity.validation.ts
// ======================================================
// PlannerAgent — Identity Validation
// Canonical Source of Truth
// ======================================================

import type {
  IdentitySessionV1
} from "./identity.types";

// ======================================================
// DECLARED AUTHORITY VALIDATION
// ======================================================

export function validateDeclaredAuthority(
  session: IdentitySessionV1
): {
  valid: boolean;
  reasons: string[];
} {

  const reasons: string[] = [];

  if (!session.authenticated) {
    reasons.push(
      "SESSION_NOT_AUTHENTICATED"
    );
  }

  if (!session.declared_role) {
    reasons.push(
      "ROLE_NOT_DECLARED"
    );
  }

  return {
    valid:
      reasons.length === 0,

    reasons
  };
}

// ======================================================
// AUTHORITY CLAIM VALIDATION
// ======================================================

export function validateAuthorityClaim(
  session: IdentitySessionV1
): {
  trusted: boolean;
  confidence: number;
  authority_state: string;
} {

  return {
    trusted:
      session.authority_state ===
      "VALIDATED",

    confidence:
      session.authority_confidence,

    authority_state:
      session.authority_state
  };
}