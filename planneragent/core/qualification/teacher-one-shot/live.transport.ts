import { TextDecoder } from "node:util";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1, type HybridCheckV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { HYBRID_TEACHER_MODEL_V1 } from "../../src/conversation/cognition/hybrid.conversational.teacher.v1";
import { parseRealizationEnvelopeV1 } from "../../src/conversation/cognitive.realization.envelope.v1";
import { authorizeNaturalCapabilitiesTeacherExposureV1, prepareNaturalCapabilitiesRealizationV1, verifyNaturalCapabilitiesBindingV1 } from "../../src/conversation/cognition/hybrid.natural.capabilities.v1";
import { createInjectedExperimentManifestV1, OneShotTransportErrorV1, OFFLINE_AUTHORIZATION_V1, TEACHER_ENDPOINT_V1,
  type ExperimentManifestV1, type InjectedExperimentManifestV1, type LiveAttemptReceiptV1, type OfflineAuthorizationV1, type ProviderTokensV1 } from "./live.contracts";
import { InjectedHttpFixtureClientV1, type OneShotHttpClientV1, type OneShotHttpRequestV1, type OneShotHttpResponseV1 } from "./live.http";
import { LiveAttemptJournalV1 } from "./live.journal";
import { inspectFrozenOneShotPayloadV1, ONE_SHOT_LIMITS_V1 } from "./executor";
import { createNativeExperimentManifestV1, LIVE_NETWORK_ENABLED_V1, denyRealDispatchV1 } from "./live.contracts";
import { GuardedNativeHttpsClientV1 } from "./live.http";
import { validateNativeAuthorizationV1, requireNativeLocalInputBoundsV1 } from "./live.authorization";
import { readDedicatedTokenV1 } from "./live.credential";

export async function runNativeLiveTransportExperimentV1(authorization: unknown): Promise<LiveAttemptReceiptV1> {
  if (!LIVE_NETWORK_ENABLED_V1) denyRealDispatchV1();
  validateNativeAuthorizationV1(authorization);
  requireNativeLocalInputBoundsV1(); // Local proof is mandatory; hosted uncertainty requires separate acknowledgment above.
  const journal = LiveAttemptJournalV1.fixedLocation();
  if (journal.inspect().state !== "UNCLAIMED") throw new OneShotTransportErrorV1("ATTEMPT_ALREADY_RESERVED");
  let token = await readDedicatedTokenV1();
  try {
    const base = buildInjectedCloudflareRequestV1(createInjectedExperimentManifestV1(), OFFLINE_AUTHORIZATION_V1);
    const input = { ...base, headers: { ...base.headers, authorization: `Bearer ${token}` } };
    try { return await runTransportV1(createNativeExperimentManifestV1(), input, new GuardedNativeHttpsClientV1(authorization, journal), journal); }
    finally { input.headers.authorization = ""; }
  } finally { token = ""; }
}

const object = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);
const count = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 0;
const unknownTokens = (): ProviderTokensV1 => ({ state: "UNKNOWN", provenance: "INJECTED_PROVIDER_RESPONSE" });
function tokens(value: unknown): ProviderTokensV1 {
  if (!object(value) || !["prompt_tokens", "completion_tokens", "total_tokens"].every(k => Object.hasOwn(value, k))) return unknownTokens();
  if (![value.prompt_tokens, value.completion_tokens, value.total_tokens].every(count) || value.completion_tokens > 512 ||
      !Number.isSafeInteger(value.prompt_tokens + value.completion_tokens) || value.total_tokens !== value.prompt_tokens + value.completion_tokens) {
    return { state: "INCONSISTENT", provenance: "INJECTED_PROVIDER_RESPONSE" };
  }
  return { state: "KNOWN", provenance: "INJECTED_PROVIDER_RESPONSE", input_tokens: value.prompt_tokens,
    output_tokens: value.completion_tokens, total_tokens: value.total_tokens };
}
function header(response: OneShotHttpResponseV1, name: string): string | undefined {
  const values = Object.entries(response.headers).filter(([k]) => k.toLowerCase() === name);
  if (values.length > 1 || values.some(([, v]) => typeof v !== "string")) throw new OneShotTransportErrorV1("RESPONSE_HEADERS_INVALID");
  return values[0]?.[1] as string | undefined;
}

