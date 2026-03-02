// planneragent/ui/events/uiEvents.ts
// Canonical UI Events — P8
// UI can emit signals, never actions.

export type DataAwarenessState =
  | "SNAPSHOT"
  | "BEHAVIORAL"
  | "STRUCTURAL";

export type PlanCoherenceState =
  | "COHERENT"
  | "SOME_GAPS"
  | "INCOHERENT";

export type RealityAlignmentState =
  | "ALIGNED"
  | "DRIFTING"
  | "MISALIGNED";

export type DecisionPressureState =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

/**
 * UI-level signals.
 * These are visual indicators only.
 */
export type UiSignal =
  | {
      type: "DATA_AWARENESS";
      state: DataAwarenessState;
    }
  | {
      type: "PLAN_COHERENCE";
      state: PlanCoherenceState;
    }
  | {
      type: "REALITY_ALIGNMENT";
      state: RealityAlignmentState;
    }
  | {
      type: "DECISION_PRESSURE";
      state: DecisionPressureState;
    };

/**
 * Event emitted by UI when a signal is rendered or acknowledged.
 * No side effects. No authority.
 */
export type UiEvent =
  | {
      kind: "UI_SIGNAL_VIEWED";
      signal: UiSignal;
      timestamp: number;
    };