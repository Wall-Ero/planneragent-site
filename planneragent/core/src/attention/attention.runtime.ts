// core/src/attention/attention.runtime.ts
// ============================================================
// PlannerAgent — Operational Working Attention Runtime
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Runtime bridge between PlannerAgent evaluation and active
// human-directed attention subscriptions.
//
// This layer DOES NOT:
// - create attention
// - send notifications
// - authorize execution
// - mutate governance
//
// It DOES:
// - load active attention subscriptions
// - evaluate them against runtime context
// - update checked / triggered timestamps
//
// ============================================================

import type {
  AttentionEvaluationContext,
  AttentionEvaluationResult,
} from "./attention.types";

import {
  AttentionSubscriptionStore,
} from "./attention.subscription";

import {
  evaluateAttentionSubscriptions,
} from "./attention.engine";

export async function evaluateAttentionRuntime(
  params: {
    db: D1Database;
    context: AttentionEvaluationContext;
  }
): Promise<AttentionEvaluationResult> {

  const store =
    new AttentionSubscriptionStore(
      params.db
    );

  await store.expirePastDue(
    params.context.now_iso
  );

  const subscriptions =
    await store.getActive({
      company_id:
        params.context.company_id,

      context_id:
        params.context.context_id,

      actor_id:
        params.context.actor_id,

      now_iso:
        params.context.now_iso,
    });

  const result =
    evaluateAttentionSubscriptions({
      subscriptions,
      context:
        params.context,
    });

  for (const subscription of subscriptions) {

    await store.markChecked(
      subscription.attention_id,
      params.context.now_iso
    );

  }

  for (const event of result.triggered) {

    await store.markTriggered(
      event.attention_id,
      event.triggered_at
    );

  }

  return result;

}