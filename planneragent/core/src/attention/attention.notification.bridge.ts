// core/src/attention/attention.notification.bridge.ts
// ============================================================
// PlannerAgent — Attention Notification Bridge
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Convert attention events into notification payloads.
//
// This layer DOES NOT:
// - send notifications
// - decide whether attention is triggered
// - authorize execution
// - create governance escalation
//
// It DOES:
// - shape notification payloads
// - preserve human request context
// - keep messaging deterministic
//
// ============================================================

import type {
  AttentionEvent,
  AttentionNotificationPayload,
} from "./attention.types";

function titleForEvent(
  event: AttentionEvent
): string {

  switch (event.trigger) {

    case "DELIVERY_DATE_CHANGED":
      return "Delivery changed";

    case "QUANTITY_CHANGED":
      return "Quantity changed";

    case "PLAN_BROKEN":
      return "Plan requires attention";

    case "REALITY_DRIFTING":
      return "Reality is drifting";

    case "REALITY_MISALIGNED":
      return "Reality is misaligned";

    case "DECISION_PRESSURE_HIGH":
      return "Decision pressure is high";

    case "EXECUTION_BLOCKED":
      return "Execution is blocked";

    case "GOVERNANCE_REVIEW_REQUIRED":
      return "Governance review required";

    case "CUSTOM_CONDITION":
      return "Watched condition matched";

    default:
      return "Operational attention required";
  }

}

function messageForEvent(
  event: AttentionEvent
): string {

  const target =
    event.target_label ??
    event.target_ref ??
    "the watched operational condition";

  return [
    `${event.reason}`,
    `Target: ${target}.`,
    `Original request: ${event.human_request}`,
  ].join(" ");

}

export function buildAttentionNotificationPayload(
  event: AttentionEvent
): AttentionNotificationPayload {

  return {

    attention_id:
      event.attention_id,

    priority:
      event.priority,

    title:
      titleForEvent(event),

    message:
      messageForEvent(event),

    target_ref:
      event.target_ref,

    target_label:
      event.target_label,

    reason:
      event.reason,

    created_at:
      event.triggered_at,

    metadata: {
      scope:
        event.scope,
      trigger:
        event.trigger,
      evidence:
        event.evidence ?? {},
    },
  };

}

export function buildAttentionNotificationPayloads(
  events: AttentionEvent[]
): AttentionNotificationPayload[] {

  return events.map(
    buildAttentionNotificationPayload
  );

}