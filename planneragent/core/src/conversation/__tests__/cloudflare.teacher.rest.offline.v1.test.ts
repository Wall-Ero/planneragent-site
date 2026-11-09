import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CloudflareTeacherRestOfflineAdapterV1, CLOUDFLARE_TEACHER_RESPONSE_BYTES_V1, inspectCloudflareTeacherZeroCostGateV1,
  MockCloudflareTeacherRestTransportV1, type OfflineCloudflareRestFixtureV1 } from "../cognition/cloudflare.teacher.rest.offline.v1";
import { assessHybridLifecycleV1, hybridDigestV1, HybridTeacherProviderErrorV1, type HybridTeacherRequestV1 } from "../cognition/hybrid.conversational.contracts.v1";
import { HYBRID_TEACHER_MODEL_V1, OfflineMockTeacherQuotaV1, type OfflineTeacherConfigurationV1 } from "../cognition/hybrid.conversational.teacher.v1";
import { authorizeNaturalCapabilitiesTeacherExposureV1, createNaturalCapabilitiesAnswerPlanV1, prepareNaturalCapabilitiesRealizationV1,
  renderNaturalCapabilitiesV1, verifyNaturalCapabilitiesBindingV1 } from "../cognition/hybrid.natural.capabilities.v1";
import { sealConversationalInterpretationRequestV1 } from "../cognition/conversational.cognition.contracts.v1";
import { runOfflineHybridSupervisionV1 } from "../cognition/hybrid.conversational.supervision.v1";
import { OfflineHybridEvidenceRegistryV1 } from "../learning/hybrid.conversational.evidence.v1";

// New synthetic transport fixtures, not captured customer/model data or frozen splits.
const answer = () => renderNaturalCapabilitiesV1(createNaturalCapabilitiesAnswerPlanV1()).text;
function config(retries = 0, daily = 100): OfflineTeacherConfigurationV1 {
  return { mode: "MOCK_ONLY", provider: "CLOUDFLARE_WORKERS_AI", model: HYBRID_TEACHER_MODEL_V1,
    model_revision: "OFFLINE_FIXTURE_ONLY", configuration_version: "step13f-fixture", free_plan: "CONFIRMED_BY_OFFLINE_FIXTURE",
    model_free_eligibility: "CONFIRMED_BY_OFFLINE_FIXTURE", confirmation_ref: "fixture:not-an-account-check", day_utc: "2026-10-20", daily_neurons: daily,
    limits: { max_input_bytes: 16384, max_input_tokens: 4096, max_output_tokens: 2048, max_neurons_per_attempt: 5, timeout_ms: 100, max_retries: retries } };
}
function envelope(text = answer()) {
  return { success: true, errors: [], messages: [], result: { id: "synthetic-completion", object: "chat.completion", model: HYBRID_TEACHER_MODEL_V1,
    choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify({ version: 1, answer: text }) }, finish_reason: "stop" }],
    usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 } } };
}
const fixture = (body: unknown = envelope(), extra: Partial<OfflineCloudflareRestFixtureV1> = {}): OfflineCloudflareRestFixtureV1 =>
  ({ status: 200, body: JSON.stringify(body), offline_neurons: 1, ...extra });
const failure = (status: number, code?: number) => fixture({ success: false, result: null,
  errors: code === undefined ? [] : [{ code, message: "SENSITIVE_PROVIDER_TEXT_MUST_NOT_BE_RECORDED" }] }, { status });
