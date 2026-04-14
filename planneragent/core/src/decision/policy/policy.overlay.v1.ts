// core/src/decision/policy/policy.overlay.v1.ts
// ======================================================
// PlannerAgent — Policy Overlay V1
// Canonical Source of Truth
//
// Purpose
// - combine company policy with current manager decision style
// - preserve company baseline
// - allow local modulation without breaking governance
// ======================================================

import type { PolicyRules } from "./policy.schema.v1";
import type { ManagerBehaviorProfile } from "../manager.behavior";

export function overlayPolicyWithManagerBehavior(input: {
  basePolicy: PolicyRules;
  managerBehavior: ManagerBehaviorProfile;
}): PolicyRules {
  const { basePolicy, managerBehavior } = input;

  const out: PolicyRules = {
    ...basePolicy,
    weights: { ...basePolicy.weights },
  };

  // --------------------------------------------------
  // PRIORITY OVERLAY
  // --------------------------------------------------

  if (managerBehavior.priority === "SERVICE") {
    out.primary_focus = "SERVICE";
    out.weights = {
      service: 0.55,
      cost: 0.15,
      stability: 0.30,
    };
  } else if (managerBehavior.priority === "COST") {
    out.primary_focus = "COST";
    out.weights = {
      service: 0.20,
      cost: 0.55,
      stability: 0.25,
    };
  } else if (managerBehavior.priority === "STABILITY") {
    out.primary_focus = "STABILITY";
    out.weights = {
      service: 0.20,
      cost: 0.15,
      stability: 0.65,
    };
  }

  // --------------------------------------------------
  // MODE OVERLAY
  // --------------------------------------------------

  if (managerBehavior.mode === "SAFE") {
    out.prefer_multi_action = false;
    out.allow_single_lever = true;
    out.max_plan_churn = Math.min(out.max_plan_churn, 2);
    out.risk_profile = "CONSERVATIVE";
  }

  if (managerBehavior.mode === "AGGRESSIVE") {
    out.prefer_multi_action = true;
    out.allow_single_lever = false;
    out.max_plan_churn = Math.max(out.max_plan_churn, 4);
    out.risk_profile = "AGGRESSIVE";
  }

  // --------------------------------------------------
  // PRESSURE OVERLAY
  // --------------------------------------------------

  if (managerBehavior.pressure === "HIGH") {
    out.primary_focus = "SERVICE";
    out.weights = {
      service: Math.max(out.weights.service, 0.55),
      cost: Math.min(out.weights.cost, 0.15),
      stability: out.weights.stability,
    };
  }

  // --------------------------------------------------
  // HORIZON OVERLAY
  // --------------------------------------------------

  if (managerBehavior.horizon === "LONG_TERM") {
    out.primary_focus =
      out.primary_focus === "SERVICE" ? "STABILITY" : out.primary_focus;

    out.weights = {
      service: 0.20,
      cost: 0.20,
      stability: 0.60,
    };

    out.max_plan_churn = Math.min(out.max_plan_churn, 2);
  }

  return out;
}
