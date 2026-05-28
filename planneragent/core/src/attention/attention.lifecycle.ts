// core/src/attention/attention.lifecycle.ts
// ============================================================
// PlannerAgent — Attention Lifecycle Engine
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Determine whether human-directed attention is still valid,
// stale, resolved, or obsolete against observed reality.
//
// DOES NOT:
// - execute actions
// - authorize decisions
// - mutate governance
// - send notifications
//
// DOES:
// - detect stale attention
// - detect obsolete attention
// - detect resolved attention
// - preserve attention cleanliness
//
// ============================================================

import type {
  AttentionSubscription,
  AttentionStatus,
} from "./attention.types";

export type AttentionRealityPresence =
  | "PRESENT"
  | "WEAK"
  | "MISSING";

export type AttentionLifecycleState =
  | "ACTIVE"
  | "STALE"
  | "RESOLVED"
  | "OBSOLETE"
  | "EXPIRED"
  | "DISABLED";

export interface AttentionLifecycleEvaluation {
  attention_id: string;
  status: AttentionStatus;
  lifecycleState: AttentionLifecycleState;
  realityPresence: AttentionRealityPresence;
  cancellable: boolean;
  humanReviewRequired: boolean;
  reason: string;
  summary: string[];
}

export function evaluateAttentionLifecycle(params: {
  subscription: AttentionSubscription;
  now_iso: string;
  observedTargets?: string[];
  resolvedTargets?: string[];
  staleAfterHours?: number;
}): AttentionLifecycleEvaluation {

  const {
    subscription,
    now_iso,
    observedTargets = [],
    resolvedTargets = [],
    staleAfterHours = 24,
  } = params;

  if (subscription.status === "DISABLED") {
    return result(subscription, "DISABLED", "PRESENT", false, false, "Attention manually disabled.");
  }

  if (subscription.status === "EXPIRED") {
    return result(subscription, "EXPIRED", "WEAK", true, false, "Attention expired.");
  }

  if (
    subscription.expires_at &&
    subscription.expires_at <= now_iso
  ) {
    return result(subscription, "EXPIRED", "WEAK", true, false, "Attention passed its expiration time.");
  }

  const target =
    subscription.target_ref;

  if (
    target &&
    resolvedTargets.includes(target)
  ) {
    return result(subscription, "RESOLVED", "PRESENT", true, false, "Watched operational target has been resolved.");
  }

  if (
    target &&
    observedTargets.length > 0 &&
    !observedTargets.includes(target)
  ) {
    return result(subscription, "OBSOLETE", "MISSING", true, false, "Watched operational target is no longer present in observed reality.");
  }

  const lastTouch =
    subscription.last_checked_at ??
    subscription.updated_at ??
    subscription.created_at;

  const ageHours =
    hoursBetween(lastTouch, now_iso);

  if (ageHours >= staleAfterHours) {
    return result(subscription, "STALE", "WEAK", false, true, "Attention has not been refreshed recently.");
  }

  return result(subscription, "ACTIVE", "PRESENT", false, false, "Attention remains valid in observed reality.");
}

function result(
  subscription: AttentionSubscription,
  lifecycleState: AttentionLifecycleState,
  realityPresence: AttentionRealityPresence,
  cancellable: boolean,
  humanReviewRequired: boolean,
  reason: string
): AttentionLifecycleEvaluation {

  return {
    attention_id: subscription.attention_id,
    status: subscription.status,
    lifecycleState,
    realityPresence,
    cancellable,
    humanReviewRequired,
    reason,
    summary: [
      `lifecycle:${lifecycleState}`,
      `presence:${realityPresence}`,
      cancellable ? "attention_cancellable" : "attention_retained",
      humanReviewRequired ? "human_refresh_required" : "no_human_refresh_required",
    ],
  };
}

function hoursBetween(
  from_iso: string,
  to_iso: string
): number {

  const from =
    new Date(from_iso).getTime();

  const to =
    new Date(to_iso).getTime();

  if (
    Number.isNaN(from) ||
    Number.isNaN(to)
  ) {
    return 0;
  }

  return Math.max(
    0,
    (to - from) / 36e5
  );
}