export function buildInjectedCloudflareRequestV1(manifest: InjectedExperimentManifestV1, authorization: OfflineAuthorizationV1): OneShotHttpRequestV1 {
  if (hybridCanonicalV1(manifest) !== hybridCanonicalV1(createInjectedExperimentManifestV1())) throw new OneShotTransportErrorV1("MANIFEST_INVALID");
  if (!authorization || hybridCanonicalV1(authorization) !== hybridCanonicalV1(OFFLINE_AUTHORIZATION_V1)) throw new OneShotTransportErrorV1("DEDICATED_AUTHORIZATION_REQUIRED");
  const frozen = inspectFrozenOneShotPayloadV1();
  if (Buffer.byteLength(frozen.wire.body, "utf8") > ONE_SHOT_LIMITS_V1.max_input_bytes) throw new OneShotTransportErrorV1("INPUT_TOO_LARGE");
  return hybridSnapshotV1({ method: "POST", url: TEACHER_ENDPOINT_V1, body: frozen.wire.body,
    headers: { authorization: `Bearer [${authorization.kind}]`, "content-type": "application/json", accept: "application/json",
      "accept-encoding": "identity", "content-length": String(Buffer.byteLength(frozen.wire.body, "utf8")) } });
}

type ReceiptKeys = "outcome" | "failure_code" | "provider_error_codes" | "provider_tokens" |
  "envelope_valid" | "structural_conformity" | "semantic_fidelity" | "candidate_digest" | "verification";
