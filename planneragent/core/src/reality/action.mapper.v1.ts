// core/src/reality/action.mapper.v1.ts
// ======================================================
// PlannerAgent — Action Mapper v1
// Canonical Source of Truth
// ======================================================

import type { AnomalyClassification, AnomalyType } from "./anomaly.classifier.v1";

// ------------------------------------------------------

export type ActionPriority = "LOW" | "MEDIUM" | "HIGH";
export type ActionEffort = "LOW" | "MEDIUM" | "HIGH";

export type RequiredAction = {
  action: string;
  type: AnomalyType;
  priority: ActionPriority;
  blocking: boolean;
  effort: ActionEffort;
  reason: string;
};

// ------------------------------------------------------

export function mapActionsFromAnomaly(params: {
  anomaly: AnomalyClassification;
}): RequiredAction[] {

  const { anomaly } = params;

  const actions: RequiredAction[] = [];

  switch (anomaly.type) {

    // --------------------------------------------------
    // DATA ISSUE
    // --------------------------------------------------

    case "DATA_ISSUE":

      actions.push({
        action: "COLLECT_MISSING_DATA",
        type: anomaly.type,
        priority: "HIGH",
        blocking: true,
        effort: "LOW",
        reason: "Decision blocked due to insufficient or unreliable data",
      });

      actions.push({
        action: "VERIFY_DATA_SOURCES",
        type: anomaly.type,
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
        reason: "Data sources may be incomplete or inconsistent",
      });

      break;

    // --------------------------------------------------
    // PROCESS ISSUE
    // --------------------------------------------------

    case "PROCESS_ISSUE":

      actions.push({
        action: "STABILIZE_PROCESS",
        type: anomaly.type,
        priority: "HIGH",
        blocking: false,
        effort: "HIGH",
        reason: "High variability detected in production process",
      });

      actions.push({
        action: "INVESTIGATE_VARIANCE_ROOT_CAUSE",
        type: anomaly.type,
        priority: "HIGH",
        blocking: false,
        effort: "MEDIUM",
        reason: "Variance suggests inconsistent execution",
      });

      break;

    // --------------------------------------------------
    // PLAN ISSUE
    // --------------------------------------------------

    case "PLAN_ISSUE":

      actions.push({
        action: "REVISE_PLAN",
        type: anomaly.type,
        priority: "HIGH",
        blocking: false,
        effort: "MEDIUM",
        reason: "Plan does not reflect actual production behavior",
      });

      actions.push({
        action: "ALIGN_PLAN_WITH_REALITY",
        type: anomaly.type,
        priority: "MEDIUM",
        blocking: false,
        effort: "LOW",
        reason: "Mismatch between expected and actual ratios",
      });

      break;

    // --------------------------------------------------
    // MIXED
    // --------------------------------------------------

    case "MIXED":

      actions.push({
        action: "FREEZE_DECISION_SCOPE",
        type: anomaly.type,
        priority: "HIGH",
        blocking: true,
        effort: "LOW",
        reason: "Multiple conflicting signals detected",
      });

      actions.push({
        action: "SEPARATE_PLAN_AND_PROCESS_ANALYSIS",
        type: anomaly.type,
        priority: "HIGH",
        blocking: false,
        effort: "MEDIUM",
        reason: "Need to isolate plan vs process issues",
      });

      break;
  }

  // ------------------------------------------------------
  // SEVERITY ADJUSTMENT
  // ------------------------------------------------------

  return adjustActionsBySeverity(actions, anomaly.severity);
}

// ------------------------------------------------------
// SEVERITY LOGIC
// ------------------------------------------------------

function adjustActionsBySeverity(
  actions: RequiredAction[],
  severity: "LOW" | "MEDIUM" | "HIGH"
): RequiredAction[] {

  return actions.map((a) => {

    if (severity === "HIGH") {
      return {
        ...a,
        priority: "HIGH",
        blocking: true,
      };
    }

    if (severity === "LOW") {
      return {
        ...a,
        priority: "LOW",
        blocking: false,
      };
    }

    return a;
  });
}