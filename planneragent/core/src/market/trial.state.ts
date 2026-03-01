//planneragent/core/src/market/trial.state.ts

// =====================================================
// P7 — Trial State (Minimal, Canonical)
// Deterministic · No billing dependency · Audit-friendly
// =====================================================

export type TrialState = Readonly<{
  started_at_iso: string;
  expires_at_iso: string;
  trial_days: number;
}>;

/**
 * Create a trial state deterministically.
 * Source of truth: pricing / onboarding decision.
 */
export function startTrial(input: {
  started_at_iso: string;
  trial_days: number;
}): TrialState {
  const startMs = Date.parse(input.started_at_iso);
  const expiresMs =
    startMs + input.trial_days * 24 * 60 * 60 * 1000;

  return {
    started_at_iso: new Date(startMs).toISOString(),
    expires_at_iso: new Date(expiresMs).toISOString(),
    trial_days: input.trial_days,
  };
}

/**
 * Pure check — no side effects
 */
export function isTrialActive(
  trial: TrialState,
  now_iso: string
): boolean {
  return Date.parse(now_iso) < Date.parse(trial.expires_at_iso);
}
