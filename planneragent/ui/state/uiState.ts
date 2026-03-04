// planneragent/ui/state/uiState.ts
// =====================================================
// UI State — Canonical (P8 · UI-only)
// Renders authority (never creates it)
// =====================================================

export type UiMode = "VISION" | "JUNIOR" | "SENIOR" | "PRINCIPAL";

export type UiAuthorityState = {
  title: string;
  subtitle: string;
};

export type UiState = {
  authority: UiAuthorityState;
};

export function getUiState(mode: UiMode): UiState {
  return {
    authority: authorityStateForMode(mode),
  };
}

function authorityStateForMode(mode: UiMode): UiAuthorityState {
  switch (mode) {
    case "VISION":
      return { title: "VISION", subtitle: "Observation only. No execution." };
    case "JUNIOR":
      return { title: "JUNIOR", subtitle: "Advisory. Execution by approval." };
    case "SENIOR":
      return { title: "SENIOR", subtitle: "Delegated execution within scope." };
    case "PRINCIPAL":
      return { title: "PRINCIPAL", subtitle: "Budget & responsibility authority." };
  }
}