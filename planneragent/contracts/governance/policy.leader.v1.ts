// planneragent/contracts/governance/policy.leader.v1.ts

// FREEZE — policy.leader.v1
// Source of truth: chat-prodotto
// Status: canonical
//
// Purpose
// Leader policy = top-level constitution-like policy record that:
// - declares policy identity + scope
// - freezes non-violables
// - defines execution authority model (BASIC/JUNIOR/SENIOR) as CANONICAL
// - provides references to subordinate policies (ORD/VOICE/LEARNING/etc.)
// - is data-first (serializable), code-light, no business branching
//
// NOTE: This file is a CONTRACT. Keep it stable. Version via new file.

/* ---------------------------------- Types --------------------------------- */

export type PolicyId = string; // e.g. "policy.leader.v1"
export type IsoDateTime = string; // ISO-8601
export type Sha256Hex = string; // hex string

export type Layer =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER"
  | "SSC"
  | "AGI";

export type AuthorityModel =
  | "OBSERVE_ONLY" // BASIC
  | "EXECUTE_BY_APPROVAL" // JUNIOR
  | "EXECUTE_BY_DELEGATION" // SENIOR
  | "DECISION_WITH_HUMAN_BUDGET" // SSC (human responsibility)
  | "SYSTEMIC_GOVERNANCE_ONLY"; // AGI decision layer (no execution)

export type PolicyStatus = "DRAFT" | "ACTIVE" | "RETIRED";

export type NonViolableRuleKey =
  | "BOUNDARY_FIRST"
  | "CONSISTENCY_OVER_OPTIMALITY"
  | "NO_FORCED_DECISIONS"
  | "APPROVAL_IS_SACRED"
  | "DELEGATION_IS_EXPLICIT"
  | "PREDICTABLE_ERROR"
  | "MEMORY_BEFORE_REASONING"
  | "EXPLAINABILITY_BY_DEFAULT"
  | "ESCALATION_OVER_CREATIVITY"
  | "HUMAN_SUPREMACY"
  | "LLM_EXPLAINS_NEVER_DECIDES"
  | "ORD_INTERRUPTION_RIGHTS";

/**
 * IMPORTANT:
 * Scope here is the policy applicability, not "what the system sells today".
 * We include future layers to keep the constitution stable when you unlock them.
 */
export type PolicyScope = {
  applies_to_layers: readonly Layer[];
  applies_to_domains: readonly string[]; // e.g. ["operations", "supply_chain", "finance"]
  tenant_isolated: true;
};

export type PolicyReference = {
  name: string; // e.g. "voice.policy.v1"
  path: string; // repo path, e.g. "planneragent/contracts/voice/voice.policy.v1.json"
  version: string; // e.g. "v1"
  sha256?: Sha256Hex; // optional integrity pin
};

export type ExecutionAuthorityRule = {
  layer: Layer;
  authority_model: AuthorityModel;

  // canonical constraints (enforced elsewhere, declared here)
  can_execute: boolean;
  requires_human_approval: boolean; // per action (JUNIOR)
  requires_delegation_scope: boolean; // (SENIOR/SSC)
  delegation_must_be: readonly ("SCOPED" | "TIME_BOUND" | "REVOCABLE")[];

  // for AGI/SSC clarity
  responsibility_owner: "HUMAN" | "SYSTEM";
  notes: string;
};

export type PolicyLeaderV1 = {
  policy_id: PolicyId;
  version: "v1";
  status: PolicyStatus;

  created_at: IsoDateTime;
  updated_at: IsoDateTime;

  scope: PolicyScope;

  /**
   * Immutable non-violables (constitution)
   */
  non_violables: readonly {
    key: NonViolableRuleKey;
    statement: string;
  }[];

  /**
   * Canonical execution authority matrix
   */
  execution_authority: readonly ExecutionAuthorityRule[];

  /**
   * Sub-policies / contracts referenced by this leader policy
   */
  references: readonly PolicyReference[];

  /**
   * Optional integrity for this record itself (when exported as JSON)
   */
  integrity?: {
    sha256?: Sha256Hex;
    signed_by?: string; // e.g. "founder"
    signed_at?: IsoDateTime;
  };
};

