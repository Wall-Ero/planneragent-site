// core/src/decision/decision.trace.ts
// ============================================================
// Decision Trace — Canonical V2
// Multi-layer governance + real-world impact
// Source of Truth
// ============================================================

// ------------------------------------------------------------
// AUTHORITY
// ------------------------------------------------------------

export type AuthorityLevel =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

export type DecisionMode =
  | "OBSERVATION"
  | "HUMAN_TOOL_USAGE"
  | "HUMAN_APPROVED"
  | "DELEGATED_EXECUTION"
  | "IMPROVEMENT_ALLOCATION"
  | "CONSTITUTIONAL_BOUNDARY";

export interface AuthorityBlock {
  level: AuthorityLevel;
  mode: DecisionMode;
}

// ------------------------------------------------------------
// VISION (always present)
// ------------------------------------------------------------

export interface VisionBlock {
  reality_snapshot: Record<string, unknown>;
  data_quality: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  anomalies_detected?: string[];
}

// ------------------------------------------------------------
// GRADUATE — AI USAGE + REAL WORLD IMPACT
// ------------------------------------------------------------

export type ImpactType =
  | "COMMUNICATION"
  | "DATA_MODIFICATION"
  | "TRANSACTION"
  | "PROCESS_TRIGGER";

export type SystemTarget =
  | "EMAIL"
  | "ERP"
  | "CRM"
  | "EXTERNAL_API"
  | "INTERNAL_DB"
  | "UNKNOWN";

export type EntityType =
  | "order"
  | "supplier"
  | "customer"
  | "inventory"
  | "generic";

export type ActionType =
  | "SEND"
  | "UPDATE"
  | "CREATE"
  | "DELETE"
  | "TRIGGER";

export interface RealWorldImpact {
  impact_type: ImpactType;
  system_target: SystemTarget;

  entity_target: {
    type: EntityType;
    id?: string;
  };

  action: {
    type: ActionType;
    description?: string;
  };

  reversibility: "REVERSIBLE" | "PARTIAL" | "IRREVERSIBLE";
  risk_level: "LOW" | "MEDIUM" | "HIGH";
}

export interface GraduateBlock {
  ai_usage: {
    provider: string;
    model?: string;
    purpose: string;
  };

  real_world_impact: RealWorldImpact;

  human_control: {
    reviewed: boolean;
    approved: boolean;
  };
}

// ------------------------------------------------------------
// JUNIOR
// ------------------------------------------------------------

export interface JuniorBlock {
  proposed_actions: Array<{
    type: string;
    description?: string;
    expected_impact?: string;
  }>;

  selected_action?: {
    approved_by_human: boolean;
  };
}

// ------------------------------------------------------------
// SENIOR
// ------------------------------------------------------------

export interface SeniorBlock {
  autonomous_execution: Array<{
    type: string;
    description?: string;
    executed: boolean;
  }>;
}

// ------------------------------------------------------------
// PRINCIPAL
// ------------------------------------------------------------

export interface PrincipalBlock {
  process_improvement?: {
    action: string;
    expected_roi?: number;
  };

  resource_constraints: {
    within_budget: boolean;
    within_scope: boolean;
  };
}

// ------------------------------------------------------------
// CHARTER
// ------------------------------------------------------------

export interface CharterBlock {
  compliance: {
    allowed: boolean;
    violations?: string[];
  };

  enforced_rules?: string[];
}

// ------------------------------------------------------------
// DECISION TRACE ROOT
// ------------------------------------------------------------

export interface DecisionTraceV2 {
  requestId: string;
  issuedAt: string;

  authority: AuthorityBlock;

  vision: VisionBlock;

  graduate?: GraduateBlock;
  junior?: JuniorBlock;
  senior?: SeniorBlock;
  principal?: PrincipalBlock;
  charter?: CharterBlock;
}

// ------------------------------------------------------------
// BUILDER (MINIMAL SAFE BUILDER)
// ------------------------------------------------------------

export function createDecisionTraceV2(input: {
  requestId: string;
  authority: AuthorityBlock;
  vision: VisionBlock;

  graduate?: GraduateBlock;
  junior?: JuniorBlock;
  senior?: SeniorBlock;
  principal?: PrincipalBlock;
  charter?: CharterBlock;
}): DecisionTraceV2 {
  return {
    requestId: input.requestId,
    issuedAt: new Date().toISOString(),

    authority: input.authority,

    vision: input.vision,

    graduate: input.graduate,
    junior: input.junior,
    senior: input.senior,
    principal: input.principal,
    charter: input.charter,
  };
}