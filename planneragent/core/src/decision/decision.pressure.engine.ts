// core/src/decision/decision.pressure.engine.ts
// ======================================================
// PlannerAgent — Decision Pressure Engine (Canonical)
// Source of Truth
// ======================================================

export type DecisionPressure = "LOW" | "MEDIUM" | "HIGH";

type Input = {
  planCoherent: boolean;
  correctionEffect: "FULL" | "PARTIAL" | "NONE";
  anomaly: boolean;
  realityScore?: number | null;
};

export function computeDecisionPressure(input: Input): DecisionPressure {

  // --------------------------------------------------
  // 🟥 PLAN NON COERENTE → pressione massima
  // --------------------------------------------------

  if (!input.planCoherent) {
    return "HIGH";
  }

  // --------------------------------------------------
  // 🟢 COMPLETAMENTE RISOLVIBILE
  // --------------------------------------------------

  if (input.correctionEffect === "FULL") {
    return input.anomaly ? "MEDIUM" : "LOW";
  }

  // --------------------------------------------------
  // 🟡 PARZIALMENTE RISOLVIBILE
  // --------------------------------------------------

  if (input.correctionEffect === "PARTIAL") {
    return "MEDIUM";
  }

  // --------------------------------------------------
  // 🔴 NON RISOLVIBILE
  // --------------------------------------------------

  if (input.anomaly) {
    return "HIGH";
  }

  if (
    typeof input.realityScore === "number" &&
    input.realityScore < 0.6
  ) {
    return "HIGH";
  }

  return "MEDIUM";
}