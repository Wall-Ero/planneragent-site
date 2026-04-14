// core/src/decision/manager.behavior.ts
// ======================================================
// PlannerAgent — Manager Behavior Resolver V1
// Canonical Source of Truth
//
// Purpose
// - resolve the requested decision style of the current responsible SCM
// - keep it distinct from company policy
// - allow explicit override without mutating organizational baseline
// ======================================================

export type ManagerBehaviorMode =
  | "SAFE"
  | "BALANCED"
  | "AGGRESSIVE";

export type ManagerPriority =
  | "SERVICE"
  | "COST"
  | "STABILITY";

export type ManagerHorizon =
  | "SHORT_TERM"
  | "MEDIUM_TERM"
  | "LONG_TERM";

export type ManagerPressure =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type ManagerBehaviorOverride = {
  mode?: ManagerBehaviorMode;
  priority?: ManagerPriority;
  horizon?: ManagerHorizon;
  pressure?: ManagerPressure;
};

export type ManagerBehaviorProfile = {
  actor_id: string;
  source: "DEFAULT" | "REQUESTED";
  confidence: number;

  mode: ManagerBehaviorMode;
  priority: ManagerPriority;
  horizon: ManagerHorizon;
  pressure: ManagerPressure;

  preferences: {
    preferSingleAction: boolean;
    preferMultiAction: boolean;
    avoidSystemicActions: boolean;
    preferFastRecovery: boolean;
  };
};

export function resolveManagerBehavior(input: {
  actor_id?: string;
  override?: ManagerBehaviorOverride;
}): ManagerBehaviorProfile {
  const actorId = input.actor_id ?? "unknown_actor";

  const mode = input.override?.mode ?? "BALANCED";
  const priority = input.override?.priority ?? "SERVICE";
  const horizon = input.override?.horizon ?? "SHORT_TERM";
  const pressure = input.override?.pressure ?? "MEDIUM";

  return {
    actor_id: actorId,
    source: input.override ? "REQUESTED" : "DEFAULT",
    confidence: input.override ? 1 : 0.5,

    mode,
    priority,
    horizon,
    pressure,

    preferences: {
      preferSingleAction: mode === "SAFE",
      preferMultiAction: mode === "AGGRESSIVE",
      avoidSystemicActions: mode === "SAFE",
      preferFastRecovery: pressure === "HIGH" || priority === "SERVICE",
    },
  };
}