type ReceiptFields = { -readonly [K in keyof Pick<LiveAttemptReceiptV1, ReceiptKeys>]: LiveAttemptReceiptV1[K] };
function initialFields(): ReceiptFields {
  return { outcome: "REJECTED", provider_error_codes: [], provider_tokens: unknownTokens(),
    envelope_valid: false, structural_conformity: false, semantic_fidelity: "INCONCLUSIVE" };
}
async function parseCompletion(bytes: Uint8Array, status: number): Promise<ReceiptFields> {
  const fields = initialFields();
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { return { ...fields, failure_code: "MALFORMED_JSON_OR_UTF8" }; }
  if (!object(parsed) || typeof parsed.success !== "boolean" || !Array.isArray(parsed.errors) ||
      Object.keys(parsed).some(k => !["success", "errors", "messages", "result"].includes(k)) ||
      (parsed.messages !== undefined && !Array.isArray(parsed.messages))) return { ...fields, failure_code: "REST_WRAPPER_INVALID" };
  const errorCodes = parsed.errors.filter(object).map(e => e.code).filter(count);
  if (status < 200 || status >= 300 || !parsed.success || parsed.errors.length) {
    return { ...fields, outcome: "PROVIDER_ERROR", provider_error_codes: errorCodes,
      failure_code: errorCodes.includes(3036) ? "CF_DAILY_QUOTA_EXHAUSTED" : errorCodes.includes(5035) ? "CF_PAID_PLAN_REQUIRED" :
        errorCodes.includes(3040) ? "CF_CAPACITY_UNAVAILABLE" : errorCodes.includes(3007) ? "CF_PROVIDER_TIMEOUT" : "CF_PROVIDER_ERROR" };
  }
  const result = parsed.result;
  if (!object(result)) return { ...fields, failure_code: "COMPLETION_INVALID" };
  fields.provider_tokens = tokens(result.usage);
  const choice = Array.isArray(result.choices) && result.choices.length === 1 ? result.choices[0] : undefined;
  const message = object(choice) ? choice.message : undefined;
  if (typeof result.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/.test(result.id) || !count(result.created) || result.created === 0 ||
      result.object !== "chat.completion" || result.model !== HYBRID_TEACHER_MODEL_V1 || !object(choice) || choice.index !== 0 || choice.finish_reason !== "stop" ||
      (choice.stop_reason !== undefined && choice.stop_reason !== null && choice.stop_reason !== "stop") ||
      !object(message) || message.role !== "assistant" || typeof message.content !== "string" ||
      Object.keys(message).some(k => !["role", "content", "reasoning_content", "tool_calls"].includes(k)) ||
      (message.reasoning_content !== undefined && typeof message.reasoning_content !== "string") ||
      (message.tool_calls !== undefined && (!Array.isArray(message.tool_calls) || message.tool_calls.length !== 0))) {
    return { ...fields, failure_code: "COMPLETION_INVALID_OR_TRUNCATED" };
  }
  // Never copy/log/persist reasoning, raw provider body, provider messages or headers.
  delete message.reasoning_content;
  const candidate = parseRealizationEnvelopeV1(message.content);
  if (!candidate) return { ...fields, failure_code: "REALIZATION_ENVELOPE_INVALID" };
  fields.envelope_valid = true; fields.structural_conformity = true;
  const request = prepareNaturalCapabilitiesRealizationV1();
  const verification = await verifyNaturalCapabilitiesBindingV1({ request, candidate, request_digest: hybridDigestV1(request), candidate_digest: hybridDigestV1(candidate) }, new AbortController().signal);
  const checks = Object.values(verification.checks);
  const semantic: HybridCheckV1 = checks.some(c => c === "FAIL") ? "FAIL" : checks.every(c => c === "PASS") ? "PASS" : "INCONCLUSIVE";
  return { ...fields, outcome: fields.provider_tokens.state === "KNOWN" ? "COMPLETED" : "REJECTED",
    ...(fields.provider_tokens.state === "KNOWN" ? {} : { failure_code: fields.provider_tokens.state === "UNKNOWN" ? "USAGE_UNKNOWN" : "USAGE_INCONSISTENT" }),
    semantic_fidelity: semantic, candidate_digest: hybridDigestV1(candidate), verification };
}

