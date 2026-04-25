// core/src/decision/decision.pressure.v2.ts

export type DecisionPressureLevel = "LOW" | "MEDIUM" | "HIGH";

function maxPressure(levels: DecisionPressureLevel[]): DecisionPressureLevel {
  if (levels.includes("HIGH")) return "HIGH";
  if (levels.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

export function computeDecisionPressureV2(params: {
  problemType: "PLAN" | "REALITY" | "NONE";
  correctionEffect: "FULL" | "PARTIAL" | "NONE";
  realityScore?: number | null;

  // 🔥 NUOVI INPUT
  shortageUnits: number;
  demandUnits: number;
  inventoryLevel: number;
  executionGap?: any[];
}) {
  const {
    problemType,
    correctionEffect,
    realityScore,
    shortageUnits,
    demandUnits,
    inventoryLevel,
    executionGap,
  } = params;

  // --------------------------------------------------
  // STRUCTURAL
  // --------------------------------------------------

  const structural: DecisionPressureLevel =
    problemType === "PLAN"
      ? "HIGH"
      : problemType === "REALITY"
      ? "MEDIUM"
      : "LOW";

  // --------------------------------------------------
  // OPERATIONAL
  // --------------------------------------------------

  const operational: DecisionPressureLevel =
    (executionGap ?? []).length > 0 ? "MEDIUM" : "LOW";

  // --------------------------------------------------
  // TEMPORAL (🔥 QUESTA È LA CHIAVE)
  // --------------------------------------------------

  let temporal: DecisionPressureLevel = "LOW";

  if (demandUnits > inventoryLevel) {
    temporal = "HIGH";
  }

  // --------------------------------------------------
  // SHORTAGE BOOST
  // --------------------------------------------------

  let shortagePressure: DecisionPressureLevel = "LOW";

  if (shortageUnits > 0) {
    shortagePressure =
      shortageUnits > 100 ? "HIGH" : "MEDIUM";
  }

  // --------------------------------------------------
  // CORRECTION EFFECT MODIFIER
  // --------------------------------------------------

  let correctionModifier: DecisionPressureLevel = "LOW";

  if (correctionEffect === "NONE") {
    correctionModifier = "HIGH";
  } else if (correctionEffect === "PARTIAL") {
    correctionModifier = "MEDIUM";
  }

  // --------------------------------------------------
  // FINAL
  // --------------------------------------------------

  const final = maxPressure([
    structural,
    operational,
    temporal,
    shortagePressure,
    correctionModifier,
  ]);

  return {
    final,
    breakdown: {
      structural,
      operational,
      temporal,
      shortage: shortagePressure,
      correction: correctionModifier,
    },
  };
}