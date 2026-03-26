// core/src/decision-memory/decision.memory.ts
// ======================================================
// PlannerAgent — Decision Memory V1
// Canonical Source of Truth
//
// Purpose
// - store decision history for policy learning
// - expose safe, filtered signals to resolvePolicy
//
// Architecture
// - in-memory implementation (temporary)
// - replaceable via decision.memory.bridge.ts (D1, KV, etc.)
//
// Security posture
// - stores only policy signal (NOT raw operational data)
// - anomaly + outcome flags used to filter learning
// - no direct coupling with decision logic
// ======================================================

import type { PolicyRules } from "../decision/policy/policy.schema.v1";
import type { PolicyHistoryRecord } from "../decision/policy/policy.resolver.v1";

// ======================================================
// STORAGE (TEMP — in-memory)
// ======================================================

const MEMORY: PolicyHistoryRecord[] = [];

// ======================================================
// PUBLIC API
// ======================================================

export function recordDecision(input: {
  decision_id: string;
  policy_used: PolicyRules;
  outcome: "SUCCESS" | "FAIL" | "CORRECTED";
  anomaly?: boolean;
}) {
  if (!input?.decision_id) return;

  MEMORY.push({
    decision_id: input.decision_id,
    source: "PLANNERAGENT",
    outcome: input.outcome,
    anomaly: input.anomaly ?? false,
    signal: extractSignal(input.policy_used),
  });
}

export function getDecisionHistory(): PolicyHistoryRecord[] {
  return MEMORY;
}

// ======================================================
// SIGNAL EXTRACTION
// ======================================================

function extractSignal(policy: PolicyRules) {
  return {
    primary_focus: policy.primary_focus,
    prefer_multi_action: policy.prefer_multi_action,
    allow_single_lever: policy.allow_single_lever,
    max_plan_churn: policy.max_plan_churn,
    risk_profile: policy.risk_profile,
  };
}