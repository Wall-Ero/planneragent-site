// core/src/decision/decision.behavior.ts
// ============================================================
// PlannerAgent — Decision Behavior Engine V1
// Canonical Source of Truth
//
// Purpose:
// - infer company behavior from decision memory
// - expose behavioral bias to decision engines
//
// This module:
// - does NOT decide
// - does NOT execute
// - does NOT mutate state
// - only produces behavioral signals
// ============================================================

import { getDecisionHistory } from "../decision-memory/decision.memory";

// ============================================================
// TYPES
// ============================================================

export type BehaviorProfile = {
  company_id: string;

  confidence: number; // 0 → no signal, 1 → strong pattern

  preferences: {
    preferLocalActions: boolean;
    avoidSystemicActions: boolean;
    preferSingleAction: boolean;
    riskProfile: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
  };
};

export type BehaviorInput = {
  company_id: string;
};

// ============================================================
// ENTRY
// ============================================================
export function resolveBehaviorProfile(
  input: BehaviorInput
): BehaviorProfile {

  // 🔥 TEST MODE (override manuale)
  if (input.company_id === "Company_CONSERVATIVE") {
    return {
      company_id: input.company_id,
      confidence: 1,
      preferences: {
        preferLocalActions: true,
        avoidSystemicActions: true,
        preferSingleAction: true,
        riskProfile: "CONSERVATIVE"
      }
    };
  }

  if (input.company_id === "Company_AGGRESSIVE") {
    return {
      company_id: input.company_id,
      confidence: 1,
      preferences: {
        preferLocalActions: false,
        avoidSystemicActions: false,
        preferSingleAction: false,
        riskProfile: "AGGRESSIVE"
      }
    };
  }


  // 👇 QUI PARTE IL TUO SISTEMA REALE (NON TOCCARE)
  const history = getDecisionHistory();

  if (!history.length) {
    return buildDefaultProfile(input.company_id);
  }

  // ----------------------------------------------------------
  // FILTER (only valid signals)
  // ----------------------------------------------------------

  const valid = history.filter(x =>
    x.source === "PLANNERAGENT" &&
    !x.anomaly &&
    x.outcome === "SUCCESS"
  );

  if (!valid.length) {
    return buildDefaultProfile(input.company_id);
  }

  // ----------------------------------------------------------
  // AGGREGATION
  // ----------------------------------------------------------

  let localBias = 0;
  let multiActionBias = 0;
  let conservativeBias = 0;

  for (const rec of valid) {

  const s = rec.signal;
  if (!s) continue;

  if (s.prefer_multi_action === false) {
    localBias += 1;
  }

  if (s.prefer_multi_action === true) {
    multiActionBias += 1;
  }

  if (s.risk_profile === "CONSERVATIVE") {
    conservativeBias += 1;
  }
}

  const total = valid.length;

  const confidence = Math.min(1, total / 20); // saturates after 20 decisions

  return {
    company_id: input.company_id,

    confidence,

    preferences: {
      preferLocalActions: localBias > multiActionBias,
      avoidSystemicActions: localBias > multiActionBias,
      preferSingleAction: multiActionBias < localBias,
      riskProfile:
        conservativeBias > total * 0.6
          ? "CONSERVATIVE"
          : conservativeBias < total * 0.3
          ? "AGGRESSIVE"
          : "BALANCED"
    }
  };
}

// ============================================================
// DEFAULT
// ============================================================

function buildDefaultProfile(company_id: string): BehaviorProfile {
  return {
    company_id,
    confidence: 0,
    preferences: {
      preferLocalActions: false,
      avoidSystemicActions: false,
      preferSingleAction: false,
      riskProfile: "BALANCED"
    }
  };
}

// ============================================================
// APPLY BIAS (used inside scoring engine)
// ============================================================

export function applyBehaviorBias(params: {
  baseScore: number;
  capabilityId: string;
  isSystemic: boolean;
  profile: BehaviorProfile;
}): { score: number; reasons: string[] } {

  let score = params.baseScore;
  const reasons: string[] = [];

  const p = params.profile.preferences;
  const weight = params.profile.confidence;

  // ----------------------------------------------------------
  // LOCAL vs SYSTEMIC
  // ----------------------------------------------------------

  if (p.preferLocalActions && !params.isSystemic) {
    const delta = 5 * weight;
    score += delta;
    reasons.push("BEHAVIOR_PREFERS_LOCAL");
  }

  if (p.avoidSystemicActions && params.isSystemic) {
    const delta = 5 * weight;
    score -= delta;
    reasons.push("BEHAVIOR_AVOIDS_SYSTEMIC");
  }

  // ----------------------------------------------------------
  // SINGLE vs MULTI
  // ----------------------------------------------------------

  if (p.preferSingleAction) {
    score += 2 * weight;
    reasons.push("BEHAVIOR_PREFERS_SIMPLE");
  }

  // ----------------------------------------------------------
  // RISK PROFILE
  // ----------------------------------------------------------

  if (p.riskProfile === "CONSERVATIVE" && params.isSystemic) {
    score -= 3 * weight;
    reasons.push("BEHAVIOR_CONSERVATIVE");
  }

  if (p.riskProfile === "AGGRESSIVE" && params.isSystemic) {
    score += 3 * weight;
    reasons.push("BEHAVIOR_AGGRESSIVE");
  }

  return { score, reasons };
}
