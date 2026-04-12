// core/src/execution/resolveCapability.final.ts

import { CAPABILITY_REGISTRY } from "./capability.registry";
import type {
  CapabilityDefinition,
  CapabilityLevel,
} from "./capability.types";
import type { PlannerAction } from "./action.types";

/* =====================================================
 TYPES
===================================================== */

export type CapabilityResolutionMode =
  | "DETERMINISTIC"
  | "HYBRID"
  | "NONE";

export type CapabilityResolutionResult = {
  capabilityId: string | null;
  mode: CapabilityResolutionMode;
  candidates: string[];
  llmSuggestion?: string | null;
  llmConfidence?: number;
  scoring?: CapabilityScoreRow[];
};

type CapabilityScoreRow = {
  capabilityId: string;
  score: number;
  reasons: string[];
};

export type ResolutionContext = {
  decisionPressure?: "LOW" | "MEDIUM" | "HIGH";
  riskScore?: number; // 0..1
  topologyConfidence?: number; // 0..1
  correctionEffect?: "FULL" | "PARTIAL" | "NONE";
  anomaly?: boolean;
};

type DeterministicSelectionInput = {
  action: PlannerAction;
  plan: CapabilityLevel;
  candidates: CapabilityDefinition[];
  llmSuggestion: string | null;
  llmConfidence: number;
  context?: ResolutionContext;
};

/* =====================================================
 ENTRY POINT
===================================================== */

export async function resolveCapabilityFinal(input: {
  action: PlannerAction;
  plan: CapabilityLevel;
  context?: ResolutionContext;
}): Promise<CapabilityResolutionResult> {
  const candidates = resolveCandidateCapabilities({
    action: input.action,
    plan: input.plan,
  });

  if (!candidates.length) {
    return {
      capabilityId: null,
      mode: "NONE",
      candidates: [],
      scoring: [],
    };
  }

  let llmSuggestion: string | null = null;
  let llmConfidence = 0;

  if (shouldUseLLM(input.plan) && candidates.length > 1) {
    try {
      const llm = await suggestCapabilityWithLLM({
        action: input.action,
        candidates: candidates.map((c) => c.id),
        context: input.context,
      });

      llmSuggestion = llm.capabilityId;
      llmConfidence = llm.confidence ?? 0;
    } catch {
      llmSuggestion = null;
      llmConfidence = 0;
    }
  }

  const selection = selectDeterministic({
    action: input.action,
    plan: input.plan,
    candidates,
    llmSuggestion,
    llmConfidence,
    context: input.context,
  });

  return {
    capabilityId: selection.capabilityId,
    mode: llmSuggestion ? "HYBRID" : "DETERMINISTIC",
    candidates: candidates.map((c) => c.id),
    llmSuggestion,
    llmConfidence,
    scoring: selection.scoring,
  };
}

/* =====================================================
 STEP 1 — DATA-DRIVEN CANDIDATE RESOLUTION
===================================================== */

