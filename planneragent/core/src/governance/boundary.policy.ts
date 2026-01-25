// planneragent/core/src/governance/boundary.policy.ts
//
// FREEZE — BASIC / JUNIOR Boundary Policy v1
// Source of truth: chat-prodotto
// Status: canonical
//
// Purpose:
// Enforce the non-negotiable boundary between
// OBSERVATION (BASIC) and DECISION ADVISORY (JUNIOR).
//
// This module:
// - does NOT decide
// - does NOT execute
// - does NOT mutate state
// - does NOT call LLM / DL
//
// It only enforces mode capability at runtime.

export type AuthorityLevel =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL";

  export const BLOCKED_INTENTS_VISION = [
  "DECIDE",
  "EXECUTE",
  "ALLOCATE",
  "APPROVE"
] as const;

export const BLOCKED_INTENTS_GRADUATE = [
  "EXECUTE",
  "ALLOCATE",
  "APPROVE"
] as const;

export type SemanticIntent =
  | "INFORM"          // explain, describe, clarify, simulate
  | "WARN"            // surface risk, anomaly, instability
  | "PROPOSE"         // structured options, actions, next steps
  | "RECOMMEND"       // preferred choice
  | "RANK"            // ordering of options
  | "WEIGH"           // trade-off weighting
  | "SELECT_BEST"    // selection
  | "PACKAGE_DECISION"; // decision object creation

export type BoundaryResultType =
  | "OK"
  | "MODE_REQUIRED";

export interface BoundaryContext {
  // Identity & provenance
  requestId: string;
  userId?: string;
  companyId?: string;
  timestamp: string; // ISO-8601
  source: "api" | "ui" | "system";

  // Operational scope
  domain?: string;

  // Economic governance
  budgetCap?: number;

  // Decision reference frame
  baseline?: unknown;
}

export interface BoundaryResult {
  result: BoundaryResultType;
  allowed: boolean;
  requiredMode?: AuthorityLevel;
  intent: SemanticIntent;
  currentMode: AuthorityLevel;
  reason: string;
  audit: {
    log: boolean;
    eventType: "BOUNDARY_PASS" | "MODE_ESCALATION_REQUIRED";
  };
}

/**
 * Canonical blocked intents by DecisionMode
 * NON-NEGOTIABLE — governance, not UX
 */
export const BLOCKED_INTENTS: Record<AuthorityLevel, readonly SemanticIntent[]> = {
  VISION: [
    "PROPOSE",
    "RECOMMEND",
    "RANK",
    "WEIGH",
    "SELECT_BEST"
  ],

  GRADUATE: [
    "RANK",
    "SELECT_BEST"
  ],

  JUNIOR: [],

  SENIOR: [],

  PRINCIPAL: []
} as const;

/**
 * Mode capability matrix
 * This is the system's "constitution"
 */
const MODE_CAPABILITIES: Record<AuthorityLevel, readonly SemanticIntent[]> = {
  VISION: [
    "INFORM",
    "WARN"
  ],

  GRADUATE: [
    "INFORM",
    "WARN",
    "PROPOSE",
    "RECOMMEND"
  ],

  JUNIOR: [
    "INFORM",
    "WARN",
    "PROPOSE",
    "RECOMMEND",
    "RANK",
    "WEIGH",
    "SELECT_BEST",
    "PACKAGE_DECISION"
  ],

  SENIOR: [
    "INFORM",
    "WARN",
    "PROPOSE",
    "RECOMMEND",
    "RANK",
    "WEIGH",
    "SELECT_BEST",
    "PACKAGE_DECISION"
  ],

  PRINCIPAL: [
    "INFORM",
    "WARN",
    "PROPOSE",
    "RECOMMEND",
    "RANK",
    "WEIGH",
    "SELECT_BEST",
    "PACKAGE_DECISION"
  ]
} as const;

/**
 * Enforce boundary between observation and decision advisory
 */
export function enforceBoundary(
  authority: AuthorityLevel,
  intent: SemanticIntent,
  context: BoundaryContext
): BoundaryResult {
  const allowedIntents = MODE_CAPABILITIES[authority] || [];

  const isAllowed = allowedIntents.includes(intent);

  // VISION attempting decision authority
  if (!isAllowed && authority === "VISION") {
    return {
      result: "MODE_REQUIRED",
      allowed: false,
      requiredMode: "JUNIOR",
      intent,
      currentMode: authority,
      reason: "Decision advisory requested in OBSERVATION mode (VISION)",
      audit: {
        log: true,
        eventType: "MODE_ESCALATION_REQUIRED",
      },
    };
  }

  // Catch-all (should never happen, but governance-safe)
  if (!isAllowed) {
    return {
      result: "MODE_REQUIRED",
      allowed: false,
      requiredMode: "JUNIOR",
      intent,
      currentMode: authority,
      reason: "Intent not permitted in current mode",
      audit: {
        log: true,
        eventType: "MODE_ESCALATION_REQUIRED",
      },
    };
  }

  // Allowed path
  return {
    result: "OK",
    allowed: true,
    intent,
    currentMode: authority,
    reason: "Intent permitted by mode capability",
    audit: {
      log: true,
      eventType: "BOUNDARY_PASS",
    },
  };
}

/**
 * Helper for decision object creation
 * Call this before ANY decision_id is generated
 */
export function assertDecisionObjectAllowed(
  mode: AuthorityLevel,
  context: BoundaryContext
): void {
  if (mode === "VISION") {
    const violation: BoundaryResult = {
      result: "MODE_REQUIRED",
      allowed: false,
      requiredMode: "JUNIOR",
      intent: "PACKAGE_DECISION",
      currentMode: mode,
      reason: "Decision objects cannot be created in VISION mode",
      audit: {
        log: true,
        eventType: "MODE_ESCALATION_REQUIRED",
      },
    };

    throw new BoundaryViolationError(violation, context);
  }
}

/**
 * Governance-safe error
 * Must be caught by orchestrator and converted into a structured response
 */
export class BoundaryViolationError extends Error {
  public readonly boundary: BoundaryResult;
  public readonly context: BoundaryContext;

  constructor(boundary: BoundaryResult, context: BoundaryContext) {
    super(boundary.reason);
    this.boundary = boundary;
    this.context = context;
    this.name = "BoundaryViolationError";
  }
}
