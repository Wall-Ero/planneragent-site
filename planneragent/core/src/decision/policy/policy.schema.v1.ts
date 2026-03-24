// core/src/decision/policy/policy.schema.v1.ts

export type PolicyFocus =
  | "SERVICE"
  | "COST"
  | "STABILITY";

export type PolicyRiskProfile =
  | "CONSERVATIVE"
  | "BALANCED"
  | "AGGRESSIVE";

export interface PolicyRules {

  primary_focus: PolicyFocus;

  weights: {
    service: number;
    cost: number;
    stability: number;
  };

  prefer_multi_action: boolean;
  allow_single_lever: boolean;

  max_plan_churn: number;

  risk_profile: PolicyRiskProfile;
}

export const DEFAULT_POLICY: PolicyRules = {
  primary_focus: "SERVICE",

  weights: {
    service: 0.5,
    cost: 0.2,
    stability: 0.3
  },

  prefer_multi_action: true,
  allow_single_lever: false,

  max_plan_churn: 3,

  risk_profile: "BALANCED"
};