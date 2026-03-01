// planneragent/ui/state/uiState.ts

export type UiMode =
  | "VISION"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL";

export type UiAuthorityLabel = {
  title: string;
  subtitle: string;
};

export type UiState = {
  mode: UiMode;
  authority: UiAuthorityLabel;
  executionAllowed: boolean;
};

const authorityMap: Record<UiMode, UiAuthorityLabel> = {
  VISION: {
    title: "VISION",
    subtitle: "Observation only. No execution.",
  },
  JUNIOR: {
    title: "JUNIOR",
    subtitle: "Advisory. Execution by approval.",
  },
  SENIOR: {
    title: "SENIOR",
    subtitle: "Delegated execution within scope.",
  },
  PRINCIPAL: {
    title: "PRINCIPAL",
    subtitle: "Budget and authority ownership.",
  },
};

export function getUiState(mode: UiMode = "VISION"): UiState {
  return {
    mode,
    authority: authorityMap[mode],
    executionAllowed: mode === "SENIOR" || mode === "PRINCIPAL",
  };
}