async function request(c = config()): Promise<HybridTeacherRequestV1> {
  const surface = prepareNaturalCapabilitiesRealizationV1(), digest = hybridDigestV1(surface);
  return { version: 1, boundary: "CONVERSATIONAL_SURFACE_ONLY", purpose: "REALIZATION", request_id: "step13f-request", request_digest: digest,
    model: HYBRID_TEACHER_MODEL_V1, model_revision: c.model_revision, configuration_version: c.configuration_version,
    contracts: { interpretation: 1, realization: 1, teacher: 1 }, exposure: (await authorizeNaturalCapabilitiesTeacherExposureV1(surface, digest))!,
    surface, limits: c.limits, escalation_reason: "VERIFICATION_INCONCLUSIVE", attempt: 0, state: "RESERVED" };
}
function setup(fixtures: readonly OfflineCloudflareRestFixtureV1[] = [fixture()], c = config()) {
  const transport = new MockCloudflareTeacherRestTransportV1(fixtures), adapter = new CloudflareTeacherRestOfflineAdapterV1(c, transport);
  const quota = new OfflineMockTeacherQuotaV1(c), registry = new OfflineHybridEvidenceRegistryV1();
  const dependencies = { student: { descriptor: { version: 1 as const, provider_id: "offline-realization", adapter_id: "fixture", adapter_version: "1",
    model_id: "fixture", model_version: "1", capabilities: ["REALIZATION" as const], deployment_class: "OFFLINE_FIXTURE", retention_privacy_class: "NO_RETENTION" },
    propose: vi.fn(async () => JSON.stringify({ version: 1, answer: "Plausible free prose remains unverified." })) },
    registry, now: () => "2026-10-20T12:00:00.000Z", student_timeout_ms: 200, verification_timeout_ms: 200,
    authorize_exposure: authorizeNaturalCapabilitiesTeacherExposureV1, verify: verifyNaturalCapabilitiesBindingV1,
    teacher: { provider: adapter, configuration: c, quota } };
  const run = (id = "step13f") => runOfflineHybridSupervisionV1({ request_id: id, request: prepareNaturalCapabilitiesRealizationV1(),
    public_response: "Public baseline stays unchanged.", semantic_family: "GENERAL_CAPABILITIES", evaluation_kind: "INDEPENDENT_NEW" }, dependencies);
  return { adapter, transport, quota, registry, dependencies, run };
}
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("REAL_NETWORK_FORBIDDEN"); })));
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("STEP13F Cloudflare Teacher REST offline qualification", () => {
  it("serializes only governed public meaning and Voice with exact model, JSON schema and limits", async () => {
    const x = setup();
    const result = await x.adapter.complete(await request(), new AbortController().signal);
    expect(result).toEqual({ candidate: JSON.stringify({ version: 1, answer: answer() }), usage: { input_tokens: 100, output_tokens: 80, neurons: 1 } });
    const wire = x.transport.requests()[0], body = JSON.parse(wire.body);
    expect(wire).toMatchObject({ method: "POST", path_template: `/client/v4/accounts/{ACCOUNT_ID}/ai/run/${HYBRID_TEACHER_MODEL_V1}` });
    expect(body).toMatchObject({ stream: false, temperature: 0, max_tokens: 2048, response_format: { type: "json_schema", json_schema: { required: ["version", "answer"], additionalProperties: false } } });
    expect(Object.keys(body).sort()).toEqual(["max_tokens", "prompt", "response_format", "stream", "temperature"]);
    for (const element of createNaturalCapabilitiesAnswerPlanV1().mandatory_elements) expect(body.prompt).toContain(element.approved_text);
    expect(body.prompt).toContain("Do not invent facts");
    expect(wire.body).not.toMatch(/request_id|source_digest|sha256|OFFLINE_FIXTURE_ONLY|history|organization_id|api_key|ACCOUNT_ID/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each(["model", "purpose", "digest", "exposure", "surface", "extra", "limits", "state", "revision", "missing-surface", "null-surface"])("denies invalid %s before transport", async mode => {
    const x = setup(), r: any = await request();
    if (mode === "model") r.model = "@cf/other/model";
    if (mode === "purpose") r.purpose = "INTERPRETATION";
    if (mode === "digest") r.request_digest = "wrong";
    if (mode === "exposure") r.exposure.evidence_ref = "model-self-assertion";
    if (mode === "surface") { r.surface = { ...r.surface, history: "secret" }; r.request_digest = hybridDigestV1(r.surface); }
    if (mode === "extra") r.credentials = "secret";
    if (mode === "limits") r.limits = { ...r.limits, max_output_tokens: 99999 };
    if (mode === "state") r.state = "UNRESERVED";
    if (mode === "revision") r.model_revision = "different";
    if (mode === "missing-surface") delete r.surface;
    if (mode === "null-surface") { r.surface = null; r.request_digest = hybridDigestV1(null); }
    await expect(x.adapter.complete(r, new AbortController().signal)).rejects.toBeInstanceOf(HybridTeacherProviderErrorV1);
    expect(x.transport.requests()).toHaveLength(0);
  });

  it("denies even grammar-admitted Interpretation without new authorization", async () => {
    const x = setup(), r = await request();
    const surface = { purpose: "INTERPRETATION" as const, payload: sealConversationalInterpretationRequestV1("What can PlannerAgent do?") };
    await expect(x.adapter.complete({ ...r, purpose: "INTERPRETATION", surface, request_digest: hybridDigestV1(surface) }, new AbortController().signal)).rejects.toMatchObject({ code: "INTERPRETATION_EXPOSURE_DENIED", retryable: false });
    expect(x.transport.requests()).toHaveLength(0);
  });

  it.each([
    [400, undefined, "CF_HTTP_400", false], [401, undefined, "CF_HTTP_401", false], [403, undefined, "CF_HTTP_403", false],
    [429, undefined, "CF_HTTP_429", false], [500, undefined, "CF_HTTP_500", true], [503, undefined, "CF_HTTP_503", true],
    [403, 5035, "CF_PAID_PLAN_REQUIRED", false], [429, 3036, "CF_DAILY_QUOTA_EXHAUSTED", false],
    [429, 3040, "CF_CAPACITY_UNAVAILABLE", true], [408, 3007, "TIMEOUT", true], [408, 3008, "ABORTED", false],
    [500, 5035, "CF_PAID_PLAN_REQUIRED", false], [500, 3036, "CF_DAILY_QUOTA_EXHAUSTED", false],
  ] as const)("classifies HTTP %s / code %s without reflecting provider text", async (status, code, expected, retryable) => {
    const x = setup([failure(status, code)]);
    await expect(x.adapter.complete(await request(), new AbortController().signal)).rejects.toMatchObject({ code: expected, message: expected, retryable });
  });

  it.each([failure(400), failure(401), failure(403, 5035), failure(429, 3036), failure(429)])("never retries permanent failure %# despite a retry allowance", async f => {
    const x = setup([f, fixture()], config(2));
    const result = await x.run();
    expect(x.transport.requests()).toHaveLength(1);
    expect(result.observation.teacher_attempts).toHaveLength(1);
    expect(result.observation.teacher_attempts[0].failure_code).toMatch(/^CF_/);
    expect(result.shadow_candidate).toBeUndefined();
    expect(JSON.stringify(x.registry.list())).not.toContain("SENSITIVE_PROVIDER_TEXT");
    expect(x.quota.snapshot().reserved_neurons).toBe(5);
  });

  it.each([failure(500), failure(429, 3040)])("retries recoverable failure %# only through the existing fresh reservation", async f => {
    const x = setup([f, fixture()], config(1));
    const result = await x.run();
    expect(x.transport.requests()).toHaveLength(2);
    expect(result.observation.teacher_attempts).toHaveLength(2);
    expect(result.observation.disposition).toBe("TEACHER_VERIFIED");
    expect(x.quota.snapshot()).toMatchObject({ reserved_neurons: 10, measured_neurons: 1, unsettled_attempts: 1, production_safe: false });
    expect(result.public_response).toBe("Public baseline stays unchanged.");
  });

  it("bounds retries and never refunds failed reservations", async () => {
    const x = setup([failure(503), failure(503), fixture()], config(1));
    const result = await x.run();
    expect(x.transport.requests()).toHaveLength(2);
    expect(result.shadow_candidate).toBeUndefined();
    expect(x.quota.snapshot()).toMatchObject({ reserved_neurons: 10, measured_neurons: 0, unsettled_attempts: 2 });
  });

  it("refuses unsanitized failure text in the existing governed registry", async () => {
    const x = setup([failure(400)]), result = await x.run();
    await expect(x.registry.append({ ...result.observation,
      teacher_attempts: result.observation.teacher_attempts.map(a => ({ ...a, failure_code: "private provider error text" })) })).rejects.toThrow("UNSAFE_FAILURE_CODE");
    expect(JSON.stringify(x.registry.list())).not.toContain("private provider error text");
  });

  it("rejects malformed JSON, oversized response and ambiguous accounting without retries", async () => {
    for (const f of [fixture(undefined, { body: "not JSON" }), fixture(undefined, { body: "x".repeat(CLOUDFLARE_TEACHER_RESPONSE_BYTES_V1 + 1) })]) {
      const x = setup([f, fixture()], config(2)), result = await x.run();
      expect(x.transport.requests()).toHaveLength(1);
      expect(result.observation.teacher_attempts[0].state).toBe("METERING_INVALID");
      expect(x.quota.snapshot().metering_valid).toBe(false);
      expect(result.shadow_candidate).toBeUndefined();
    }
  });

  it.each(["missing", "negative", "fractional", "total", "input-bound", "output-bound", "neurons-missing", "neurons-bound", "model-asserted-neurons"])("quarantines %s usage without fabricating consumption", async mode => {
    const body: any = envelope(); let offline_neurons: number | undefined = 1;
    if (mode === "missing") delete body.result.usage;
    if (mode === "negative") body.result.usage.prompt_tokens = -1;
    if (mode === "fractional") body.result.usage.completion_tokens = .5;
    if (mode === "total") body.result.usage.total_tokens = 999;
    if (mode === "input-bound") body.result.usage = { prompt_tokens: 4097, completion_tokens: 1, total_tokens: 4098 };
    if (mode === "output-bound") body.result.usage = { prompt_tokens: 1, completion_tokens: 2049, total_tokens: 2050 };
    if (mode === "neurons-missing") offline_neurons = undefined;
    if (mode === "neurons-bound") offline_neurons = 6;
    if (mode === "model-asserted-neurons") { offline_neurons = undefined; body.result.usage.neurons = 0; }
    const f: any = fixture(body); if (offline_neurons === undefined) delete f.offline_neurons; else f.offline_neurons = offline_neurons;
    const x = setup([f, fixture()], config(2)), result = await x.run();
    expect(result.observation.teacher_attempts[0]).toMatchObject({ state: "METERING_INVALID", failure_code: "USAGE_UNKNOWN_OR_INCOHERENT" });
    expect(result.shadow_candidate).toBeUndefined(); expect(x.transport.requests()).toHaveLength(1);
    const next = await x.run("next-request");
    expect(next.observation.teacher_attempts[0].state).toBe("BUDGET_DENIED");
    expect(x.transport.requests()).toHaveLength(1);
    expect(x.quota.snapshot()).toMatchObject({ metering_valid: false, reserved_neurons: 5, measured_neurons: 0, unsettled_attempts: 1 });
  });

  it.each(["content", "extra-content-field", "truncated", "tools", "model", "multiple-choices"])("rejects malformed model %s while settling known synthetic usage", async mode => {
    const body: any = envelope();
    if (mode === "content") body.result.choices[0].message.content = "not JSON";
    if (mode === "extra-content-field") body.result.choices[0].message.content = JSON.stringify({ version: 1, answer: "Hi", grants_execution: true });
    if (mode === "truncated") body.result.choices[0].finish_reason = "length";
    if (mode === "tools") body.result.choices[0].message.tool_calls = [{ function: { name: "execute" } }];
    if (mode === "model") body.result.model = "different-model";
    if (mode === "multiple-choices") body.result.choices.push(body.result.choices[0]);
    const x = setup([fixture(body), fixture()], config(2)), result = await x.run();
    expect(result.shadow_candidate).toBeUndefined();
    expect(x.transport.requests()).toHaveLength(1);
    expect(result.observation.teacher_attempts[0]).toMatchObject({ state: "PROVIDER_ERROR", usage: { neurons: 1 } });
    expect(x.quota.snapshot()).toMatchObject({ measured_neurons: 1, unsettled_attempts: 0 });
  });

  it.each(["PlannerAgent can execute any action without approval.", "PlannerAgent helps people understand operational planning."])("does not semantically approve free text: %s", async text => {
    const x = setup([fixture(envelope(text))]), result = await x.run();
    expect(result.observation.teacher_attempts[0]).toMatchObject({ state: "REJECTED", gate: { status: "INCONCLUSIVE" } });
    expect(result.shadow_candidate).toBeUndefined();
    expect(result.public_response).toBe("Public baseline stays unchanged.");
    expect(x.transport.requests()).toHaveLength(1);
  });

  it("keeps reasoning content out of candidate and governed registry", async () => {
    const body: any = envelope(); body.result.choices[0].message.reasoning_content = "PRIVATE_REASONING_FIXTURE";
    const x = setup([fixture(body)]), result = await x.run();
    expect(result.observation.disposition).toBe("TEACHER_VERIFIED");
    expect(JSON.stringify(result)).not.toContain("PRIVATE_REASONING_FIXTURE");
    expect(JSON.stringify(x.registry.list())).not.toContain("PRIVATE_REASONING_FIXTURE");
    expect(result.observation.learning_state).toBe("PENDING_ELIGIBILITY");
  });

  it("times out and cancels the in-memory transport", async () => {
    vi.useFakeTimers();
    const c = config(); const x = setup([fixture(undefined, { delay_ms: 500 })], c);
    const pending = x.adapter.complete(await request(c), new AbortController().signal);
    const rejected = expect(pending).rejects.toMatchObject({ code: "TIMEOUT", retryable: true });
    await vi.advanceTimersByTimeAsync(101); await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects pre-aborted calls without exposing a request", async () => {
    const x = setup(), controller = new AbortController(); controller.abort();
    await expect(x.adapter.complete(await request(), controller.signal)).rejects.toMatchObject({ code: "ABORTED", retryable: false });
    expect(x.transport.requests()).toHaveLength(0);
  });

  it("propagates parent cancellation without retry or an orphan timer", async () => {
    vi.useFakeTimers();
    const x = setup([fixture(undefined, { delay_ms: 500 })]), controller = new AbortController();
    const pending = x.adapter.complete(await request(), controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ code: "ABORTED", retryable: false });
    await vi.advanceTimersByTimeAsync(1); controller.abort(); await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("enforces the configured UTF-8 input bound before transport", async () => {
    const c = config(); const small = { ...c, limits: { ...c.limits, max_input_bytes: 1 } };
    const x = setup([fixture()], small);
    await expect(x.adapter.complete(await request(small), new AbortController().signal)).rejects.toMatchObject({ code: "INPUT_BOUND_EXCEEDED" });
    expect(x.transport.requests()).toHaveLength(0);
  });

  it("admits at most the shared mock quota under concurrency", async () => {
    const x = setup([fixture(), fixture(), fixture(), fixture()], config(0, 10));
    const results = await Promise.all(["c1", "c2", "c3", "c4"].map(id => x.run(id)));
    expect(x.transport.requests()).toHaveLength(2);
    expect(results.filter(r => r.observation.disposition === "TEACHER_VERIFIED")).toHaveLength(2);
    expect(results.filter(r => r.observation.teacher_attempts[0].state === "BUDGET_DENIED")).toHaveLength(2);
    expect(x.quota.snapshot()).toMatchObject({ reserved_neurons: 10, measured_neurons: 2, production_safe: false });
  });

  it("suppresses already reserved in-flight work after unknown accounting", async () => {
    vi.useFakeTimers();
    const bad: any = envelope(); delete bad.result.usage;
    const x = setup([fixture(bad, { delay_ms: 1 }), fixture(undefined, { delay_ms: 20 })], config(0, 10));
    const pending = Promise.all([x.run("unknown"), x.run("in-flight")]);
    await vi.advanceTimersByTimeAsync(30);
    const results = await pending;
    expect(results.every(r => r.shadow_candidate === undefined)).toBe(true);
    expect(results.every(r => r.observation.teacher_attempts[0].state === "METERING_INVALID")).toBe(true);
    expect(x.quota.snapshot()).toMatchObject({ reserved_neurons: 10, metering_valid: false });
  });

  it("keeps all seven live cost conditions unqualified and cannot promote", () => {
    expect(inspectCloudflareTeacherZeroCostGateV1()).toMatchObject({ state: "TEACHER_DISABLED", provider: "MOCK_ONLY", teacher_live_enabled: false,
      billing_changes_allowed: false, real_neurons_consumed_by_adapter: 0, requirements: { distributed_accounting: "NOT_IMPLEMENTED", consumption: "LIVE_UNKNOWN" } });
    expect(Object.keys(inspectCloudflareTeacherZeroCostGateV1().requirements)).toHaveLength(7);
    expect(assessHybridLifecycleV1("SUPERVISED")).toMatchObject({ state: "SHADOW", teacher_live_enabled: false, transition_allowed: false });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("has no live transport default, account credentials or deployment activation switch", () => {
    expect(() => new CloudflareTeacherRestOfflineAdapterV1(config(), { mode: "LIVE", post: vi.fn() } as any)).toThrow("OFFLINE_CONFIGURATION_REQUIRED");
    expect(() => new CloudflareTeacherRestOfflineAdapterV1(config(), undefined as any)).toThrow("OFFLINE_CONFIGURATION_REQUIRED");
    expect(() => new CloudflareTeacherRestOfflineAdapterV1({ ...config(), mode: "LIVE" } as any, new MockCloudflareTeacherRestTransportV1([]))).toThrow();
    const source = readFileSync(fileURLToPath(new URL("../cognition/cloudflare.teacher.rest.offline.v1.ts", import.meta.url)), "utf8");
    expect(source).not.toContain("globalThis.fetch"); expect(source).not.toContain("process.env"); expect(source).not.toContain("env.AI");
  });
});
