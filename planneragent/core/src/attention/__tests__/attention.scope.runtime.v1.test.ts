import { describe, expect, it } from "vitest";
import { createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import type { OagActorBindingV1 } from "../../operational-identity/contracts/track-b.v1";
import type { ResolvedOperationalParticipationV1 } from "../../operational-identity/participation/participation.contracts.v1";
import { evaluateAttentionSubscriptions } from "../attention.engine";
import { evaluateAttentionRuntime } from "../attention.runtime";
import { createGovernedAttentionScopeV1, type GovernedAttentionScopeV1 } from "../attention.scope.v1";
import { AttentionSubscriptionStore } from "../attention.subscription";
import type { AttentionSubscription } from "../attention.types";

const now = "2026-08-22T10:00:00.000Z";

async function sources() {
  const participation = { version: 1, participation_context_id: "participation:1", principal_id: "principal:1",
    session_id: "session:1", membership_id: "membership:1", selected_company_id: "company:1",
    owning_tenant_id: "tenant:1", resolved_at: now, platform_role_ids: [], platform_permission_ids: [],
    baseline_permissions: [], membership_state_version: "1", ownership_reference: "ownership:1",
    company_selection_reference: "selection:1", audit_lineage: [], correlation_id: "correlation:1",
  } as unknown as ResolvedOperationalParticipationV1;
  const actor_binding = { version: 1, oag_actor_binding_id: "binding:1", oag_actor_id: "actor:1",
    principal_id: "principal:1", membership_id: "membership:1", company_id: "company:1",
    lifecycle_state: "ACTIVE", bound_at: now, binding_reference: "binding-ref:1",
  } as unknown as OagActorBindingV1;
  const operational_context = await createOperationalSignalEvaluationScopeV1({ version: 1,
    scope_type: "REQUEST_DATASET", request_id: "request:1", company_id: "company:1", domain: "operations",
    evidence_selection_ref: "selection:1", source_snapshot_ref: "snapshot:1" });
  return { participation, actor_binding, operational_context };
}

function subscription(scope: GovernedAttentionScopeV1, overrides: Partial<AttentionSubscription> = {}) {
  const value: AttentionSubscription = { attention_id: "attention:1", tenant_id: scope.tenant_id,
    company_id: scope.company_id, context_id: scope.context_id, actor_id: scope.actor_id, scope: "ORDER",
    trigger: "DECISION_PRESSURE_HIGH", priority: "HIGH", status: "ACTIVE",
    noise_policy: "SILENT_UNLESS_TRIGGERED", human_request: "Watch pressure", created_at: now, updated_at: now,
    ...overrides };
  return { ...value, condition_json: null, metadata_json: "{}" };
}

function dbFor(rows: ReturnType<typeof subscription>[]) {
  return { prepare(sql: string) { return { bind(...args: unknown[]) { return {
    async all() { const [tenant, company, context, actor, at] = args as string[];
      return { results: rows.filter(row => row.tenant_id === tenant && row.company_id === company &&
        row.context_id === context && row.actor_id === actor && row.status === "ACTIVE" &&
        (!row.expires_at || row.expires_at > at)) }; },
    async run() { return { meta: { changes: sql.includes("UPDATE") ? 1 : 0 } }; },
  }; } }; } } as unknown as D1Database;
}

describe("GOVERNED-ATTENTION-SCOPE-V1", () => {
  it("accepts complete trusted inputs and produces an immutable four-dimensional scope", async () => {
    const input = await sources(), scope = await createGovernedAttentionScopeV1(input);
    expect(scope).toEqual({ version: 1, tenant_id: "tenant:1", company_id: "company:1",
      context_id: input.operational_context.scope_id, actor_id: "actor:1" });
    expect(Object.isFrozen(scope)).toBe(true);
  });

  it.each([
    ["missing tenant", (x: any) => { delete x.participation.owning_tenant_id; }, "ATTENTION_SCOPE_TENANT_REQUIRED"],
    ["blank tenant", (x: any) => { x.participation.owning_tenant_id = " "; }, "ATTENTION_SCOPE_TENANT_REQUIRED"],
    ["missing company", (x: any) => { delete x.participation.selected_company_id; }, "ATTENTION_SCOPE_COMPANY_REQUIRED"],
    ["blank company", (x: any) => { x.participation.selected_company_id = " "; }, "ATTENTION_SCOPE_COMPANY_REQUIRED"],
    ["missing context", (x: any) => { delete x.operational_context.scope_id; }, "ATTENTION_SCOPE_CONTEXT_REQUIRED"],
    ["blank context", (x: any) => { x.operational_context.scope_id = " "; }, "ATTENTION_SCOPE_CONTEXT_REQUIRED"],
    ["missing actor", (x: any) => { delete x.actor_binding.oag_actor_id; }, "ATTENTION_SCOPE_ACTOR_REQUIRED"],
    ["blank actor", (x: any) => { x.actor_binding.oag_actor_id = " "; }, "ATTENTION_SCOPE_ACTOR_REQUIRED"],
  ] as const)("fails closed for %s", async (_label, mutate, error) => {
    const input: any = await sources();
    input.operational_context = { ...input.operational_context };
    mutate(input);
    await expect(createGovernedAttentionScopeV1(input)).rejects.toThrow(error);
  });

  it("rejects identity and operational-context substitution", async () => {
    const actor: any = await sources(); actor.actor_binding.principal_id = "principal:other";
    await expect(createGovernedAttentionScopeV1(actor)).rejects.toThrow("ATTENTION_SCOPE_ACTOR_BINDING_MISMATCH");
    const context: any = await sources();
    context.operational_context = { ...context.operational_context, company_id: "company:other" };
    await expect(createGovernedAttentionScopeV1(context)).rejects.toThrow("ATTENTION_SCOPE_CONTEXT_COMPANY_MISMATCH");
  });

  it("loads only an exact four-dimensional active, unexpired match", async () => {
    const scope = await createGovernedAttentionScopeV1(await sources());
    const rows = [subscription(scope), subscription(scope, { attention_id: "tenant", tenant_id: "tenant:other" }),
      subscription(scope, { attention_id: "company", company_id: "company:other" }),
      subscription(scope, { attention_id: "context", context_id: "context:other" }),
      subscription(scope, { attention_id: "actor", actor_id: "actor:other" }),
      subscription(scope, { attention_id: "inactive", status: "DISABLED" }),
      subscription(scope, { attention_id: "expired", expires_at: "2026-08-22T09:00:00.000Z" })];
    const loaded = await new AttentionSubscriptionStore(dbFor(rows)).getActive(scope, now);
    expect(loaded.map(item => item.attention_id)).toEqual(["attention:1"]);
  });

  it("allows no broad repository fallback for a malformed runtime scope", async () => {
    const valid = await createGovernedAttentionScopeV1(await sources());
    const store = new AttentionSubscriptionStore(dbFor([subscription(valid)]));
    for (const field of ["tenant_id", "company_id", "context_id", "actor_id"] as const) {
      const invalid = { ...valid, [field]: " " } as unknown as GovernedAttentionScopeV1;
      await expect(store.getActive(invalid, now)).rejects.toThrow(`ATTENTION_SCOPE_${field.split("_")[0]!.toUpperCase()}_REQUIRED`);
    }
  });

  it("binds deterministic runtime output to scope and rejects substituted context", async () => {
    const scope = await createGovernedAttentionScopeV1(await sources()), db = dbFor([subscription(scope)]);
    const context = { tenant_id: scope.tenant_id, company_id: scope.company_id, context_id: scope.context_id,
      actor_id: scope.actor_id, now_iso: now, signals: { decision_pressure: "HIGH" } };
    const a = await evaluateAttentionRuntime({ db, scope, context });
    const b = await evaluateAttentionRuntime({ db, scope, context });
    expect(a).toEqual(b); expect(a.scope).toBe(scope); expect(a.result.triggered).toHaveLength(1);
    expect(Object.isFrozen(a) && Object.isFrozen(a.result) && Object.isFrozen(a.result.triggered)).toBe(true);
    await expect(evaluateAttentionRuntime({ db, scope, context: { ...context, actor_id: "" } }))
      .rejects.toThrow("ATTENTION_RUNTIME_SCOPE_MISMATCH");
  });

  it("leaves engine noise semantics unchanged and creates no surfaced content", async () => {
    const scope = await createGovernedAttentionScopeV1(await sources());
    const result = evaluateAttentionSubscriptions({ subscriptions: [subscription(scope,
      { noise_policy: "CRITICAL_ONLY", priority: "HIGH" })], context: { tenant_id: scope.tenant_id,
      company_id: scope.company_id, context_id: scope.context_id, actor_id: scope.actor_id, now_iso: now,
      signals: { decision_pressure: "HIGH" } } });
    expect(result.triggered).toEqual([]); expect(result.suppressed).toHaveLength(1);
    expect(JSON.stringify(scope)).not.toMatch(/ParticipantSurfacedContentV1|content_id|statements|channel/);
  });
});
