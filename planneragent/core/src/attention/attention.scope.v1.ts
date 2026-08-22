import type { OperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { OagActorId } from "../operational-identity/contracts/identifiers.v1";
import type { OagActorBindingV1 } from "../operational-identity/contracts/track-b.v1";
import type { ResolvedOperationalParticipationV1 } from "../operational-identity/participation/participation.contracts.v1";
import type { AttentionEvaluationResult } from "./attention.types";

declare const governedAttentionScope: unique symbol;

export type GovernedAttentionScopeV1 = Readonly<{
  version: 1;
  tenant_id: ResolvedOperationalParticipationV1["owning_tenant_id"];
  company_id: ResolvedOperationalParticipationV1["selected_company_id"];
  context_id: string;
  actor_id: OagActorId;
  [governedAttentionScope]: true;
}>;

export type GovernedAttentionEvaluationV1 = Readonly<{
  version: 1;
  scope: GovernedAttentionScopeV1;
  result: Readonly<{
    checked: number;
    triggered: readonly AttentionEvaluationResult["triggered"][number][];
    suppressed: readonly AttentionEvaluationResult["suppressed"][number][];
    summary: readonly string[];
  }>;
}>;

function nonempty(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
}

export function assertGovernedAttentionScopeV1(scope: GovernedAttentionScopeV1): void {
  if (scope?.version !== 1) throw new Error("ATTENTION_SCOPE_VERSION_UNSUPPORTED");
  nonempty(scope.tenant_id, "ATTENTION_SCOPE_TENANT_REQUIRED");
  nonempty(scope.company_id, "ATTENTION_SCOPE_COMPANY_REQUIRED");
  nonempty(scope.context_id, "ATTENTION_SCOPE_CONTEXT_REQUIRED");
  nonempty(scope.actor_id, "ATTENTION_SCOPE_ACTOR_REQUIRED");
}

export async function createGovernedAttentionScopeV1(input: Readonly<{
  participation: ResolvedOperationalParticipationV1;
  actor_binding: OagActorBindingV1;
  operational_context: OperationalSignalEvaluationScopeV1;
}>): Promise<GovernedAttentionScopeV1> {
  const { participation, actor_binding: actor, operational_context: context } = input;
  nonempty(participation?.owning_tenant_id, "ATTENTION_SCOPE_TENANT_REQUIRED");
  nonempty(participation?.selected_company_id, "ATTENTION_SCOPE_COMPANY_REQUIRED");
  nonempty(context?.scope_id, "ATTENTION_SCOPE_CONTEXT_REQUIRED");
  nonempty(actor?.oag_actor_id, "ATTENTION_SCOPE_ACTOR_REQUIRED");
  if (
    actor.lifecycle_state !== "ACTIVE" ||
    actor.principal_id !== participation.principal_id ||
    actor.membership_id !== participation.membership_id ||
    actor.company_id !== participation.selected_company_id
  ) throw new Error("ATTENTION_SCOPE_ACTOR_BINDING_MISMATCH");
  if (context.company_id !== participation.selected_company_id) {
    throw new Error("ATTENTION_SCOPE_CONTEXT_COMPANY_MISMATCH");
  }
  await verifyOperationalSignalEvaluationScopeV1(context, {
    request_id: context.request_id,
    company_id: participation.selected_company_id,
  });
  return Object.freeze({
    version: 1,
    tenant_id: participation.owning_tenant_id,
    company_id: participation.selected_company_id,
    context_id: context.scope_id,
    actor_id: actor.oag_actor_id,
  }) as GovernedAttentionScopeV1;
}

export function bindGovernedAttentionEvaluationV1(
  scope: GovernedAttentionScopeV1,
  result: AttentionEvaluationResult,
): GovernedAttentionEvaluationV1 {
  assertGovernedAttentionScopeV1(scope);
  const frozenResult = Object.freeze({
    checked: result.checked,
    triggered: Object.freeze([...result.triggered]),
    suppressed: Object.freeze([...result.suppressed]),
    summary: Object.freeze([...result.summary]),
  });
  return Object.freeze({ version: 1, scope, result: frozenResult });
}
