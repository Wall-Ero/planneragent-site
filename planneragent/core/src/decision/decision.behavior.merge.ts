//core/src/decision/decision.behavior.merge.ts

// ============================================================
// PlannerAgent — Behavior Merge Engine V1
// Canonical Source of Truth
//
// Purpose:
// - merge company behavior (historical, structural)
// - with manager behavior (runtime, contextual)
//
// Rules:
// - managerBehavior overrides when explicitly defined
// - companyBehavior remains the fallback baseline
// - no side effects, pure function
//
// Position in stack:
// 1. Deterministic Optimizer
// 2. Global Experience (future)
// 3. Company Policy
// 4. Manager Behavior (this layer merges into behaviorProfile)
// ============================================================

import type { BehaviorProfile } from "./decision.behavior";

// ============================================================
// TYPES
// ============================================================

export type ManagerBehavior = {
  actor_id?: string;
  source?: "DEFAULT" | "REQUESTED" | "HISTORICAL";

  confidence?: number;

  mode?: "SAFE" | "BALANCED" | "AGGRESSIVE";

  priority?: "SERVICE" | "COST" | "STABILITY";

  horizon?: "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";

  pressure?: "LOW" | "MEDIUM" | "HIGH";

  preferences?: {
    preferLocalActions?: boolean;
    avoidSystemicActions?: boolean;
    preferSingleAction?: boolean;
    preferMultiAction?: boolean;
    preferFastRecovery?: boolean;
  };
};

// ============================================================
// ENTRY
// ============================================================

export function mergeBehaviorProfiles(params: {
  companyBehavior: BehaviorProfile;
  managerBehavior?: ManagerBehavior | null;
}): BehaviorProfile {

  const c = params.companyBehavior;
  const m = params.managerBehavior ?? {};

  // ----------------------------------------------------------
  // CONFIDENCE
  // ----------------------------------------------------------

  const mergedConfidence = Math.max(
    c.confidence ?? 0,
    m.confidence ?? 0.5
  );

  // ----------------------------------------------------------
  // PREFERENCES MERGE
  // ----------------------------------------------------------

  const preferLocalActions =
    m.preferences?.preferLocalActions ??
    c.preferences.preferLocalActions;

  const avoidSystemicActions =
    m.preferences?.avoidSystemicActions ??
    c.preferences.avoidSystemicActions;

  const preferSingleAction =
    m.preferences?.preferSingleAction ??
    c.preferences.preferSingleAction;

  // ----------------------------------------------------------
  // RISK PROFILE DERIVATION
  // ----------------------------------------------------------

  let riskProfile: BehaviorProfile["preferences"]["riskProfile"] =
    c.preferences.riskProfile;

  if (m.mode === "SAFE") {
    riskProfile = "CONSERVATIVE";
  }

  if (m.mode === "AGGRESSIVE") {
    riskProfile = "AGGRESSIVE";
  }

  // ----------------------------------------------------------
  // NORMALIZATION RULES
  // ----------------------------------------------------------
  // Ensure internal consistency:
  // - preferSingleAction and preferMultiAction cannot both dominate
  // ----------------------------------------------------------

  let normalizedPreferSingle = preferSingleAction;

  if (m.preferences?.preferMultiAction === true) {
    normalizedPreferSingle = false;
  }

  if (m.preferences?.preferMultiAction === false) {
    normalizedPreferSingle = true;
  }

  // ----------------------------------------------------------
  // OUTPUT
  // ----------------------------------------------------------

  return {
    company_id: c.company_id,

    confidence: mergedConfidence,

    preferences: {
      preferLocalActions,
      avoidSystemicActions,
      preferSingleAction: normalizedPreferSingle,
      riskProfile,
    },
  };
}