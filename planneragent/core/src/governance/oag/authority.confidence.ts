// core/src/governance/oag/authority.confidence.ts

// ======================================================
// OAG — Organizational Authority Confidence
// Canonical Source of Truth
// ======================================================

import type { AuthoritySignal } from "./authority.signals";

import {
  DEFAULT_AUTHORITY_SIGNAL_WEIGHTS
} from "./authority.signals";

export type AuthorityConfidenceInput = {
  signals: AuthoritySignal[];
};

export type AuthorityConfidenceResult = {
  confidence: number;

  state:
    | "UNDECLARED"
    | "DECLARED"
    | "RECONSTRUCTED"
    | "VALIDATED";
};

export function computeAuthorityConfidence(
  input: AuthorityConfidenceInput
): AuthorityConfidenceResult {

  const uniqueSignals = [...new Set(input.signals)];

  let confidence = 0;

  for (const signal of uniqueSignals) {
    confidence +=
      DEFAULT_AUTHORITY_SIGNAL_WEIGHTS[signal] ?? 0;
  }

  confidence = Math.min(
    1,
    Number(confidence.toFixed(3))
  );

  // --------------------------------------------------
  // STATE RESOLUTION
  // --------------------------------------------------

  let state:
    | "UNDECLARED"
    | "DECLARED"
    | "RECONSTRUCTED"
    | "VALIDATED";

  if (confidence <= 0.15) {
  state = "UNDECLARED";
} else if (confidence <= 0.45) {
  state = "DECLARED";
} else if (confidence <= 0.85) {
  state = "RECONSTRUCTED";
} else {
  state = "VALIDATED";
}

  return {
    confidence,
    state
  };
}
