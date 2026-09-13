import { describe, expect, it, vi } from "vitest";
import { runAnonymousVisionConversationV1 } from "../anonymous.vision.conversation.runtime.v1";
import { AnonymousVisionConversationRateGuardV1 } from "../anonymous.vision.conversation.rate.v1";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1, createConversationalProviderDescriptorV1, type ConversationalInterpretationProviderV1 } from "../cognition/conversational.cognition.contracts.v1";
import { controlledShadowSampleBucketV1, resolveControlledInterpretationShadowPolicyV1, shouldScheduleControlledShadowV1 } from "../cognition/controlled.interpretation.shadow.policy.v1";
import { aggregateShadowInterpretationEvidenceV1, type ShadowInterpretationEvidenceV1 } from "../cognition/conversational.interpretation.shadow.runtime.v1";
import { GCC4W_STUDENT_IDENTITY_V1, StudentConversationalInterpretationAdapterV1 } from "../cognition/student.conversational.interpretation.adapter.v1";

const descriptor = createConversationalProviderDescriptorV1({ version: 1, provider_id: "test", adapter_id: "test", adapter_version: "1", model_id: "test", model_version: "1", capabilities: ["INTERPRETATION"], deployment_class: "TEST", retention_privacy_class: "TEST" });
const studentResult = Object.freeze({ version: 1, interaction: "CONVERSATIONAL_CONTINUITY", resolution: "CLEAR", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 } as const);
const invoke = async (policy: ReturnType<typeof resolveControlledInterpretationShadowPolicyV1>, message = "hello") => {
  const calls: unknown[] = [], evidence: ShadowInterpretationEvidenceV1[] = [], tasks: Promise<void>[] = [];
  const provider: ConversationalInterpretationProviderV1 = { descriptor, interpret: async value => { calls.push(value); return studentResult; } };
  const live = await runAnonymousVisionConversationV1({ request: { version: 1, request_id: "stable-request-id", message }, client_key: "client", api_key: "", fetch: vi.fn() as never, rate_guard: new AnonymousVisionConversationRateGuardV1(), interpretation_shadow: { provider, repository: { append: async value => { evidence.push(value); } }, timeout_ms: 20, policy, schedule: task => tasks.push(task) } });
  await Promise.all(tasks);
  return { calls, evidence, live, tasks };
};

describe("GCC-5B controlled interpretation shadow", () => {
  it("defaults absent, malformed, and unsupported activation to disabled with zero percent", () => {
    for (const input of [{}, { state: "enabled", sample_percent: "100" }, { state: "CONTROLLED_SHADOW", sample_percent: "bad" }]) {
      const policy = resolveControlledInterpretationShadowPolicyV1(input);
      expect(shouldScheduleControlledShadowV1(policy, "same-key")).toBe(false);
    }
  });

  it("enforces zero, one-hundred, deterministic sampling, and the kill switch", async () => {
    expect((await invoke(resolveControlledInterpretationShadowPolicyV1({ state: "CONTROLLED_SHADOW", sample_percent: "0" }))).calls).toHaveLength(0);
    expect((await invoke(resolveControlledInterpretationShadowPolicyV1({ state: "CONTROLLED_SHADOW", sample_percent: "100" }))).calls).toHaveLength(1);
    expect((await invoke(resolveControlledInterpretationShadowPolicyV1({ state: "CONTROLLED_SHADOW", sample_percent: "100", kill_switch: "true" }))).calls).toHaveLength(0);
    const policy = resolveControlledInterpretationShadowPolicyV1({ state: "CONTROLLED_SHADOW", sample_percent: "37.5" });
    expect(controlledShadowSampleBucketV1("same-key")).toBe(controlledShadowSampleBucketV1("same-key"));
    expect(shouldScheduleControlledShadowV1(policy, "same-key")).toBe(shouldScheduleControlledShadowV1(policy, "same-key"));
  });

  it("keeps ineligible data out and persists metadata only", async () => {
    const policy = resolveControlledInterpretationShadowPolicyV1({ state: "CONTROLLED_SHADOW", sample_percent: "100" });
    expect((await invoke(policy, "Upload this CSV with raw protected content")).calls).toHaveLength(0);
    const observed = await invoke(policy);
    const serialized = JSON.stringify(observed.evidence);
    expect(serialized).not.toContain('"message":"hello"');
    expect(serialized).not.toMatch(/Bearer|authorization|student\.test/);
    expect(observed.evidence[0]).toMatchObject({ activation_state: "CONTROLLED_SHADOW", sample_percent: 100, sampled: true, student_lifecycle: "QUALIFIED_FOR_SHADOW", provider_outcome: "SUCCESS", grants_authority_observed: false, grants_execution_observed: false });
    expect(aggregateShadowInterpretationEvidenceV1(observed.evidence, 2, 1, 1)).toMatchObject({ eligible_shadow_requests: 1, sampled_requests: 1, student_calls: 1, provider_successes: 1, provider_failures: 0, shadow_latency_count: 1, role_surface_applicable: 0, product_focus_applicable: 0, telemetry_is_operational_truth: false });
  });

  it("pins identity before one bounded inference attempt and isolates mismatch", async () => {
    const goodFetch = vi.fn(async (request: RequestInfo | URL) => String(request).endsWith("/v1/identity") ? Response.json({ ...GCC4W_STUDENT_IDENTITY_V1, effective_dtype: "bf16" }) : Response.json(studentResult));
    const adapter = new StudentConversationalInterpretationAdapterV1({ endpoint: "https://student.test/v1/interpret", authorization: "secret-token", timeout_ms: 50, fetch: goodFetch as never, verify_identity: true });
    await expect(adapter.interpret({} as never)).resolves.toMatchObject(studentResult);
    expect(goodFetch).toHaveBeenCalledTimes(2);
    const mismatchFetch = vi.fn(async () => Response.json({ ...GCC4W_STUDENT_IDENTITY_V1, candidate_id: "other", effective_dtype: "bf16" }));
    const mismatch = new StudentConversationalInterpretationAdapterV1({ endpoint: "https://student.test/v1/interpret", authorization: "secret-token", timeout_ms: 50, fetch: mismatchFetch as never, verify_identity: true });
    await expect(mismatch.interpret({} as never)).rejects.toMatchObject({ code: "IDENTITY_MISMATCH" });
    expect(mismatchFetch).toHaveBeenCalledTimes(1);
  });
});