/* ----------------------------- Canonical Record ---------------------------- */

export const POLICY_LEADER_V1: PolicyLeaderV1 = {
  policy_id: "policy.leader.v1",
  version: "v1",
  status: "ACTIVE",

  created_at: "2026-01-16T00:00:00Z",
  updated_at: "2026-01-16T00:00:00Z",

  scope: {
    // Applies across layers because it freezes boundaries and authority semantics.
    // Even if BASIC doesn't execute, it MUST be governed by the same constitution.
    applies_to_layers: [
  "VISION",
  "GRADUATE",
  "JUNIOR",
  "SENIOR",
  "PRINCIPAL",
  "CHARTER",
  "SSC",
  "AGI",
] as const,
    applies_to_domains: ["operations", "supply_chain", "governance"] as const,
    tenant_isolated: true,
  },

  non_violables: [
    {
      key: "BOUNDARY_FIRST",
      statement:
        "PlannerAgent must never operate outside explicitly defined decision boundaries. If boundaries are missing or conflicting → STOP or escalate.",
    },
    {
      key: "CONSISTENCY_OVER_OPTIMALITY",
      statement:
        "When multiple valid options exist, prefer consistency with prior decisions over marginal optimization. Avoid oscillation.",
    },
    {
      key: "NO_FORCED_DECISIONS",
      statement:
        "Never force a decision when confidence is below threshold. Low confidence → conservative proposal. Very low → silence + request human input.",
    },
    {
      key: "APPROVAL_IS_SACRED",
      statement:
        "In JUNIOR mode, PlannerAgent must never execute without explicit human approval. Any execution attempt without approval → BLOCK.",
    },
    {
      key: "DELEGATION_IS_EXPLICIT",
      statement:
        "In SENIOR mode, execution is allowed only within explicitly delegated scopes that are scoped, time-bound, and revocable. Outside scope → BLOCK.",
    },
    {
      key: "PREDICTABLE_ERROR",
      statement:
        "Fail conservatively and predictably. Prefer inaction over risky action; prefer rollback-safe options.",
    },
    {
      key: "MEMORY_BEFORE_REASONING",
      statement:
        "Before generating proposals, check Decision Memory. Align with active precedent or explicitly justify divergence.",
    },
    {
      key: "EXPLAINABILITY_BY_DEFAULT",
      statement:
        "Every proposal or action must be explainable in simple operational terms. If it cannot be explained → it cannot be executed.",
    },
    {
      key: "ESCALATION_OVER_CREATIVITY",
      statement:
        "When rules conflict or trade-offs exceed tolerance, escalate. Do not invent new rules or reinterpret boundaries creatively.",
    },
    {
      key: "HUMAN_SUPREMACY",
      statement:
        "Human judgment always overrides PlannerAgent. Overrides are recorded, not resisted. PlannerAgent adapts behavior, not authority.",
    },
    {
      key: "LLM_EXPLAINS_NEVER_DECIDES",
      statement:
        "LLMs may explain or interpret Core-owned outputs. They never define reality, alter state, approve, or execute.",
    },
    {
      key: "ORD_INTERRUPTION_RIGHTS",
      statement:
        "Operational readiness is the right to interrupt. Non-ready outputs must not be shown to humans where gating applies.",
    },
  ] as const,

  execution_authority: [
    {
      layer: "BASIC",
      authority_model: "OBSERVE_ONLY",
      can_execute: false,
      requires_human_approval: false,
      requires_delegation_scope: false,
      delegation_must_be: [] as const,
      responsibility_owner: "HUMAN",
      notes:
        "BASIC is observation + explanation only. No proposals that imply execution. No side effects.",
    },
    {
      layer: "JUNIOR",
      authority_model: "EXECUTE_BY_APPROVAL",
      can_execute: true,
      requires_human_approval: true,
      requires_delegation_scope: false,
      delegation_must_be: [] as const,
      responsibility_owner: "HUMAN",
      notes:
        "JUNIOR executes only after explicit human approval for each action. No implicit autonomy.",
    },
    {
      layer: "SENIOR",
      authority_model: "EXECUTE_BY_DELEGATION",
      can_execute: true,
      requires_human_approval: false,
      requires_delegation_scope: true,
      delegation_must_be: ["SCOPED", "TIME_BOUND", "REVOCABLE"] as const,
      responsibility_owner: "HUMAN",
      notes:
        "SENIOR executes within an explicitly delegated scope. Delegation is human-owned and always revocable.",
    },
    {
      layer: "SSC",
      authority_model: "DECISION_WITH_HUMAN_BUDGET",
      can_execute: true,
      requires_human_approval: false,
      requires_delegation_scope: true,
      delegation_must_be: ["SCOPED", "TIME_BOUND", "REVOCABLE"] as const,
      responsibility_owner: "HUMAN",
      notes:
        "SSC is SENIOR extended: limited decision delegation with explicit human budget. Responsibility remains human (CFO/Direction).",
    },
    {
      layer: "AGI",
      authority_model: "SYSTEMIC_GOVERNANCE_ONLY",
      can_execute: false,
      requires_human_approval: false,
      requires_delegation_scope: false,
      delegation_must_be: [] as const,
      responsibility_owner: "HUMAN",
      notes:
        "AGI Decision Layer governs whether decisions may exist / be committed under systemic rules. It does not execute in the world.",
    },
  ] as const,

  references: [
    {
      name: "LLM Usage Policy v1",
      path: "planneragent/contracts/governance/llm.usage.policy.v1.md",
      version: "v1",
    },
    {
      name: "ORD Dataset v1",
      path: "planneragent/contracts/ord/ord.dataset.v1.md",
      version: "v1",
    },
    {
      name: "Voice Policy Contract v1",
      path: "planneragent/contracts/voice/voice.policy.v1.json",
      version: "v1",
    },
    {
      name: "Decision Memory Schema v1.1",
      path: "planneragent/core/decision-memory/schema/decisionMemory.schema.json",
      version: "v1.1",
    },
    {
      name: "FDG Contract v1",
      path: "planneragent/contracts/finance/fdg/fdg.v1.md",
      version: "v1",
    },
    {
      name: "FDC Contract v1",
      path: "planneragent/contracts/finance/fdc/fdc.v1.md",
      version: "v1",
    },
    {
      name: "FDV Contract v1",
      path: "planneragent/contracts/finance/fdv/fdv.v1.md",
      version: "v1",
    },
  ] as const,
} as const;

/* -------------------------------- Utilities -------------------------------- */

/**
 * Minimal runtime validation to prevent accidental shape drift in code.
 * This is NOT business enforcement.
 */
export function assertPolicyLeaderV1(x: unknown): asserts x is PolicyLeaderV1 {
  if (!x || typeof x !== "object") throw new Error("PolicyLeaderV1: not an object");
  const o = x as any;
  if (o.version !== "v1") throw new Error("PolicyLeaderV1: invalid version");
  if (o.policy_id !== "policy.leader.v1") throw new Error("PolicyLeaderV1: invalid policy_id");
  if (!o.scope || o.scope.tenant_isolated !== true) throw new Error("PolicyLeaderV1: invalid scope");
  if (!Array.isArray(o.execution_authority)) throw new Error("PolicyLeaderV1: missing execution_authority");
}

/**
 * When exporting to JSON, you can compute sha256 in your build step.
 * This function is intentionally not implemented to keep Core dependency-free.
 */
export function policyLeaderV1ToJson(): string {
  return JSON.stringify(POLICY_LEADER_V1, null, 2);
}