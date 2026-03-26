// core/src/decision/policy/policy.resolver.v1.ts
// ======================================================
// PlannerAgent — Policy Resolver V1
// Canonical Source of Truth
//
// Purpose
// - resolve the effective policy used by PlannerAgent
// - combine default policy with historical inference
// - filter unsafe / corrected / anomalous history first
//
// Security posture
// - never infer policy from corrected decisions
// - never infer policy from anomalous decisions
// - fallback safely to DEFAULT_POLICY when history is weak
// ======================================================

import type { PolicyRules } from "./policy.schema.v1";
import { DEFAULT_POLICY } from "./policy.schema.v1";

// ======================================================
// TYPES
// ======================================================

export type HistoricalPolicySignal = {
  primary_focus?: PolicyRules["primary_focus"];
  prefer_multi_action?: boolean;
  allow_single_lever?: boolean;
  max_plan_churn?: number;
  risk_profile?: PolicyRules["risk_profile"];
};

export type PolicyHistoryRecord = {
  decision_id?: string;
  source?: "PRE_EXISTING_HISTORY" | "PLANNERAGENT" | "MIGRATED";

  // whether this decision should be trusted for inference
  outcome?: "SUCCESS" | "FAIL" | "CORRECTED";
  anomaly?: boolean;

  // policy-like signal extracted from historical behavior
  signal?: HistoricalPolicySignal | null;
};

export type ResolvePolicyInput = {
  history?: PolicyHistoryRecord[];
};

// ======================================================
// PUBLIC API
// ======================================================

export function resolvePolicy(
  input: ResolvePolicyInput
): PolicyRules {
  const rawHistory = input.history ?? [];

  const trustedHistory = filterTrustedHistory(rawHistory);

  if (trustedHistory.length === 0) {
    return DEFAULT_POLICY;
  }

  const inferred = inferPolicyFromTrustedHistory(trustedHistory);

  return mergePolicy(DEFAULT_POLICY, inferred);
}

// ======================================================
// TRUST FILTER
// ======================================================

function filterTrustedHistory(
  history: PolicyHistoryRecord[]
): PolicyHistoryRecord[] {
  return history.filter((row) => {
    if (!row) return false;

    if (row.outcome !== "SUCCESS") return false;
    if (row.anomaly === true) return false;
    if (!row.signal) return false;

    return true;
  });
}

// ======================================================
// INFERENCE
// ======================================================

function inferPolicyFromTrustedHistory(
  history: PolicyHistoryRecord[]
): Partial<PolicyRules> {
  const focusCounts: Record<PolicyRules["primary_focus"], number> = {
    SERVICE: 0,
    COST: 0,
    STABILITY: 0,
  };

  const riskCounts: Record<PolicyRules["risk_profile"], number> = {
    CONSERVATIVE: 0,
    BALANCED: 0,
    AGGRESSIVE: 0,
  };

  let preferMultiActionTrue = 0;
  let preferMultiActionFalse = 0;

  let allowSingleLeverTrue = 0;
  let allowSingleLeverFalse = 0;

  let churnSamples: number[] = [];

  for (const row of history) {
    const signal = row.signal;
    if (!signal) continue;

    if (signal.primary_focus) {
      focusCounts[signal.primary_focus] += 1;
    }

    if (signal.risk_profile) {
      riskCounts[signal.risk_profile] += 1;
    }

    if (typeof signal.prefer_multi_action === "boolean") {
      if (signal.prefer_multi_action) preferMultiActionTrue += 1;
      else preferMultiActionFalse += 1;
    }

    if (typeof signal.allow_single_lever === "boolean") {
      if (signal.allow_single_lever) allowSingleLeverTrue += 1;
      else allowSingleLeverFalse += 1;
    }

    if (
      typeof signal.max_plan_churn === "number" &&
      Number.isFinite(signal.max_plan_churn)
    ) {
      churnSamples.push(clamp(signal.max_plan_churn, 1, 20));
    }
  }

  const primary_focus = dominantKey(focusCounts);
  const risk_profile = dominantKey(riskCounts);

  const prefer_multi_action =
    preferMultiActionTrue + preferMultiActionFalse === 0
      ? undefined
      : preferMultiActionTrue >= preferMultiActionFalse;

  const allow_single_lever =
    allowSingleLeverTrue + allowSingleLeverFalse === 0
      ? undefined
      : allowSingleLeverTrue > allowSingleLeverFalse;

  const max_plan_churn =
    churnSamples.length > 0
      ? round1(avg(churnSamples))
      : undefined;

  const weights = deriveWeightsFromPrimaryFocus(primary_focus);

  return compactPolicy({
    primary_focus,
    weights,
    prefer_multi_action,
    allow_single_lever,
    max_plan_churn,
    risk_profile,
  });
}

// ======================================================
// WEIGHT DERIVATION
// ======================================================

function deriveWeightsFromPrimaryFocus(
  focus?: PolicyRules["primary_focus"]
): PolicyRules["weights"] | undefined {
  if (!focus) return undefined;

  if (focus === "SERVICE") {
    return {
      service: 0.5,
      cost: 0.2,
      stability: 0.3,
    };
  }

  if (focus === "COST") {
    return {
      service: 0.2,
      cost: 0.5,
      stability: 0.3,
    };
  }

  return {
    service: 0.25,
    cost: 0.2,
    stability: 0.55,
  };
}

// ======================================================
// MERGE
// ======================================================

function mergePolicy(
  base: PolicyRules,
  inferred: Partial<PolicyRules>
): PolicyRules {
  return {
    ...base,
    ...inferred,
    weights: {
      ...base.weights,
      ...(inferred.weights ?? {}),
    },
  };
}

// ======================================================
// HELPERS
// ======================================================

function dominantKey<T extends string>(
  counts: Record<T, number>
): T | undefined {
  let bestKey: T | undefined = undefined;
  let bestValue = -1;

  for (const [key, value] of Object.entries(counts) as Array<[T, number]>) {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  }

  return bestValue > 0 ? bestKey : undefined;
}

function compactPolicy(
  input: Partial<PolicyRules>
): Partial<PolicyRules> {
  const out: Partial<PolicyRules> = {};

  if (input.primary_focus) out.primary_focus = input.primary_focus;
  if (input.weights) out.weights = input.weights;
  if (typeof input.prefer_multi_action === "boolean") {
    out.prefer_multi_action = input.prefer_multi_action;
  }
  if (typeof input.allow_single_lever === "boolean") {
    out.allow_single_lever = input.allow_single_lever;
  }
  if (
    typeof input.max_plan_churn === "number" &&
    Number.isFinite(input.max_plan_churn)
  ) {
    out.max_plan_churn = input.max_plan_churn;
  }
  if (input.risk_profile) out.risk_profile = input.risk_profile;

  return out;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}