// core/src/identity/identity.confidence.ts
// ======================================================
// PlannerAgent — Organizational Authority Confidence
// Canonical Source of Truth
// ======================================================

import type {
  IdentitySessionV1,
  OrganizationalAuthorityConfidence
} from "./identity.types";

// ======================================================
// RESOLVE CONFIDENCE LEVEL
// ======================================================

export function resolveAuthorityConfidenceLevel(
  session: IdentitySessionV1
): OrganizationalAuthorityConfidence {

  const score =
    session.authority_confidence ?? 0;

  if (score <= 0) {
    return "NONE";
  }

  if (score < 0.4) {
    return "LOW";
  }

  if (score < 0.7) {
    return "PARTIAL";
  }

  if (score < 0.9) {
    return "HIGH";
  }

  return "TRUSTED";
}

// ======================================================
// BUILD AUTHORITY SIGNALS
// ======================================================

export function buildAuthoritySignals(
  session: IdentitySessionV1
): string[] {

  const signals: string[] = [];

  if (session.authenticated) {
    signals.push(
      "AUTHENTICATED_IDENTITY"
    );
  }

  if (session.declared_role) {
    signals.push(
      "DECLARED_ROLE"
    );
  }

  if (session.declared_supervisor) {
    signals.push(
      "DECLARED_SUPERVISOR"
    );
  }

  if (
    session.authority_state ===
    "PARTIALLY_VALIDATED"
  ) {
    signals.push(
      "PARTIAL_VALIDATION"
    );
  }

  if (
    session.authority_state ===
    "VALIDATED"
  ) {
    signals.push(
      "VALIDATED_AUTHORITY"
    );
  }

  return signals;
}

// ======================================================
// ENRICH SESSION
// ======================================================

export function enrichAuthorityConfidence(
  session: IdentitySessionV1
): IdentitySessionV1 {

  return {
    ...session,

    organizational_confidence:
      resolveAuthorityConfidenceLevel(
        session
      ),

    authority_signals:
      buildAuthoritySignals(
        session
      )
  };
}