// Governance Policy Types v1
// Status: ACTIVE · CANONICAL
// Policy is DATA (versioned) and must be signable/immutable once deployed.

export type ISODate = string;

export type LegalEntity = "PERSON" | "SRL";

export type AuthorityMode = "OBSERVATION" | "REVIEW" | "ACTIVE" | "LOCKED";
export type AuthorityScope = "READ_ONLY" | "LIMITED" | "BUDGETED" | "NONE";
export type ExecutionState = "DISABLED" | "PENDING" | "ENABLED" | "BLOCKED";

export type Layer = "BASIC" | "JUNIOR" | "SENIOR" | "SSC" | "AGI";

export type EnforcementResult = "ALLOWED" | "BLOCKED" | "ESCALATED";

export type RuleSeverity = "INFO" | "WARNING" | "CRITICAL" | "SYSTEM";

export type EventType =
  | "AUTHORITY_STATE_VIEWED"
  | "ACTION_BLOCKED_BY_POLICY"
  | "REQUEST_EXECUTION_SCOPE"
  | "REQUEST_BUDGETED_AUTHORITY"
  | "DECISION_PROPOSED"
  | "DECISION_APPROVED"
  | "DECISION_DELEGATED"
  | "LEGAL_EXECUTION_BLOCKED"
  | "LEGAL_ENTITY_SWITCHED"
  | "ORD_GATE_EVALUATED"
  | "BUDGET_GUARDRAIL_TRIGGERED"
  | "SYSTEM_LOCKED"
  | "SYSTEM_UNLOCKED"
  | "AGI_DECISION_REQUESTED"
  | "AGI_DECISION_BLOCKED";

export interface PolicySignatureMetaV1 {
  policy_id: string;            // stable id
  version: "v1";
  created_at: ISODate;
  created_by: "FOUNDER" | "SYSTEM";
  change_note: string;          // human-readable reason
}

export interface AuthorityStateV1 {
  mode: AuthorityMode;
  scope: AuthorityScope;
  execution: ExecutionState;
  responsibility: "HUMAN";
}

export interface PolicyRuleV1 {
  rule_id: string;              // stable, referenced by UI_events & audit
  title: string;
  severity: RuleSeverity;

  // Declarative condition set (kept simple by design)
  when: {
    legal_entity?: LegalEntity[];
    layer?: Layer[];
    authority_mode?: AuthorityMode[];
    authority_scope?: AuthorityScope[];
    execution_state?: ExecutionState[];
    event_type?: EventType[];
  };

  then: {
    enforcement: EnforcementResult;

    // Optional state mutations (only for system state transitions)
    set_authority_state?: Partial<AuthorityStateV1>;

    // Optional event emission on enforcement (e.g., LEGAL_EXECUTION_BLOCKED)
    emit_event_type?: EventType;

    // Optional human escalation target
    escalate_to?: ("FOUNDER" | "CFO" | "LEGAL" | "SECURITY")[];

    // Optional user-visible reason key (UI uses mapping table)
    ui_reason_key?:
      | "ACTION_BLOCKED_BY_POLICY"
      | "AUTHORITY_SCOPE_EXCEEDED"
      | "BUDGET_GUARDRAIL_TRIGGERED"
      | "LEGAL_EXECUTION_LOCK_ACTIVE";
  };
}

export interface OrdPolicyV1 {
  enabled: boolean;

  // ORD only applies to paid / marginal-cost resources
  applies_to: {
    paid_llm: boolean;          // must be true for v1
    oss_llm: boolean;           // must be false for v1 (explicit)
    deterministic_core: boolean;// must be false
  };

  // per-tenant caps (governance), not revenue
  cost_caps: {
    daily_usd: number;
    monthly_usd: number;
  };

  // gating logic
  rules: {
    require_reason: boolean;    // must provide why cost is justified
    allow_exploration: boolean; // allow paid exploration within cap
    default_provider_fallback: "OSS" | "NONE"; // when paid blocked
  };
}

export interface BudgetGuardrailsV1 {
  enabled: boolean;

  // applies to SSC-like budgeted decisions (governance)
  caps: {
    monthly_decision_budget: number; // e.g. 100000 = €100k equivalent unit (currency-agnostic)
  };

  on_breach: {
    block_execution: boolean;         // must be true
    emit_event: "BUDGET_GUARDRAIL_TRIGGERED";
    escalate_to: ("FOUNDER" | "CFO")[];
    degrade_to_layer: "SENIOR";       // canonical: SSC -> SENIOR
  };
}

export interface LegalGatesV1 {
  // Hard rule: if not SRL -> execution is blocked
  pre_srl_hard_rule: {
    if_legal_entity_not: "SRL";
    then: {
      SENIOR_enabled: false;
      SSC_enabled: false;
      AGI_enabled: false;
      execution_blocked: true;
      emit_event: "LEGAL_EXECUTION_BLOCKED";
    };
  };
}

export interface GovernancePolicyV1 {
  meta: PolicySignatureMetaV1;

  // Default UI authority state per layer
  defaults: {
    per_layer_authority_state: Record<Layer, AuthorityStateV1>;
  };

  legal_gates: LegalGatesV1;

  ord: OrdPolicyV1;

  budget_guardrails: BudgetGuardrailsV1;

  // Rules are evaluated in order. First match wins.
  rules: PolicyRuleV1[];
}