export async function runInjectedLiveTransportExperimentV1(manifest: InjectedExperimentManifestV1, authorization: OfflineAuthorizationV1,
  client: OneShotHttpClientV1, journal: LiveAttemptJournalV1): Promise<LiveAttemptReceiptV1> {
  // No arbitrary callback client and no native client can acquire dispatch through 13J.
  if (!(client instanceof InjectedHttpFixtureClientV1) || client.constructor !== InjectedHttpFixtureClientV1 ||
      !(journal instanceof LiveAttemptJournalV1) || journal.storage_mode !== "ISOLATED_OFFLINE_FIXTURE") throw new OneShotTransportErrorV1("REAL_DISPATCH_DISABLED_STEP13J");
  const input = buildInjectedCloudflareRequestV1(manifest, authorization);
  return runTransportV1(manifest, input, client, journal);
}
async function runTransportV1(manifest: ExperimentManifestV1, input: OneShotHttpRequestV1, client: OneShotHttpClientV1, journal: LiveAttemptJournalV1): Promise<LiveAttemptReceiptV1> {
  const surface = prepareNaturalCapabilitiesRealizationV1();
  if (!await authorizeNaturalCapabilitiesTeacherExposureV1(surface, hybridDigestV1(surface))) throw new OneShotTransportErrorV1("EXPOSURE_DENIED");
  journal.reserve(manifest);
  journal.acquireDispatchPermission(); // Both markers fsynced BEFORE client invocation; no retry path.
  const controller = new AbortController();
  let response: OneShotHttpResponseV1 | undefined, providerStatus: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fields: ReceiptFields;
  try {
    fields = await Promise.race([Promise.resolve().then(async () => {
      response = await client.post(input, controller.signal);
      if (controller.signal.aborted) { response.close(); throw new OneShotTransportErrorV1("DEADLINE_EXCEEDED"); }
      if (response.url !== TEACHER_ENDPOINT_V1) throw new OneShotTransportErrorV1("RESPONSE_ORIGIN_OR_PATH_INVALID");
      if (!Number.isInteger(response.status) || response.status < 100 || response.status > 599) throw new OneShotTransportErrorV1("RESPONSE_STATUS_INVALID");
      providerStatus = response.status;
      if (response.status >= 300 && response.status < 400) throw new OneShotTransportErrorV1("REDIRECT_DENIED");
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(header(response, "content-type") ?? "")) throw new OneShotTransportErrorV1("CONTENT_TYPE_DENIED");
      const encoding = header(response, "content-encoding");
      if (encoding !== undefined && encoding.toLowerCase() !== "identity") throw new OneShotTransportErrorV1("CONTENT_ENCODING_DENIED");
      const length = header(response, "content-length");
      if (length !== undefined && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) throw new OneShotTransportErrorV1("RESPONSE_HEADERS_INVALID");
      if (length !== undefined && Number(length) > ONE_SHOT_LIMITS_V1.max_response_bytes) throw new OneShotTransportErrorV1("RESPONSE_TOO_LARGE");
      let total = 0; const chunks: Uint8Array[] = [];
      for await (const chunk of response.body) {
        if (controller.signal.aborted) throw new OneShotTransportErrorV1("DEADLINE_EXCEEDED");
        if (!(chunk instanceof Uint8Array)) throw new OneShotTransportErrorV1("RESPONSE_BODY_INVALID");
        total += chunk.byteLength;
        if (total > ONE_SHOT_LIMITS_V1.max_response_bytes) throw new OneShotTransportErrorV1("RESPONSE_TOO_LARGE");
        if (chunk.byteLength) chunks.push(chunk);
      }
      if (length !== undefined && total !== Number(length)) throw new OneShotTransportErrorV1("RESPONSE_LENGTH_MISMATCH");
      return parseCompletion(Buffer.concat(chunks, total), response.status);
    }), new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); response?.close(); reject(new OneShotTransportErrorV1("DEADLINE_EXCEEDED")); }, 30000); })]);
  } catch (error) {
    const code = error instanceof OneShotTransportErrorV1 ? error.code : "CONNECTION_OR_BODY_FAILED";
    const uncertain = ["DEADLINE_EXCEEDED", "CONNECTION_OR_BODY_FAILED", "CONNECTION_FAILED"].includes(code);
    fields = { ...initialFields(), outcome: uncertain ? "UNCERTAIN" : "REJECTED", failure_code: code };
  } finally { if (timer) clearTimeout(timer); controller.abort(); response?.close(); }
  const receipt: LiveAttemptReceiptV1 = hybridSnapshotV1({ version: 1, mode: manifest.mode, lifecycle: "SHADOW",
    experiment_id: manifest.experiment_id, account_id: manifest.account_id, model: manifest.model, payload_digest: manifest.payload_digest,
    authorization_evidence_ref: manifest.authorization_evidence_ref, state: "STOPPED", dispatch: "PERMISSION_CONSUMED", ...fields,
    ...(providerStatus === undefined ? {} : { provider_status: providerStatus }),
    provider_tokens: { ...fields.provider_tokens, provenance: manifest.mode === "NATIVE_HTTPS_ONESHOT" ? "NATIVE_PROVIDER_RESPONSE" : "INJECTED_PROVIDER_RESPONSE" },
    injected_http_requests: client instanceof InjectedHttpFixtureClientV1 ? client.inspect().calls : 0,
    actual_network_requests: manifest.mode === "NATIVE_HTTPS_ONESHOT" ? 1 : 0, neurons: "UNKNOWN", linguistic_quality: "INDEPENDENT_REVIEW_REQUIRED", reasoning_persisted: false,
    public_response_unchanged: true, automatic_training: false });

  journal.finish(receipt);
  return receipt;
}
