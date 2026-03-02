//core/src/governance/principal.contract.v1.ts

export type PrincipalDecisionType =
  | "ALLOCATE_BUDGET"
  | "REALLOCATE_BUDGET"
  | "SET_CAP"
  | "AUTHORIZE_ESCALATION"
  | "REVOKE_ESCALATION"
  | "ADJUST_WINDOW"
  | "FREEZE_SPENDING";

export type PrincipalResponseV1 = {
  authority: "PRINCIPAL";

  decision_id: string;
  created_at: string;

  decision_type: PrincipalDecisionType;

  rationale: string;           // deterministic evidence-based explanation
  evidence: Record<string, unknown>;

  financial_effect: {
    previous_cap_eur: number;
    new_cap_eur: number;
    delta_eur: number;
  };

  window: {
    previous_reset_at: string;
    new_reset_at: string;
  };

  escalation: {
    previous_level: "BASIC" | "JUNIOR" | "SENIOR";
    new_level?: "JUNIOR" | "SENIOR";
  };

  execution_allowed: true;      // always true for PRINCIPAL
};