// Policy Loader + Validator v1
// Status: ACTIVE · CANONICAL
// Role: Load, validate, freeze and evaluate governance policy as DATA (not logic)

import type {
  GovernancePolicyV1,
  PolicyRuleV1,
  EnforcementResult,
  EventType,
  Layer,
  LegalEntity,
  AuthorityMode,
  AuthorityScope,
  ExecutionState
} from "./governance.policy.types.v1";

// -----------------------------
// Types
// -----------------------------

export interface PolicyContext {
  legal_entity: LegalEntity;
  layer: Layer;

  authority_mode: AuthorityMode;
  authority_scope: AuthorityScope;
  execution_state: ExecutionState;

  event_type: EventType;

  // Optional governance signals
  ord_active?: boolean;
  monthly_budget_used?: number;
  monthly_budget_cap?: number;
}

export interface PolicyDecision {
  result: EnforcementResult;
  rule_id?: string;
  ui_reason_key?: string;
  escalated_to?: string[];
}

// -----------------------------
// Internal frozen state
// -----------------------------

let FROZEN_POLICY: GovernancePolicyV1 | null = null;

// -----------------------------
// Loader
// -----------------------------

export function loadGovernancePolicy(
  policyJson: GovernancePolicyV1,
  schemaValidator?: (policy: unknown) => boolean
) {
  if (FROZEN_POLICY) {
    throw new Error("POLICY_ALREADY_LOADED");
  }

  // Optional JSON Schema validation hook
  if (schemaValidator) {
    const ok = schemaValidator(policyJson);
    if (!ok) {
      throw new Error("POLICY_SCHEMA_VALIDATION_FAILED");
    }
  }

  // Minimal sanity checks (runtime safety net)
  if (!policyJson.meta?.policy_id) {
    throw new Error("POLICY_META_MISSING_ID");
  }
  if (policyJson.meta.version !== "v1") {
    throw new Error("POLICY_VERSION_UNSUPPORTED");
  }
  if (!Array.isArray(policyJson.rules) || policyJson.rules.length === 0) {
    throw new Error("POLICY_RULESET_EMPTY");
  }

  // Freeze deeply (best-effort immutability)
  deepFreeze(policyJson);

  FROZEN_POLICY = policyJson;
  return true;
}

// -----------------------------
// Public Accessor
// -----------------------------

export function getGovernancePolicy(): GovernancePolicyV1 {
  if (!FROZEN_POLICY) {
    throw new Error("POLICY_NOT_LOADED");
  }
  return FROZEN_POLICY;
}

// -----------------------------
// Evaluation Engine
// -----------------------------

export function evaluatePolicy(ctx: PolicyContext): PolicyDecision {
  if (!FROZEN_POLICY) {
    throw new Error("POLICY_NOT_LOADED");
  }

  // Hard gate — Legal pre-SRL rule (systemic, non-negotiable)
  const legalGate = FROZEN_POLICY.legal_gates.pre_srl_hard_rule;
  if (
    ctx.legal_entity !== legalGate.if_legal_entity_not &&
    ctx.execution_state !== "DISABLED"
  ) {
    return {
      result: "BLOCKED",
      rule_id: "LEGAL-GATE",
      ui_reason_key: "LEGAL_EXECUTION_LOCK_ACTIVE",
      escalated_to: ["FOUNDER", "LEGAL"]
    };
  }

  // Budget guardrail (SSC / budgeted scope)
  if (
    FROZEN_POLICY.budget_guardrails.enabled &&
    ctx.monthly_budget_used !== undefined &&
    ctx.monthly_budget_cap !== undefined &&
    ctx.monthly_budget_used > ctx.monthly_budget_cap
  ) {
    const g = FROZEN_POLICY.budget_guardrails.on_breach;
    return {
      result: "ESCALATED",
      rule_id: "BUDGET-GUARDRAIL",
      ui_reason_key: "BUDGET_GUARDRAIL_TRIGGERED",
      escalated_to: g.escalate_to
    };
  }

  // Declarative rule evaluation (first match wins)
  for (const rule of FROZEN_POLICY.rules) {
    if (ruleMatches(rule, ctx)) {
      return {
        result: rule.then.enforcement,
        rule_id: rule.rule_id,
        ui_reason_key: rule.then.ui_reason_key,
        escalated_to: rule.then.escalate_to
      };
    }
  }

  // Default: allowed
  return { result: "ALLOWED" };
}

// -----------------------------
// Rule Matching
// -----------------------------

function ruleMatches(rule: PolicyRuleV1, ctx: PolicyContext): boolean {
  const w = rule.when;

  if (w.legal_entity && !w.legal_entity.includes(ctx.legal_entity)) {
    return false;
  }
  if (w.layer && !w.layer.includes(ctx.layer)) {
    return false;
  }
  if (w.authority_mode && !w.authority_mode.includes(ctx.authority_mode)) {
    return false;
  }
  if (w.authority_scope && !w.authority_scope.includes(ctx.authority_scope)) {
    return false;
  }
  if (w.execution_state && !w.execution_state.includes(ctx.execution_state)) {
    return false;
  }
  if (w.event_type && !w.event_type.includes(ctx.event_type)) {
    return false;
  }

  return true;
}

// -----------------------------
// Immutability Helper
// -----------------------------

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const key of Object.getOwnPropertyNames(obj)) {
      // @ts-ignore
      const val = obj[key];
      if (
        val &&
        typeof val === "object" &&
        !Object.isFrozen(val)
      ) {
        deepFreeze(val);
      }
    }
  }
  return obj;
}

// -----------------------------
// Optional: Simple JSON Schema Validator Stub
// Plug AJV or similar here in production
// -----------------------------

export function createAjvValidator(schema: object) {
  return function validate(_policy: unknown): boolean {
    // Placeholder — integrate AJV here if needed
    // Example:
    // const ajv = new Ajv()
    // const validate = ajv.compile(schema)
    // return validate(_policy) as boolean
    return true;
  };
}
