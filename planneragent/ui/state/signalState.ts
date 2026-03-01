// planneragent/ui/state/signalState.ts

export type SignalLevel = "LOW" | "MEDIUM" | "HIGH";

export type SignalState = {
  awareness: SignalLevel;
  pressure: SignalLevel;
};

export function getSignalState(): SignalState {
  // placeholder deterministico
  return {
    awareness: "LOW",
    pressure: "LOW",
  };
}