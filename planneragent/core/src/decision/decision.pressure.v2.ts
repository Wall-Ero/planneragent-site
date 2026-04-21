// core/src/decision/decision.pressure.v2.ts
// ======================================================
// PlannerAgent — Decision Pressure Engine V2 (Reality-Driven)
// Canonical Source of Truth
// ======================================================

export type DecisionPressure = "LOW" | "MEDIUM" | "HIGH";

type Input = {
  problemType: "PLAN" | "REALITY" | "NONE";
  correctionEffect: "FULL" | "PARTIAL" | "NONE";
  realityScore?: number | null;

  // opzionale
  horizonDays?: number;
};

type Breakdown = {
  structural: DecisionPressure;
  operational: DecisionPressure;
  temporal: DecisionPressure;
};

export function computeDecisionPressureV2(input: Input): {
  final: DecisionPressure;
  breakdown: Breakdown;
} {

  // --------------------------------------------------
  // 🔴 HARD RULE — PLAN NON GENERA DECISION PRESSURE
  // --------------------------------------------------

  if (input.problemType === "PLAN") {
    return {
      final: "LOW",
      breakdown: {
        structural: "LOW",
        operational: "LOW",
        temporal: "LOW",
      },
    };
  }

  // --------------------------------------------------
  // 🟧 OPERATIONAL (REALITY) — DRIVER PRINCIPALE
  // --------------------------------------------------

  let operational: DecisionPressure = "LOW";

  const weakReality =
    typeof input.realityScore === "number" &&
    input.realityScore < 0.5;

  if (input.problemType === "REALITY") {

    if (input.correctionEffect === "NONE") {
      operational = "HIGH";
    }

    else if (input.correctionEffect === "PARTIAL") {
      operational = "MEDIUM";
    }

    else {
      operational = "LOW";
    }

  } else {

    // sistema non rotto ma fragile
    if (weakReality) {
      operational = "MEDIUM";
    } else {
      operational = "LOW";
    }
  }

  // --------------------------------------------------
  // 🟨 TEMPORAL (TIME WINDOW)
  // --------------------------------------------------

  let temporal: DecisionPressure = "LOW";

  const horizon = input.horizonDays ?? 30;

  if (horizon <= 3) temporal = "HIGH";
  else if (horizon <= 7) temporal = "MEDIUM";
  else temporal = "LOW";

  // --------------------------------------------------
  // 🧠 FUSIONE (REALITY-DRIVEN)
  // --------------------------------------------------

  const final = mergePressure(operational, temporal);

  return {
    final,
    breakdown: {
      structural: "LOW",
      operational,
      temporal,
    },
  };
}

// --------------------------------------------------
// HELPER — MERGE CORRETTO
// --------------------------------------------------

function mergePressure(
  operational: DecisionPressure,
  temporal: DecisionPressure
): DecisionPressure {

  if (operational === "HIGH") return "HIGH";

  if (operational === "MEDIUM") {
    return temporal === "HIGH" ? "HIGH" : "MEDIUM";
  }

  // operational LOW
  if (temporal === "HIGH") return "MEDIUM";

  return "LOW";
}