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
} from "./attention.types";

import {
  AttentionSubscriptionStore,
} from "./attention.subscription";

import {
  evaluateAttentionSubscriptions,
} from "./attention.engine";
import type { GovernedAttentionScopeV1, GovernedAttentionEvaluationV1 } from "./attention.scope.v1";
import { bindGovernedAttentionEvaluationV1 } from "./attention.scope.v1";

export async function evaluateAttentionRuntime(
  params: {
    db: D1Database;
    scope: GovernedAttentionScopeV1;
    context: AttentionEvaluationContext;
  }
): Promise<GovernedAttentionEvaluationV1> {

  if (
    params.context.tenant_id !== params.scope.tenant_id ||
    params.context.company_id !== params.scope.company_id ||
    params.context.context_id !== params.scope.context_id ||
    params.context.actor_id !== params.scope.actor_id
  ) throw new Error("ATTENTION_RUNTIME_SCOPE_MISMATCH");

  const store =
    new AttentionSubscriptionStore(
      params.db
    );

  await store.expirePastDue(
    params.context.now_iso
  );

  const subscriptions =
    await store.getActive(
      params.scope,
      params.context.now_iso,
    );

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

  return bindGovernedAttentionEvaluationV1(params.scope, result);

}