function resolveCandidateCapabilities(input: {
  action: PlannerAction;
  plan: CapabilityLevel;
}): CapabilityDefinition[] {
  const actionType = input.action.type;
  const actionTokens = tokenize(actionType);

  const allowed = CAPABILITY_REGISTRY.filter((capability) =>
    hasLevel(capability, input.plan)
  );

  const scored = allowed
    .map((capability) => {
      const score = scoreCandidateAffinity({
        actionType,
        actionTokens,
        capability,
      });

      return {
        capability,
        score,
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return [];
  }

  const best = scored[0].score;

  // prendiamo solo le capability abbastanza vicine alla migliore
  // così evitiamo rumore e teniamo il resolver governato
  return scored
    .filter((row) => row.score >= Math.max(2, best - 4))
    .map((row) => row.capability);
}

function scoreCandidateAffinity(input: {
  actionType: string;
  actionTokens: string[];
  capability: CapabilityDefinition;
}): number {
  let score = 0;

  const capabilityId = input.capability.id;
  const capabilityTokens = tokenize(capabilityId);
  const descriptionTokens = tokenize(input.capability.description);

  // exact
  if (input.actionType === capabilityId) {
    score += 100;
  }

  // normalized exact
  if (normalizeToken(input.actionType) === normalizeToken(capabilityId)) {
    score += 60;
  }

  // token overlap: id
  const overlapId = intersectCount(input.actionTokens, capabilityTokens);
  score += overlapId * 10;

  // token overlap: description
  const overlapDescription = intersectCount(input.actionTokens, descriptionTokens);
  score += overlapDescription * 4;

  // same prefix / semantic closeness
  if (
    hasToken(input.actionTokens, "SUPPLIER") &&
    hasToken(capabilityTokens, "SUPPLIER")
  ) {
    score += 4;
  }

  if (
    hasToken(input.actionTokens, "PRODUCTION") &&
    hasToken(capabilityTokens, "PRODUCTION")
  ) {
    score += 4;
  }

  if (
    hasToken(input.actionTokens, "ROUTING") &&
    hasToken(capabilityTokens, "ROUTING")
  ) {
    score += 4;
  }

  if (
    hasToken(input.actionTokens, "PROJECT") &&
    hasToken(capabilityTokens, "PROJECT")
  ) {
    score += 4;
  }

  if (
    hasToken(input.actionTokens, "EMAIL") &&
    hasToken(capabilityTokens, "EMAIL")
  ) {
    score += 4;
  }

  if (
    hasToken(input.actionTokens, "TEAM") &&
    hasToken(capabilityTokens, "TEAM")
  ) {
    score += 4;
  }

  // governed semantic nudges
  if (
    hasToken(input.actionTokens, "CONTACT") &&
    hasToken(capabilityTokens, "SUPPLIER")
  ) {
    score += 5;
  }

  if (
    hasToken(input.actionTokens, "NOTIFICATION") &&
    hasToken(capabilityTokens, "NOTIFY")
  ) {
    score += 5;
  }

  if (
    hasToken(input.actionTokens, "ADJUST") &&
    hasToken(capabilityTokens, "RESCHEDULE")
  ) {
    score += 3;
  }

  if (
    hasToken(input.actionTokens, "PLAN") &&
    (hasToken(capabilityTokens, "PLAN") ||
      hasToken(capabilityTokens, "CAPACITY") ||
      hasToken(capabilityTokens, "PROJECT"))
  ) {
    score += 3;
  }

  return score;
}

/* =====================================================
 STEP 2 — OPTIONAL LLM SUPPORT
===================================================== */

function shouldUseLLM(plan: CapabilityLevel): boolean {
  return plan !== "VISION";
}

async function suggestCapabilityWithLLM(input: {
  action: PlannerAction;
  candidates: string[];
  context?: ResolutionContext;
}): Promise<{ capabilityId: string | null; confidence: number }> {
  // Stub sicuro:
  // l'LLM suggerisce solo tra candidate già valide.
  // La decisione finale resta deterministica.

  return {
    capabilityId: input.candidates[0] ?? null,
    confidence: 0.6,
  };
}

/* =====================================================
 STEP 3 — FINAL DETERMINISTIC SELECTION
===================================================== */

function selectDeterministic(
  input: DeterministicSelectionInput
): {
  capabilityId: string;
  scoring: CapabilityScoreRow[];
} {
  if (input.candidates.length === 1) {
    return {
      capabilityId: input.candidates[0].id,
      scoring: [
        {
          capabilityId: input.candidates[0].id,
          score: 100,
          reasons: ["ONLY_CANDIDATE"],
        },
      ],
    };
  }

  const scoring = input.candidates.map((capability) =>
    scoreCapability({
      capability,
      action: input.action,
      plan: input.plan,
      llmSuggestion: input.llmSuggestion,
      llmConfidence: input.llmConfidence,
      context: input.context,
    })
  );

  scoring.sort((a, b) => b.score - a.score);

  return {
    capabilityId: scoring[0].capabilityId,
    scoring,
  };
}

function scoreCapability(input: {
  capability: CapabilityDefinition;
  action: PlannerAction;
  plan: CapabilityLevel;
  llmSuggestion: string | null;
  llmConfidence: number;
  context?: ResolutionContext;
}): CapabilityScoreRow {
  const reasons: string[] = [];
  let score = 50;

  const capabilityId = input.capability.id;
  const pressure = input.context?.decisionPressure ?? "MEDIUM";
  const riskScore = clamp01(input.context?.riskScore ?? 0.5);
  const topologyConfidence = clamp01(input.context?.topologyConfidence ?? 0.7);
  const correctionEffect = input.context?.correctionEffect ?? "NONE";
  const anomaly = input.context?.anomaly ?? false;

  const systemic = isSystemicCapability(capabilityId);
  const local = !systemic;

  // base from capability nature
  if (local) {
    score += 3;
    reasons.push("LOCAL_ACTION_BASE");
  } else {
    score += 4;
    reasons.push("SYSTEMIC_ACTION_BASE");
  }

  // provider governance
  if (input.capability.providers.primary === "INTERNAL") {
    score += 2;
    reasons.push("INTERNAL_PROVIDER_CONTROL");
  }

  if (input.capability.providers.primary === "ERP") {
    score += 2;
    reasons.push("ERP_PROVIDER_EXECUTION");
  }

  if (input.capability.providers.primary === "API") {
    score -= 1;
    reasons.push("API_EXTERNAL_DEPENDENCY");
  }

  if (input.capability.requiresApproval) {
    score -= 1;
    reasons.push("APPROVAL_REQUIRED_FRICTION");
  }

  if (input.capability.executionType === "SYNC") {
    score += 1;
    reasons.push("SYNC_EXECUTION_BONUS");
  }

  if (typeof input.capability.estimatedCost === "number") {
    score -= Math.min(3, input.capability.estimatedCost * 10);
    reasons.push("ESTIMATED_COST_PENALTY");
  }

  // brutal rule
  if (input.plan === "JUNIOR") {
    if (local) {
      score += 8;
      reasons.push("JUNIOR_PREFERS_LOCAL_DECISION");
    } else {
      score -= 8;
      reasons.push("JUNIOR_SYSTEMIC_PENALTY");
    }
  }

  if (input.plan === "SENIOR" || input.plan === "PRINCIPAL") {
    if (systemic) {
      score += 8;
      reasons.push("SENIOR_PREFERS_SYSTEMIC_CONTROL");
    } else {
      score -= 2;
      reasons.push("SENIOR_LOCAL_ACTION_MINOR_PENALTY");
    }
  }

  // token-based semantic fit from registry
  const actionTokens = tokenize(input.action.type);
  const capabilityTokens = tokenize(capabilityId);
  const semanticOverlap = intersectCount(actionTokens, capabilityTokens);

  score += semanticOverlap * 6;
  if (semanticOverlap > 0) {
    reasons.push(`SEMANTIC_OVERLAP_${semanticOverlap}`);
  }

  // planner-like context
  if (pressure === "HIGH") {
    if (local) {
      score += 8;
      reasons.push("HIGH_PRESSURE_LOCAL_FAST_ACTION");
    }
    if (systemic) {
      score -= 3;
      reasons.push("HIGH_PRESSURE_SYSTEMIC_CHANGE_PENALTY");
    }
  }

  if (pressure === "LOW") {
    if (systemic) {
      score += 5;
      reasons.push("LOW_PRESSURE_SYSTEMIC_RESHAPE_OK");
    }
  }

  if (riskScore > 0.7) {
    if (systemic) {
      score += 6;
      reasons.push("HIGH_RISK_PREFER_SYSTEMIC_CONTROL");
    }
    if (input.capability.providers.primary === "API") {
      score -= 3;
      reasons.push("HIGH_RISK_EXTERNAL_API_PENALTY");
    }
  }

  if (riskScore < 0.35) {
    if (local) {
      score += 3;
      reasons.push("LOW_RISK_LOCAL_EXECUTION_OK");
    }
  }

  if (topologyConfidence < 0.6) {
    if (systemic) {
      score += 4;
      reasons.push("LOW_TOPOLOGY_PREFER_STRUCTURED_CONTROL");
    }
    if (input.capability.providers.primary === "API") {
      score -= 2;
      reasons.push("LOW_TOPOLOGY_EXTERNAL_DEPENDENCY_PENALTY");
    }
  }

  if (correctionEffect === "FULL") {
    if (local) {
      score += 4;
      reasons.push("FULL_CORRECTION_LOCAL_EXECUTION_READY");
    }
  }

  if (correctionEffect === "PARTIAL") {
    if (systemic) {
      score += 4;
      reasons.push("PARTIAL_CORRECTION_NEEDS_SYSTEM_REBALANCE");
    }
  }

  if (anomaly) {
    if (systemic) {
      score += 5;
      reasons.push("ANOMALY_PREFER_STRUCTURED_SYSTEMIC_CONTROL");
    }
    if (input.capability.providers.primary === "API") {
      score -= 2;
      reasons.push("ANOMALY_EXTERNAL_ACTION_PENALTY");
    }
  }

  // bounded LLM hint
  if (
    input.llmSuggestion &&
    capabilityId === input.llmSuggestion &&
    input.llmConfidence >= 0.8
  ) {
    score += 4;
    reasons.push("LLM_HIGH_CONFIDENCE_HINT");
  } else if (
    input.llmSuggestion &&
    capabilityId === input.llmSuggestion &&
    input.llmConfidence >= 0.65
  ) {
    score += 2;
    reasons.push("LLM_MEDIUM_CONFIDENCE_HINT");
  }

  return {
    capabilityId,
    score: round2(score),
    reasons,
  };
}

/* =====================================================
 UTILS
===================================================== */

function hasLevel(
  capability: CapabilityDefinition,
  level: CapabilityLevel
): boolean {
  return (capability.allowedLevels as readonly CapabilityLevel[]).includes(level);
}

function isSystemicCapability(capabilityId: string): boolean {
  return (
    capabilityId.endsWith("_SYSTEM") ||
    capabilityId.includes("PORTFOLIO") ||
    capabilityId.includes("POLICY") ||
    capabilityId.includes("NETWORK") ||
    capabilityId.includes("CAPACITY") ||
    capabilityId.includes("REDEFINE") ||
    capabilityId.includes("BROADCAST") ||
    capabilityId.includes("PROJECT_RESOURCES")
  );
}
function hasToken(tokens: string[], token: string): boolean {
  return tokens.includes(normalizeToken(token));
}

function tokenize(value: string): string[] {
  return value
    .split(/[^A-Za-z0-9]+|_/)
    .map((token) => normalizeToken(token))
    .filter(Boolean);
}

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function intersectCount(a: string[], b: string[]): number {
  const bSet = new Set(b);
  return Array.from(new Set(a)).filter((token) => bSet.has(token)).length;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}