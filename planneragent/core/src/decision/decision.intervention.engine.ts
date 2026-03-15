// core/src/decision/decision.intervention.engine.ts
// ======================================================
// PlannerAgent — Decision Intervention Engine
// Canonical Source of Truth
//
// Determines when PlannerAgent should speak,
// remain silent, or escalate an operational signal.
//
// This module transforms pressure states into
// governed intervention decisions.
// ======================================================

import type { PlanTier } from "../sandbox/contracts.v2";
import type {
  PressureEvaluationResult,
  PressureLevel,
} from "../pressure/pressure.engine";

/* ======================================================
 INTERVENTION TYPES
====================================================== */

export type InterventionType =
  | "SILENT"
  | "MONITOR"
  | "ADVISORY"
  | "ESCALATION";

/* ======================================================
 INTERVENTION RESULT
====================================================== */

export type InterventionDecision = {

  intervention: InterventionType;

  should_notify: boolean;

  message?: string;

  reason: string;

};

/* ======================================================
 LEVEL → INTERVENTION MAPPING
====================================================== */

function mapPressureToIntervention(
  level: PressureLevel
): InterventionType {

  switch (level) {

    case "LOW":
      return "SILENT";

    case "MEDIUM":
      return "MONITOR";

    case "HIGH":
      return "ADVISORY";

    case "CRITICAL":
      return "ESCALATION";

  }

}

/* ======================================================
 MESSAGE BUILDER
====================================================== */

function buildInterventionMessage(
  level: PressureLevel,
  signals: PressureEvaluationResult["signals"]
): string | undefined {

  if (signals.length === 0) {
    return undefined;
  }

  const primary = signals[0];

  switch (level) {

    case "HIGH":
      return `Operational anomaly detected: ${primary.description}`;

    case "CRITICAL":
      return `Critical operational risk detected: ${primary.description}`;

    default:
      return undefined;

  }

}

/* ======================================================
 PLAN POLICY
====================================================== */

function planAllowsIntervention(plan: PlanTier): boolean {

  switch (plan) {

    case "VISION":
      return true;

    case "GRADUATE":
      return true;

    case "JUNIOR":
    case "SENIOR":
    case "PRINCIPAL":
      return true;

    case "CHARTER":
      return false;

  }

}

/* ======================================================
 MAIN ENGINE
====================================================== */

export function evaluateInterventionDecision(
  plan: PlanTier,
  pressure: PressureEvaluationResult
): InterventionDecision {

  if (!planAllowsIntervention(plan)) {

    return {
      intervention: "SILENT",
      should_notify: false,
      reason: "PLAN_POLICY_BLOCKED",
    };

  }

  const intervention = mapPressureToIntervention(
    pressure.level
  );

  const message = buildInterventionMessage(
    pressure.level,
    pressure.signals
  );

  switch (intervention) {

    case "SILENT":

      return {
        intervention,
        should_notify: false,
        reason: "PRESSURE_LOW",
      };

    case "MONITOR":

      return {
        intervention,
        should_notify: false,
        reason: "PRESSURE_MEDIUM_MONITORING",
      };

    case "ADVISORY":

      return {
        intervention,
        should_notify: true,
        message,
        reason: "PRESSURE_HIGH_ADVISORY",
      };

    case "ESCALATION":

      return {
        intervention,
        should_notify: true,
        message,
        reason: "PRESSURE_CRITICAL_ESCALATION",
      };

  }

}
