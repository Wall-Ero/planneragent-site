import { parseRealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import { createPlannerAgentVoiceInstructionV1 } from "../planneragent.voice.profile.v1";
import { HybridTeacherProviderErrorV1, hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1,
  type HybridTeacherProviderV1, type HybridTeacherRequestV1, type HybridUsageV1 } from "./hybrid.conversational.contracts.v1";
import { HYBRID_TEACHER_MODEL_V1, inspectLiveTeacherAvailabilityV1, validOfflineTeacherConfigurationV1, type OfflineTeacherConfigurationV1 } from "./hybrid.conversational.teacher.v1";
import { authorizeNaturalCapabilitiesTeacherExposureV1, createNaturalCapabilitiesAnswerPlanV1 } from "./hybrid.natural.capabilities.v1";

export const CLOUDFLARE_TEACHER_RESPONSE_BYTES_V1 = 65_536;
export type OfflineCloudflareRestRequestV1 = Readonly<{ method: "POST"; path_template: string; body: string }>;
export type OfflineCloudflareRestFixtureV1 = Readonly<{
  status: number; body: string; delay_ms?: number;
  // Out-of-band synthetic metering. NOT a Cloudflare field or measured live usage.
  offline_neurons?: number;
}>;

// Intentionally no fetch, URL, headers, secrets, AI binding or callback capable of
// network I/O. Only deterministic in-memory responses can be injected in STEP13F.
export class MockCloudflareTeacherRestTransportV1 {
  readonly mode = "IN_MEMORY_ONLY" as const;
  private readonly fixtures: readonly OfflineCloudflareRestFixtureV1[];
  private readonly calls: OfflineCloudflareRestRequestV1[] = [];
  private position = 0;
  constructor(fixtures: readonly OfflineCloudflareRestFixtureV1[]) { this.fixtures = hybridSnapshotV1(fixtures); }
  requests() { return hybridSnapshotV1(this.calls); }
  async post(request: OfflineCloudflareRestRequestV1, signal: AbortSignal): Promise<OfflineCloudflareRestFixtureV1> {
    if (signal.aborted) throw new HybridTeacherProviderErrorV1("ABORTED", false);
    const fixture = this.fixtures[this.position++];
    if (!fixture) throw new HybridTeacherProviderErrorV1("OFFLINE_FIXTURE_EXHAUSTED", false);
    this.calls.push(hybridSnapshotV1(request));
    if (fixture.delay_ms) await new Promise<void>((resolve, reject) => {
      const aborted = () => { clearTimeout(timer); reject(new HybridTeacherProviderErrorV1("ABORTED", false)); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", aborted); resolve(); }, fixture.delay_ms);
      signal.addEventListener("abort", aborted, { once: true });
    });
    if (signal.aborted) throw new HybridTeacherProviderErrorV1("ABORTED", false);
    return fixture;
  }
}

const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const responseSchema = { type: "object", properties: { version: { type: "integer", enum: [1] }, answer: { type: "string", minLength: 1, maxLength: 16384 } },
  required: ["version", "answer"], additionalProperties: false };

// Pure offline inspection of the SAME wire used by the adapter; no destination or credentials.
export function prepareCloudflareTeacherRealizationWireV1(max_output_tokens: number): OfflineCloudflareRestRequestV1 {
  if (!Number.isSafeInteger(max_output_tokens) || max_output_tokens < 1) throw new TypeError("INVALID_OUTPUT_LIMIT");
  const plan = createNaturalCapabilitiesAnswerPlanV1();
  const prompt = `${createPlannerAgentVoiceInstructionV1()} Realization only. Use only the governed public statements below. Preserve every limitation and negation. Return only JSON with version 1 and answer; do not return reasoning or call tools.\n${hybridCanonicalV1({ purpose: "REALIZATION", language: "en", governed_statements: plan.mandatory_elements.map(e => e.approved_text) })}`;
  return hybridSnapshotV1({ method: "POST", path_template: `/client/v4/accounts/{ACCOUNT_ID}/ai/run/${HYBRID_TEACHER_MODEL_V1}`,
    body: JSON.stringify({ prompt, response_format: { type: "json_schema", json_schema: responseSchema }, stream: false, max_tokens: max_output_tokens, temperature: 0 }) });
}

export function inspectCloudflareTeacherZeroCostGateV1() {
  return hybridSnapshotV1({ ...inspectLiveTeacherAvailabilityV1(), teacher_live_enabled: false,
    blockers: [...inspectLiveTeacherAvailabilityV1().blockers, "STEP13F_OFFLINE_ONLY", "LIVE_CONSUMPTION_UNKNOWN"],
    requirements: { account_and_plan: "NOT_VERIFIED", model_free_eligibility: "NOT_VERIFIED_FOR_ACCOUNT",
      authorized_daily_budget: "OFFLINE_FIXTURE_ONLY", distributed_accounting: "NOT_IMPLEMENTED",
      per_request_bound: "OFFLINE_ONLY", consumption: "LIVE_UNKNOWN", exposure: "QUALIFIED_REALIZATION_SCOPE_ONLY" },
    billing_changes_allowed: false, real_neurons_consumed_by_adapter: 0 });
}

export class CloudflareTeacherRestOfflineAdapterV1 implements HybridTeacherProviderV1 {
  readonly mode = "MOCK_ONLY" as const;
  readonly provider_id = "CLOUDFLARE_WORKERS_AI" as const;
  readonly model = HYBRID_TEACHER_MODEL_V1;
  readonly model_revision: string;
  readonly configuration_version: string;
  private readonly configuration: OfflineTeacherConfigurationV1;
  constructor(configuration: OfflineTeacherConfigurationV1, private readonly transport: MockCloudflareTeacherRestTransportV1) {
    if (!configuration || !validOfflineTeacherConfigurationV1(configuration, configuration.day_utc) ||
        !(transport instanceof MockCloudflareTeacherRestTransportV1) || transport.constructor !== MockCloudflareTeacherRestTransportV1 || transport.mode !== "IN_MEMORY_ONLY") {
      throw new HybridTeacherProviderErrorV1("OFFLINE_CONFIGURATION_REQUIRED", false);
    }
    this.configuration = hybridSnapshotV1(configuration);
    this.model_revision = configuration.model_revision;
    this.configuration_version = configuration.configuration_version;
  }

  async complete(input: HybridTeacherRequestV1, signal: AbortSignal): Promise<Readonly<{ candidate: unknown; usage: HybridUsageV1 }>> {
    if (signal.aborted) throw new HybridTeacherProviderErrorV1("ABORTED", false);
    let request: HybridTeacherRequestV1;
    try { request = this.validate(input); }
    catch { throw new HybridTeacherProviderErrorV1("REQUEST_CONTRACT_INVALID", false); }
    // Purpose is handled explicitly: no Interpretation egress in the qualified slice.
    if (request.purpose !== "REALIZATION" || request.surface.purpose !== "REALIZATION") throw new HybridTeacherProviderErrorV1("INTERPRETATION_EXPOSURE_DENIED", false);
    const exposure = await authorizeNaturalCapabilitiesTeacherExposureV1(request.surface, request.request_digest);
    if (!exposure || hybridCanonicalV1(exposure) !== hybridCanonicalV1(request.exposure)) throw new HybridTeacherProviderErrorV1("EXPOSURE_DENIED", false);
    return this.realize(request, signal);
  }

  private validate(input: HybridTeacherRequestV1): HybridTeacherRequestV1 {
    const request = hybridSnapshotV1(input);
    const keys = ["version", "boundary", "purpose", "request_id", "request_digest", "model", "model_revision", "configuration_version", "contracts", "exposure", "surface", "limits", "escalation_reason", "attempt", "state"];
    if (Object.keys(request).sort().join() !== keys.sort().join() || request.version !== 1 || request.boundary !== "CONVERSATIONAL_SURFACE_ONLY" ||
        !["INTERPRETATION", "REALIZATION"].includes(request.purpose) || !object(request.surface) ||
        request.model !== this.model || request.model_revision !== this.model_revision || request.configuration_version !== this.configuration_version ||
        request.state !== "RESERVED" || !Number.isSafeInteger(request.attempt) || request.attempt < 0 || request.attempt > this.configuration.limits.max_retries ||
        typeof request.request_id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/.test(request.request_id) ||
        hybridCanonicalV1(request.contracts) !== hybridCanonicalV1({ interpretation: 1, realization: 1, teacher: 1 }) ||
        hybridCanonicalV1(request.limits) !== hybridCanonicalV1(this.configuration.limits) || request.request_digest !== hybridDigestV1(request.surface)) {
      throw new HybridTeacherProviderErrorV1("REQUEST_CONTRACT_INVALID", false);
    }
    return request;
  }

  private async realize(request: HybridTeacherRequestV1, signal: AbortSignal) {
    // Only canonical statements and public Voice are sent. No original question,
    // provenance digest, role, request ID, quota metadata, history or credentials.
    const wire = prepareCloudflareTeacherRealizationWireV1(request.limits.max_output_tokens);
    if (Buffer.byteLength(wire.body, "utf8") > request.limits.max_input_bytes) throw new HybridTeacherProviderErrorV1("INPUT_BOUND_EXCEEDED", false);
    const response = await this.post(wire, signal, request.limits.timeout_ms);
    if (!Number.isInteger(response.status) || response.status < 100 || response.status > 599 || typeof response.body !== "string" || Buffer.byteLength(response.body, "utf8") > CLOUDFLARE_TEACHER_RESPONSE_BYTES_V1) {
      throw new HybridTeacherProviderErrorV1("RESPONSE_BOUND_INVALID", false, true);
    }
    let parsed: Record<string, any> | undefined;
    try { const value: unknown = JSON.parse(response.body); if (object(value)) parsed = value; } catch { /* Classified below. */ }
    if (response.status < 200 || response.status >= 300 || parsed?.success === false) {
      const codes: number[] = Array.isArray(parsed?.errors) ? parsed.errors.filter(object).map((e: any) => e.code) : [];
      if (codes.includes(5035)) throw new HybridTeacherProviderErrorV1("CF_PAID_PLAN_REQUIRED", false);
      if (codes.includes(3036)) throw new HybridTeacherProviderErrorV1("CF_DAILY_QUOTA_EXHAUSTED", false);
      if (codes.includes(3008)) throw new HybridTeacherProviderErrorV1("ABORTED", false);
      if (codes.includes(3040)) throw new HybridTeacherProviderErrorV1("CF_CAPACITY_UNAVAILABLE", true);
      if (codes.includes(3007)) throw new HybridTeacherProviderErrorV1("TIMEOUT", true);
      throw new HybridTeacherProviderErrorV1(`CF_HTTP_${response.status}`, response.status >= 500);
    }
    const result = parsed?.result;
    const u = object(result) ? result.usage : undefined;
    if (!object(u) || ![u.prompt_tokens, u.completion_tokens, u.total_tokens].every(count) ||
        !Number.isSafeInteger(u.prompt_tokens + u.completion_tokens) || u.total_tokens !== u.prompt_tokens + u.completion_tokens ||
        u.prompt_tokens > request.limits.max_input_tokens || u.completion_tokens > request.limits.max_output_tokens ||
        !count(response.offline_neurons) || response.offline_neurons > request.limits.max_neurons_per_attempt) {
      throw new HybridTeacherProviderErrorV1("USAGE_UNKNOWN_OR_INCOHERENT", false, true);
    }
    // Synthetic Neurons are supplied by the mock control plane, never inferred
    // from token pricing or read from model-authored content/JSON fields.
    const usage = hybridSnapshotV1({ input_tokens: u.prompt_tokens, output_tokens: u.completion_tokens, neurons: response.offline_neurons });
    const choice = Array.isArray(result.choices) && result.choices.length === 1 ? result.choices[0] : undefined;
    const message = object(choice) ? choice.message : undefined;
    if (parsed?.success !== true || !Array.isArray(parsed.errors) || parsed.errors.length || result.object !== "chat.completion" || result.model !== this.model ||
        !object(choice) || choice.index !== 0 || choice.finish_reason !== "stop" || !object(message) || message.role !== "assistant" ||
        typeof message.content !== "string" || (message.tool_calls !== undefined && (!Array.isArray(message.tool_calls) || message.tool_calls.length))) {
      throw new HybridTeacherProviderErrorV1("CF_RESPONSE_CONTRACT_INVALID", false, false, usage);
    }
    const candidate = parseRealizationEnvelopeV1(message.content);
    if (!candidate) throw new HybridTeacherProviderErrorV1("CF_REALIZATION_CONTRACT_INVALID", false, false, usage);
    return hybridSnapshotV1({ candidate: JSON.stringify(candidate), usage });
  }

  private async post(wire: OfflineCloudflareRestRequestV1, parent: AbortSignal, timeout: number) {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    parent.addEventListener("abort", abort, { once: true });
    if (parent.aborted) controller.abort();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
    let aborted: () => void = () => {};
    try {
      return await Promise.race([this.transport.post(wire, controller.signal), new Promise<never>((_, reject) => {
        aborted = () => reject(new HybridTeacherProviderErrorV1(timedOut ? "TIMEOUT" : "ABORTED", timedOut));
        controller.signal.addEventListener("abort", aborted, { once: true });
        if (controller.signal.aborted) aborted();
      })]);
    } catch (error) {
      if (controller.signal.aborted) throw new HybridTeacherProviderErrorV1(timedOut ? "TIMEOUT" : "ABORTED", timedOut);
      if (error instanceof HybridTeacherProviderErrorV1) throw error;
      throw new HybridTeacherProviderErrorV1("TRANSPORT_FAILURE", false, true);
    } finally {
      clearTimeout(timer); parent.removeEventListener("abort", abort); controller.signal.removeEventListener("abort", aborted); controller.abort();
    }
  }
}
