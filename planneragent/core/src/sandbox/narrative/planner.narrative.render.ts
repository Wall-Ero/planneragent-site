// src/sandbox/narrative/planner.narrative.render.ts
// ============================================================
// PlannerAgent — Operational Narrative Renderer
// Canonical Snapshot · Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transform deterministic planner cognition into
// operational planner language.
//
// This layer:
//
// - DOES NOT generate AI prose
// - DOES NOT hallucinate
// - DOES NOT optimize
// - DOES NOT invent narratives
//
// It DOES:
//
// - verbalize operational posture
// - summarize operational reality
// - communicate planner cognition
// - expose urgency and execution posture
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// PlannerAgent must sound like:
//
// - a senior operational planner
// - a governance-aware operator
// - a runtime operational authority
//
// NOT:
//
// - a chatbot
// - an AI assistant
// - an optimizer explanation engine
//
// ============================================================

import type {
  PlannerNarrativeState,
} from "./plannerNarrative";

// ============================================================
// TYPES
// ============================================================

export interface PlannerNarrativeRender {

  headline: string;

  operationalSummary: string;

  plannerStatement: string;

  urgencyStatement?: string;

  executionStatement?: string;
}

// ============================================================
// MAIN
// ============================================================

export function renderPlannerNarrative(
  state: PlannerNarrativeState
): PlannerNarrativeRender {

  return {

    headline:
      renderHeadline(state),

    operationalSummary:
      renderOperationalSummary(state),

    plannerStatement:
      renderPlannerStatement(state),

    urgencyStatement:
      renderUrgencyStatement(state),

    executionStatement:
      renderExecutionStatement(state),
  };
}

// ============================================================
// HEADLINE
// ============================================================

function renderHeadline(
  state: PlannerNarrativeState
): string {

  if (
    state.operationalCondition === "CRITICAL"
  ) {

    return "Operational reality is unstable.";
  }

  if (
    state.operationalCondition === "UNSTABLE"
  ) {

    return "Operational instability detected.";
  }

  if (
    state.operationalCondition === "SHIFTING"
  ) {

    return "Operational reality is shifting.";
  }

  return "Operational reality remains stable.";
}

// ============================================================
// OPERATIONAL SUMMARY
// ============================================================

function renderOperationalSummary(
  state: PlannerNarrativeState
): string {

  // --------------------------------------------------------
  // REALITY CORRECTION
  // --------------------------------------------------------

  if (
    state.planningMode === "REALITY_CORRECTION"
  ) {

    if (
      state.recoveryPossible
      && state.reconciliationStatus === "FULL"
    ) {

      return [
        "Inventory reconciliation detected blocking mismatches",
        "between ERP state and reconstructed operational reality.",
        "",
        "Corrective execution remains capable",
        "of fully restoring alignment."
      ].join(" ");
    }

    return [
      "Operational divergence has been detected",
      "between execution reality and recorded system state."
    ].join(" ");
  }

  // --------------------------------------------------------
  // DEFAULT
  // --------------------------------------------------------

  return [
    "PlannerAgent is monitoring operational conditions",
    "and evaluating execution consistency."
  ].join(" ");
}

// ============================================================
// PLANNER STATEMENT
// ============================================================

function renderPlannerStatement(
  state: PlannerNarrativeState
): string {

  // --------------------------------------------------------
  // CONTAINMENT
  // --------------------------------------------------------

  if (
    state.executionPosture === "CONTAIN"
  ) {

    return [
      "Containment posture is active",
      "to prevent further operational divergence."
    ].join(" ");
  }

  // --------------------------------------------------------
  // STABILIZATION
  // --------------------------------------------------------

  if (
    state.executionPosture === "STABILIZE"
  ) {

    return [
      "Operational stabilization is currently required",
      "to restore execution consistency."
    ].join(" ");
  }

  // --------------------------------------------------------
  // EXECUTION
  // --------------------------------------------------------

  if (
    state.executionPosture === "EXECUTE"
  ) {

    return [
      "PlannerAgent is operating",
      "within delegated execution authority."
    ].join(" ");
  }

  // --------------------------------------------------------
  // ADVISORY
  // --------------------------------------------------------

  if (
    state.executionPosture === "ADVISE"
  ) {

    return [
      "Execution authority remains human-controlled.",
      "PlannerAgent is currently operating in advisory mode."
    ].join(" ");
  }

  // --------------------------------------------------------
  // OBSERVE
  // --------------------------------------------------------

  return [
    "PlannerAgent is currently observing operational reality."
  ].join(" ");
}

// ============================================================
// URGENCY
// ============================================================

function renderUrgencyStatement(
  state: PlannerNarrativeState
): string | undefined {

  if (state.pressureLevel === "HIGH") {

    return [
      "Decision pressure is increasing.",
      "Operational recovery windows may narrow over time."
    ].join(" ");
  }

  if (state.pressureLevel === "MEDIUM") {

    return [
      "Operational pressure is building",
      "and should be monitored closely."
    ].join(" ");
  }

  return undefined;
}

// ============================================================
// EXECUTION
// ============================================================

function renderExecutionStatement(
  state: PlannerNarrativeState
): string | undefined {

  if (!state.executionAllowed) {

    return [
      "Execution authority is currently restricted."
    ].join(" ");
  }

  if (
    state.executionOutcome === "SUCCESS"
  ) {

    return [
      "Corrective execution completed successfully."
    ].join(" ");
  }

  if (
    state.executionOutcome === "PARTIAL"
  ) {

    return [
      "Corrective execution is active",
      "but operational stabilization is still ongoing."
    ].join(" ");
  }

  if (
    state.executionOutcome === "FAILED"
  ) {

    return [
      "Corrective execution failed",
      "and manual intervention may be required."
    ].join(" ");
  }

  if (
    state.executionOutcome === "BLOCKED"
  ) {

    return [
      "Execution remains blocked by governance constraints."
    ].join(" ");
  }

  return undefined;
}