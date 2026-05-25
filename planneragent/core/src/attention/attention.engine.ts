// core/src/attention/attention.engine.ts
// ============================================================
// PlannerAgent — Operational Working Attention Engine
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Evaluate active human-directed attention subscriptions against
// current operational runtime context.
//
// This layer DOES NOT:
// - send notifications
// - authorize execution
// - create authority
// - persist memory
//
// It DOES:
// - decide whether a subscription is triggered
// - suppress noise according to policy
// - produce attention events
//
// ============================================================

import type {
  AttentionEvent,
  AttentionEvaluationContext,
  AttentionEvaluationResult,
  AttentionSubscription,
} from "./attention.types";

function nowIso(): string {
  return new Date().toISOString();
}

function valueAtPath(
  source: any,
  path?: string
): unknown {

  if (!source || !path) return undefined;

  return path
    .split(".")
    .reduce(
      (acc, key) =>
        acc && typeof acc === "object"
          ? acc[key]
          : undefined,
      source
    );

}

function conditionMatches(
  subscription: AttentionSubscription,
  context: AttentionEvaluationContext
): boolean {

  const condition =
    subscription.condition;

  if (!condition) return true;

  const current =
    valueAtPath(
      context,
      condition.field
    );

  switch (condition.operator) {

    case "EQUALS":
      return current === condition.value;

    case "NOT_EQUALS":
      return current !== condition.value;

    case "GREATER_THAN":
      return Number(current) > Number(condition.value);

    case "LESS_THAN":
      return Number(current) < Number(condition.value);

    case "CONTAINS":
      return String(current ?? "")
        .includes(String(condition.value ?? ""));

    case "EXISTS":
      return current !== undefined && current !== null;

    case "CHANGED": {
      const previous =
        valueAtPath(
          context.previous_snapshot,
          condition.field
        );

      const next =
        valueAtPath(
          context.current_snapshot,
          condition.field
        );

      return JSON.stringify(previous) !== JSON.stringify(next);
    }

    default:
      return true;
  }

}

function triggerMatches(
  subscription: AttentionSubscription,
  context: AttentionEvaluationContext
): {
  triggered: boolean;
  reason: string;
  evidence?: Record<string, unknown>;
} {

  const signals =
    context.signals ?? {};

  const governance =
    context.governance ?? {};

  const execution =
    context.execution ?? {};

  const previous =
    context.previous_snapshot ?? {};

  const current =
    context.current_snapshot ?? {};

  switch (subscription.trigger) {

    case "REALITY_DRIFTING":
      return {
        triggered:
          signals.reality === "DRIFTING",
        reason:
          "Reality is drifting from the watched operational condition.",
        evidence: {
          reality:
            signals.reality,
        },
      };

    case "REALITY_MISALIGNED":
      return {
        triggered:
          signals.reality === "MISALIGNED",
        reason:
          "Reality is misaligned with the watched operational condition.",
        evidence: {
          reality:
            signals.reality,
        },
      };

    case "PLAN_BROKEN":
      return {
        triggered:
          signals.plan_state === "BROKEN" ||
          signals.plan?.level === "INCOHERENT",
        reason:
          "The watched plan condition is broken or incoherent.",
        evidence: {
          plan_state:
            signals.plan_state,
          plan:
            signals.plan,
        },
      };

    case "DECISION_PRESSURE_HIGH":
      return {
        triggered:
          signals.decision_pressure === "HIGH" ||
          signals.decision_pressure === "CRITICAL",
        reason:
          "Decision pressure reached a high level for the watched condition.",
        evidence: {
          decision_pressure:
            signals.decision_pressure,
        },
      };

    case "EXECUTION_BLOCKED":
      return {
        triggered:
          governance.execution_allowed === false ||
          execution?.outcome === "BLOCKED",
        reason:
          "Execution is blocked for the watched operational condition.",
        evidence: {
          governance_reason:
            governance.reason,
          execution_outcome:
            execution?.outcome,
        },
      };

    case "GOVERNANCE_REVIEW_REQUIRED":
      return {
        triggered:
          Boolean(
            governance.review_required ||
            governance.escalationEligible ||
            governance?.reason === "GOVERNANCE_REVIEW_REQUIRED"
          ),
        reason:
          "Governance review is required for the watched condition.",
        evidence: {
          governance,
        },
      };

    case "DELIVERY_DATE_CHANGED": {
      const previousDelivery =
        valueAtPath(
          previous,
          "delivery.date"
        );

      const currentDelivery =
        valueAtPath(
          current,
          "delivery.date"
        );

      return {
        triggered:
          previousDelivery !== undefined &&
          currentDelivery !== undefined &&
          previousDelivery !== currentDelivery,
        reason:
          "Delivery date changed for the watched target.",
        evidence: {
          previousDelivery,
          currentDelivery,
        },
      };
    }

    case "QUANTITY_CHANGED": {
      const previousQty =
        valueAtPath(
          previous,
          "quantity"
        );

      const currentQty =
        valueAtPath(
          current,
          "quantity"
        );

      return {
        triggered:
          previousQty !== undefined &&
          currentQty !== undefined &&
          Number(previousQty) !== Number(currentQty),
        reason:
          "Quantity changed for the watched target.",
        evidence: {
          previousQty,
          currentQty,
        },
      };
    }

    case "CHANGE_DETECTED":
      return {
        triggered:
          JSON.stringify(previous) !== JSON.stringify(current),
        reason:
          "A change was detected in the watched operational context.",
        evidence: {
          hasPrevious:
            Boolean(previous),
          hasCurrent:
            Boolean(current),
        },
      };

    case "CUSTOM_CONDITION":
      return {
        triggered:
          conditionMatches(
            subscription,
            context
          ),
        reason:
          subscription.condition?.description ??
          "Custom watched condition matched.",
        evidence: {
          condition:
            subscription.condition,
        },
      };

    default:
      return {
        triggered:
          false,
        reason:
          "No matching attention trigger.",
      };
  }

}

