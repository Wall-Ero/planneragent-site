// ui/state/uiState.ts
// =====================================================
// UI State — Canonical (P8 · UI-only)
// Renders authority & data awareness (never creates it)
// =====================================================

import type { DataAwarenessLevel } from "../../core/datasets/datasetClassifier";

export type UiMode =
  | "VISION"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL";

export type UiDataAwarenessState = {
  level: DataAwarenessLevel;
  label: string;
};

export type UiAuthorityState = {
  title: string;
  subtitle: string;
};

export type UiState = {
  authority: UiAuthorityState;
  dataAwareness: UiDataAwarenessState;
};

export function getUiState(
  mode: UiMode,
  dataAwareness: DataAwarenessLevel
): UiState {
  return {
    authority: authorityStateForMode(mode),
    dataAwareness: {
      level: dataAwareness,
      label: dataAwarenessLabel(dataAwareness),
    },
  };
}

// -----------------------------------------------------
// Authority rendering (UI semantics only)
// -----------------------------------------------------
function authorityStateForMode(mode: UiMode): UiAuthorityState {
  switch (mode) {
    case "VISION":
      return {
        title: "VISION",
        subtitle: "Observation only. No execution.",
      };

    case "JUNIOR":
      return {
        title: "JUNIOR",
        subtitle: "Advisory. Execution by approval.",
      };

    case "SENIOR":
      return {
        title: "SENIOR",
        subtitle: "Delegated execution within scope.",
      };

    case "PRINCIPAL":
      return {
        title: "PRINCIPAL",
        subtitle: "Budget & responsibility authority.",
      };
  }
}

// -----------------------------------------------------
// Data Awareness rendering (epistemic confidence)
// -----------------------------------------------------
function dataAwarenessLabel(level: DataAwarenessLevel): string {
  switch (level) {
    case "SNAPSHOT":
      return "Snapshot data (static)";

    case "BEHAVIORAL":
      return "Behavioral data (events & time)";

    case "STRUCTURAL":
      return "Structural data (system-of-record)";
  }
}