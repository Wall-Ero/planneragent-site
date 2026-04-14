// core/src/execution/resolveCapability.final.ts

import { CAPABILITY_REGISTRY } from "./capability.registry";
import type { CapabilityDefinition, CapabilityLevel } from "./capability.types";
import type { PlannerAction } from "./action.types";

import { applyBehaviorBias } from "../decision/decision.behavior";

import type { BehaviorProfile } from "../decision/decision.behavior";

/* =====================================================
 TYPES
===================================================== */

export type CapabilityResolutionResult = {
  capabilityId: string | null;
  candidates: string[];
  scoring: CapabilityScoreRow[];
};

type CapabilityScoreRow = {
  capabilityId: string;
  score: number;
  reasons: string[];
};

export type ResolutionContext = {
  decisionPressure?: "LOW" | "MEDIUM" | "HIGH";
  riskScore?: number;
  topologyConfidence?: number;
  correctionEffect?: "FULL" | "PARTIAL" | "NONE";
  anomaly?: boolean;

  // 🔥 AGGIUNGI QUESTO
  behaviorProfile?: BehaviorProfile;
};

/* =====================================================
 ENTRY
===================================================== */

export function resolveCapabilityFinal(input: {
  action: PlannerAction;
  plan: CapabilityLevel;
  context?: ResolutionContext;
}): CapabilityResolutionResult {

  const candidates = resolveCandidates(input);

  if (!candidates.length) {
    return { capabilityId: null, candidates: [], scoring: [] };
  }

  const scoring = candidates.map(c =>
    scoreCapability(c, input)
  );

  scoring.sort((a, b) => b.score - a.score);

  return {
    capabilityId: scoring[0].capabilityId,
    candidates: candidates.map(c => c.id),
    scoring,
  };
}

/* =====================================================
 CANDIDATES
===================================================== */

function resolveCandidates(input: {
  action: PlannerAction;
  plan: CapabilityLevel;
}): CapabilityDefinition[] {

  const tokens = tokenize(input.action.type);

  const allowed = CAPABILITY_REGISTRY.filter(c =>
  c.allowedLevels.some(level => level === input.plan)
);

  const scored = allowed.map(c => ({
    capability: c,
    score: affinity(tokens, c),
  }))
  .filter(x => x.score > 0)
  .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const best = scored[0].score;

  return scored
    .filter(x => x.score >= Math.max(2, best - 5))
    .map(x => x.capability);
}

/* =====================================================
 AFFINITY
===================================================== */

function affinity(tokens: string[], c: CapabilityDefinition): number {

  const ct = tokenize(c.id);
  const dt = tokenize(c.description);

  let score = 0;

  const actionType = tokens.join("_");

  // 🔥 EXACT MATCH (fondamentale)
  if (actionType === c.id) {
    return 1000; // hard win
  }

  // 🔥 NORMALIZED MATCH
  if (normalize(actionType) === normalize(c.id)) {
    score += 200;
  }

  // token overlap
  score += intersect(tokens, ct) * 10;
  score += intersect(tokens, dt) * 4;

  // semantic nudges (minimi ma utili)
  if (has(tokens, "SUPPLIER") && has(ct, "SUPPLIER")) score += 5;
  if (has(tokens, "PRODUCTION") && has(ct, "PRODUCTION")) score += 5;
  if (has(tokens, "INVENTORY") && has(ct, "INVENTORY")) score += 5;

  return score;
}

/* =====================================================
 SCORE ENGINE (FULL)
===================================================== */

function scoreCapability(
  c: CapabilityDefinition,
  input: {
    action: PlannerAction;
    plan: CapabilityLevel;
    context?: ResolutionContext;
  }
): CapabilityScoreRow {

  let score = 50;
  const reasons: string[] = [];

  const systemic = isSystemic(c.id);
  const pressure = input.context?.decisionPressure ?? "MEDIUM";
  const risk = input.context?.riskScore ?? 0.5;
  const topology = input.context?.topologyConfidence ?? 0.7;
  const anomaly = input.context?.anomaly ?? false;

  const behavior = input.context?.behaviorProfile;

if (behavior && behavior.confidence > 0) {
  const adjusted = applyBehaviorBias({
    baseScore: score,
    capabilityId: c.id,
    isSystemic: systemic,
    profile: behavior
  });

  score = adjusted.score;
  reasons.push(...adjusted.reasons);
}

  // PLAN LOGIC
  if (input.plan === "JUNIOR") {
    if (!systemic) {
      score += 10;
      reasons.push("LOCAL_ACTION_PREFERRED");
    } else {
      score -= 10;
      reasons.push("SYSTEMIC_PENALTY");
    }
  }

  if (input.plan === "SENIOR") {
    if (systemic) {
      score += 10;
      reasons.push("SYSTEMIC_CONTROL");
    } else {
      score -= 2;
    }
  }

  // PRESSURE
  if (pressure === "HIGH" && !systemic) {
    score += 8;
    reasons.push("FAST_RESPONSE");
  }

  if (pressure === "LOW" && systemic) {
    score += 5;
    reasons.push("STRUCTURAL_IMPROVEMENT");
  }

  // RISK
  if (risk > 0.7 && systemic) {
    score += 6;
    reasons.push("HIGH_RISK_CONTROL");
  }

  if (risk < 0.3 && !systemic) {
    score += 3;
    reasons.push("LOW_RISK_EXECUTION");
  }

  // TOPOLOGY
  if (topology < 0.6 && systemic) {
    score += 5;
    reasons.push("LOW_TOPOLOGY_CONTROL");
  }

  // ANOMALY
  if (anomaly && systemic) {
    score += 5;
    reasons.push("ANOMALY_STRUCTURED_RESPONSE");
  }

  // PROVIDER
  if (c.providers.primary === "INTERNAL") score += 2;
  if (c.providers.primary === "API") score -= 1;

  return {
    capabilityId: c.id,
    score,
    reasons,
  };
}

/* =====================================================
 UTILS
===================================================== */

function tokenize(v: string): string[] {
  return v.split(/_| /).map(x => x.toUpperCase());
}

function intersect(a: string[], b: string[]) {
  return a.filter(x => b.includes(x)).length;
}

function normalize(v: string): string {
  return v.replace(/_/g, "").toUpperCase();
}

function has(tokens: string[], t: string): boolean {
  return tokens.includes(t.toUpperCase());
}

function isSystemic(id: string): boolean {
  return (
    id.includes("SYSTEM") ||
    id.includes("PORTFOLIO") ||
    id.includes("POLICY")
  );
}