function isExpired(
  subscription: AttentionSubscription,
  now_iso: string
): boolean {

  if (!subscription.expires_at) return false;

  return subscription.expires_at <= now_iso;

}

function shouldSuppress(
  subscription: AttentionSubscription,
  event: AttentionEvent
): boolean {

  if (subscription.noise_policy === "SILENT_UNLESS_TRIGGERED") {
    return false;
  }

  if (
    subscription.noise_policy === "CRITICAL_ONLY" &&
    event.priority !== "CRITICAL"
  ) {
    return true;
  }

  return false;

}

export function evaluateAttentionSubscriptions(
  params: {
    subscriptions: AttentionSubscription[];
    context: AttentionEvaluationContext;
  }
): AttentionEvaluationResult {

  const now =
    params.context.now_iso ?? nowIso();

  const triggered:
    AttentionEvent[] = [];

  const suppressed:
    AttentionEvent[] = [];

  for (const subscription of params.subscriptions ?? []) {

    if (subscription.status !== "ACTIVE") {
      continue;
    }

    if (
      isExpired(
        subscription,
        now
      )
    ) {
      continue;
    }

    const conditionOk =
      conditionMatches(
        subscription,
        params.context
      );

    if (!conditionOk) {
      continue;
    }

    const result =
      triggerMatches(
        subscription,
        params.context
      );

    if (!result.triggered) {
      continue;
    }

    const event:
      AttentionEvent = {

      attention_id:
        subscription.attention_id,

      scope:
        subscription.scope,

      trigger:
        subscription.trigger,

      priority:
        subscription.priority,

      target_ref:
        subscription.target_ref,

      target_label:
        subscription.target_label,

      reason:
        result.reason,

      human_request:
        subscription.human_request,

      evidence:
        result.evidence,

      triggered_at:
        now,
    };

    if (
      shouldSuppress(
        subscription,
        event
      )
    ) {
      suppressed.push(event);
    } else {
      triggered.push(event);
    }

  }

  return {
    checked:
      params.subscriptions.length,

    triggered,

    suppressed,

    summary:
      buildSummary(
        params.subscriptions.length,
        triggered.length,
        suppressed.length
      ),
  };

}

function buildSummary(
  checked: number,
  triggered: number,
  suppressed: number
): string[] {

  const summary: string[] = [];

  summary.push(
    `attention_checked:${checked}`
  );

  summary.push(
    `attention_triggered:${triggered}`
  );

  if (suppressed > 0) {
    summary.push(
      `attention_suppressed:${suppressed}`
    );
  }

  if (triggered > 0) {
    summary.push(
      "human_attention_required"
    );
  } else {
    summary.push(
      "no_attention_triggered"
    );
  }

  return summary;

}