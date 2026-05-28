// core/src/attention/attention.narrative.ts
// ============================================================
// PlannerAgent — Working Attention Narrative
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transform active operational working attention into
// deterministic VISION-compatible narrative.
//
// DOES NOT:
// - use LLMs
// - authorize execution
// - create governance authority
// - escalate pressure
// - generate recommendations
//
// DOES:
// - expose human-directed operational focus
// - reveal triggered watched conditions
// - detect saturation
// - expose stale / obsolete / cancellable attention
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Attention narrative says:
//
// "What the human asked PlannerAgent to watch."
//
// NOT:
//
// "What PlannerAgent decided matters."
//
// ============================================================

import type {
  AttentionEvent,
  AttentionSubscription,
} from "./attention.types";

import type {
  AttentionMemoryResult,
} from "./attention.memory";

import type {
  AttentionLifecycleEvaluation,
} from "./attention.lifecycle";

export type AttentionLoad =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface AttentionNarrative {
  active: boolean;
  headline: string;
  attentionLoad: AttentionLoad;
  saturationRisk: boolean;
  operationalFocus: string[];
  watching: string[];
  triggered: string[];
  stale: string[];
  obsolete: string[];
  cancellable: string[];
  longitudinalFocus: string[];
  humanAttentionSummary: string[];
  summary: string[];
}

export function buildAttentionNarrative(params: {
  subscriptions: AttentionSubscription[];
  events: AttentionEvent[];
  memory?: AttentionMemoryResult;
  lifecycle?: AttentionLifecycleEvaluation[];
}): AttentionNarrative {

  const subscriptions =
    params.subscriptions ?? [];

  const events =
    params.events ?? [];

  const lifecycle =
    params.lifecycle ?? [];

  const memory =
    params.memory;

  const active =
    subscriptions.length > 0;

  const attentionLoad =
    resolveAttentionLoad(subscriptions.length);

  const saturationRisk =
    attentionLoad === "HIGH" ||
    attentionLoad === "CRITICAL";

  if (!active) {
    return {
      active: false,
      headline: "No active operational attention subscriptions.",
      attentionLoad,
      saturationRisk: false,
      operationalFocus: [],
      watching: [],
      triggered: [],
      stale: [],
      obsolete: [],
      cancellable: [],
      longitudinalFocus: [],
      humanAttentionSummary: ["no_active_attention"],
      summary: ["attention:inactive"],
    };
  }

  const watching =
    subscriptions.map(formatSubscription);

  const triggered =
    events.map(formatEvent);

  const stale =
    lifecycle
      .filter(x => x.lifecycleState === "STALE")
      .map(x => `${x.attention_id} / ${x.reason}`);

  const obsolete =
    lifecycle
      .filter(x => x.lifecycleState === "OBSOLETE")
      .map(x => `${x.attention_id} / ${x.reason}`);

  const cancellable =
    lifecycle
      .filter(x => x.cancellable)
      .map(x => `${x.attention_id} / ${x.lifecycleState}`);

  const longitudinalFocus: string[] = [];

  if (memory?.dominantFocus) {
    longitudinalFocus.push(
      [
        memory.dominantFocus.scope,
        memory.dominantFocus.trigger,
        `requests:${memory.dominantFocus.timesRequested}`,
      ].join(" / ")
    );
  }

  const operationalFocus =
    subscriptions.map(s => {
      const target =
        s.target_label ??
        s.target_ref ??
        "operational target";

      return `Watching ${target} for ${s.trigger}`;
    });

  const headline =
    buildHeadline({
      subscriptions: subscriptions.length,
      triggered: events.length,
      stale: stale.length,
      obsolete: obsolete.length,
      saturationRisk,
    });

  const humanAttentionSummary = [
    `subscriptions:${subscriptions.length}`,
    `triggered:${events.length}`,
    `attention_load:${attentionLoad}`,
    `stale:${stale.length}`,
    `obsolete:${obsolete.length}`,
    `cancellable:${cancellable.length}`,
  ];

  if (memory?.dominantFocus) {
    humanAttentionSummary.push(
      `dominant_focus:${memory.dominantFocus.scope}`,
      `dominant_trigger:${memory.dominantFocus.trigger}`
    );
  }

  const summary = [
    "attention:active",
    `subscriptions:${subscriptions.length}`,
    `triggered:${events.length}`,
    `load:${attentionLoad}`,
  ];

  if (events.length > 0) {
    summary.push("human_attention_required");
  }

  if (saturationRisk) {
    summary.push("attention_saturation_risk");
  }

  if (stale.length > 0) {
    summary.push("stale_attention_present");
  }

  if (obsolete.length > 0) {
    summary.push("obsolete_attention_present");
  }

  if (cancellable.length > 0) {
    summary.push("attention_cleanup_available");
  }

  if (memory?.dominantFocus) {
    summary.push("longitudinal_attention_detected");
  }

  return {
    active,
    headline,
    attentionLoad,
    saturationRisk,
    operationalFocus,
    watching,
    triggered,
    stale,
    obsolete,
    cancellable,
    longitudinalFocus,
    humanAttentionSummary,
    summary,
  };
}

function formatSubscription(
  s: AttentionSubscription
): string {

  const target =
    s.target_label ??
    s.target_ref ??
    "operational target";

  return [
    s.scope,
    s.trigger,
    target,
  ].join(" / ");
}

function formatEvent(
  e: AttentionEvent
): string {

  const target =
    e.target_label ??
    e.target_ref ??
    "operational target";

  return [
    e.scope,
    e.trigger,
    target,
  ].join(" / ");
}

function resolveAttentionLoad(
  count: number
): AttentionLoad {

  if (count <= 0) return "NONE";
  if (count <= 5) return "LOW";
  if (count <= 15) return "MEDIUM";
  if (count <= 30) return "HIGH";

  return "CRITICAL";
}

function buildHeadline(params: {
  subscriptions: number;
  triggered: number;
  stale: number;
  obsolete: number;
  saturationRisk: boolean;
}): string {

  if (params.triggered > 0) {
    return `${params.triggered} watched operational condition(s) triggered human attention.`;
  }

  if (params.obsolete > 0) {
    return "Some watched operational conditions are no longer present in observed reality.";
  }

  if (params.stale > 0) {
    return "Some watched operational attention has not been refreshed recently.";
  }

  if (params.saturationRisk) {
    return "Human-directed operational attention is becoming saturated.";
  }

  return "PlannerAgent is currently observing human-directed operational attention.";
}