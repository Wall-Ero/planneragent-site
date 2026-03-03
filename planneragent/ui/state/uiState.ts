// planneragent/ui/state/uiState.ts
// =====================================================
// UI State — Canonical
// Interprets sandbox signals for UI rendering
// =====================================================

export type UiMode =
  | "VISION"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL";

export type DataAwarenessLevel =
  | "SNAPSHOT"
  | "BEHAVIORAL"
  | "STRUCTURAL";

export type PlanState =
  | "COHERENT"
  | "SOME_GAPS"
  | "INCOHERENT";

export type RealityState =
  | "ALIGNED"
  | "DRIFTING"
  | "MISALIGNED";

export type DecisionPressureState =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type SandboxSignals = {
  data_awareness?: DataAwarenessLevel;
  plan?: PlanState;
  reality?: RealityState;
  decision_pressure?: DecisionPressureState;
};

export type UiAuthorityState = {
  title: string;
  subtitle: string;
};

export type UiState = {
  authority: UiAuthorityState;
  signals: SandboxSignals;
};

export function getUiState(
  mode: UiMode,
  signals: SandboxSignals
): UiState {

  return {
    authority: authorityStateForMode(mode),
    signals
  };
}

function authorityStateForMode(mode: UiMode): UiAuthorityState {

  switch (mode) {

    case "VISION":
      return {
        title: "VISION",
        subtitle: "Observation only. No execution."
      };

    case "JUNIOR":
      return {
        title: "JUNIOR",
        subtitle: "Advisory. Execution by approval."
      };

    case "SENIOR":
      return {
        title: "SENIOR",
        subtitle: "Delegated execution within scope."
      };

    case "PRINCIPAL":
      return {
        title: "PRINCIPAL",
        subtitle: "Budget & responsibility authority."
      };

  }
}