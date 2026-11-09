import "../../../qualification/teacher-one-shot/offline.network.setup";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import https from "node:https";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
// Replace BOTH default and named exports before importing any production module.
vi.mock("node:https", async importOriginal => {
  const actual: any = await importOriginal();
  const request = vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); });
  return { ...actual, request, default: { ...actual.default, request } };
});

let root: string;
const synthetic = "SYNTHETIC_OFFLINE_CREDENTIAL_123456";
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "pa-13k-"));
  vi.resetModules();
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); }));
  vi.mocked(https.request).mockReset().mockImplementation(() => { throw new Error(synthetic); });
});
afterEach(() => {
  expect(globalThis.fetch).not.toHaveBeenCalled();
  vi.doUnmock("../../../qualification/teacher-one-shot/live.contracts");
  vi.doUnmock("../../../qualification/teacher-one-shot/live.credential");
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  rmSync(root, { recursive: true, force: true });
});
async function setup(enabled = true, hostedAcknowledged = true) {
  // Test-only module substitution: production gate and fixed live directory are never edited.
  vi.doMock("../../../qualification/teacher-one-shot/live.contracts", async importOriginal => {
    const actual: any = await importOriginal();
    return { ...actual, LIVE_NETWORK_ENABLED_V1: enabled, FIXED_LIVE_STATE_DIRECTORY_V1: root,
      createNativeExperimentManifestV1: () => ({ ...actual.createNativeExperimentManifestV1(), state_location: root }) };
  });
  const credential = vi.fn(async () => synthetic);
  vi.doMock("../../../qualification/teacher-one-shot/live.credential", () => ({ readDedicatedTokenV1: credential }));
  const auth = await import("../../../qualification/teacher-one-shot/live.authorization");
  const transport = await import("../../../qualification/teacher-one-shot/live.transport");
  const authorization = { ...auth.nativeAuthorizationChallengeV1(), confirmation: auth.nativeAuthorizationPhraseV1(),
    ...(hostedAcknowledged ? { hosted_input_uncertainty_acknowledgment: auth.nativeHostedInputAcknowledgmentPhraseV1() } : {}) };
  return { ...auth, ...transport, authorization, credential };
}
it("production gate is false in source and denies before credential acquisition, journal or socket", async () => {
  expect(readFileSync("qualification/teacher-one-shot/live.contracts.ts", "utf8")).toContain("LIVE_NETWORK_ENABLED_V1 = false as const");
  expect(readFileSync("qualification/teacher-one-shot/live.contracts.ts", "utf8")).toContain("NATIVE_INPUT_TOKEN_BOUND_QUALIFIED_V1 = false as const");
  const x = await setup(false);
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("REAL_DISPATCH_DISABLED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
  expect(existsSync(join(root, "reserved.json"))).toBe(false);
});
it.each(["account_id", "model", "payload_digest", "experiment_id", "state_location"])("denies changed binding %s before credential or I/O", async key => {
  const x = await setup(); const a: any = structuredClone(x.authorization); a.manifest[key] = "WRONG";
  await expect(x.runNativeLiveTransportExperimentV1(a)).rejects.toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it.each(["operator_verified_workers_free", "operator_verified_no_payment_method", "route", "confirmation", "authorize_exactly_one_post", "token_name", "token_expires", "neuron_usage"])("denies missing or invalid %s", async key => {
  const x = await setup(); const a: any = structuredClone(x.authorization); delete a[key];
  await expect(x.runNativeLiveTransportExperimentV1(a)).rejects.toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it("denies expiry and cancellation before reservation", async () => {
  const x = await setup(); vi.setSystemTime(new Date("2026-10-29T00:00:00Z"));
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("EXPIRED");
  vi.setSystemTime(new Date("2026-10-22T00:00:00Z"));
  x.credential.mockRejectedValueOnce(new Error("CREDENTIAL_ENTRY_CANCELLED_OR_INVALID"));
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("CREDENTIAL_ENTRY_CANCELLED");
  expect(existsSync(join(root, "reserved.json"))).toBe(false); expect(https.request).not.toHaveBeenCalled();
});
it("sanitizes synchronous native failure, journals before request, and permanently refuses replay", async () => {
  const x = await setup();
  vi.mocked(https.request).mockImplementation(() => {
    expect(existsSync(join(root, "reserved.json"))).toBe(true);
    expect(existsSync(join(root, "dispatch.json"))).toBe(true);
    throw new Error(synthetic);
  });
  const r = await x.runNativeLiveTransportExperimentV1(x.authorization);
  expect(r).toMatchObject({ outcome: "UNCERTAIN", failure_code: "CONNECTION_FAILED", neurons: "UNKNOWN", actual_network_requests: 1 });
  expect(readFileSync(join(root, "result.json"), "utf8")).not.toContain(synthetic);
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("ATTEMPT_ALREADY_RESERVED");
  expect(https.request).toHaveBeenCalledTimes(1); expect(x.credential).toHaveBeenCalledTimes(1);
});
it.each(["error", "redirect", "success", "quota"])("handles native %s through injected HTTPS machinery only", async kind => {
  const x = await setup();
  const { createValidInjectedCompletionV1 } = await import("../../../qualification/teacher-one-shot/live.fixtures");
  const destroy = vi.fn();
  vi.mocked(https.request).mockImplementation(((_url: unknown, _options: unknown, callback: any) => {
    const outgoing = new EventEmitter() as any;
    outgoing.end = () => {
      if (kind === "error") { outgoing.emit("error", new Error(synthetic)); return; }
      const response = new PassThrough() as any;
      response.statusCode = kind === "redirect" ? 302 : kind === "quota" ? 429 : 200;
      response.headers = { "content-type": "application/json" };
      callback(response); response.end(JSON.stringify(kind === "quota" ? { success: false, errors: [{ code: 3036 }] } : createValidInjectedCompletionV1()));
    };
    outgoing.destroy = destroy; return outgoing;
  }) as any);
  const r = await x.runNativeLiveTransportExperimentV1(x.authorization);
  expect(https.request).toHaveBeenCalledTimes(1);
  expect(r.neurons).toBe("UNKNOWN");
  expect(r.provider_tokens.provenance).toBe("NATIVE_PROVIDER_RESPONSE");
  expect(r.outcome).toBe(kind === "success" ? "COMPLETED" : kind === "error" ? "UNCERTAIN" : kind === "quota" ? "PROVIDER_ERROR" : "REJECTED");
  expect(JSON.stringify(r)).not.toContain(synthetic);
  if (kind === "quota") {
    expect(r.failure_code).toBe("CF_DAILY_QUOTA_EXHAUSTED");
    expect(r).toMatchObject({ public_response_unchanged: true, automatic_training: false, lifecycle: "SHADOW", semantic_fidelity: "INCONCLUSIVE" });
    expect(JSON.parse(readFileSync(join(root, "result.json"), "utf8"))).toEqual(r);
    const { hybridDigestV1 } = await import("../cognition/hybrid.conversational.contracts.v1");
    expect(JSON.parse(readFileSync(join(root, "reserved.json"), "utf8")).manifest_digest).toBe(hybridDigestV1(x.authorization.manifest));
    await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("ATTEMPT_ALREADY_RESERVED");
    expect(https.request).toHaveBeenCalledTimes(1); expect(x.credential).toHaveBeenCalledTimes(1);
  }
});
it("source opening and Neuron acceptance cannot waive the separate hosted-risk acknowledgment", async () => {
  const x = await setup(true, false);
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
  expect(existsSync(join(root, "reserved.json"))).toBe(false);
  const { GuardedNativeHttpsClientV1 } = await import("../../../qualification/teacher-one-shot/live.http");
  const { LiveAttemptJournalV1 } = await import("../../../qualification/teacher-one-shot/live.journal");
  await expect(new GuardedNativeHttpsClientV1(x.authorization, LiveAttemptJournalV1.fixedLocation())
    .post(undefined as any, new AbortController().signal)).rejects.toThrow("HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED");
  expect(https.request).not.toHaveBeenCalled();
});
it("requires explicit authorization even with UNKNOWN quota acceptance", async () => {
  const x = await setup();
  await expect(x.runNativeLiveTransportExperimentV1(undefined)).rejects.toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it.each(["experiment_id", "operator_decision", "workers_free_required", "payment_method_allowed", "paid_upgrade_allowed", "route", "max_posts", "quota_error_consumes_attempt", "retries", "fallback_allowed"])("rejects weakened experiment-specific usage policy %s", async key => {
  const x = await setup(); const a: any = structuredClone(x.authorization);
  const previous = a.manifest.admission_policy[key];
  a.manifest.admission_policy[key] = typeof previous === "boolean" ? !previous : typeof previous === "number" ? previous + 1 : "INVALID";
  await expect(x.runNativeLiveTransportExperimentV1(a)).rejects.toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it("binds UNKNOWN acceptance and fixed dedicated token identity to this experiment only", async () => {
  const x = await setup();
  const policy = x.authorization.manifest.admission_policy;
  expect(policy).toMatchObject({ experiment_id: x.authorization.manifest.experiment_id,
    operator_decision: "USAGE_UNKNOWN_ACCEPTED_FOR_ONE_EXPERIMENT", daily_neurons: "UNKNOWN", actual_neurons: "UNKNOWN",
    workers_free_required: true, payment_method_allowed: false, paid_upgrade_allowed: false, max_posts: 1,
    quota_error_consumes_attempt: true, retries: 0, fallback_allowed: false });
  expect(() => x.validateNativeAuthorizationV1(x.authorization)).not.toThrow();
  const a = { ...x.authorization, token_name: "OTHER_TOKEN" };
  await expect(x.runNativeLiveTransportExperimentV1(a)).rejects.toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it("inspection preserves unresolved provider overhead and produces only a separate gate-opening request", async () => {
  const x = await setup(false, false);
  expect(x.inspectNativeInputTokenBoundV1()).toMatchObject({ qualified: false, wire_utf8_bytes: 2094, prompt_utf8_bytes: 1762,
    context_window_tokens: 32768, reserved_output_tokens: 512, exact_prompt_tokens: "UNKNOWN",
    local_input_state: "LOCAL_INPUT_BYTES_VERIFIED", max_request_bytes: 16384,
    local_token_estimate: { classification: "LOCAL_TOKEN_ESTIMATE", state: "NOT_CLAIMED" },
    hosted_input_state: "HOSTED_INPUT_TOKEN_COUNT_UNKNOWN", hosted_template_state: "HOSTED_TEMPLATE_OVERHEAD_UNKNOWN",
    provider_template_overhead_tokens: "UNKNOWN", provider_schema_overhead_tokens: "UNKNOWN", total_input_token_upper_bound: "UNRESOLVED" });
  expect(x.inspectNativeGateOpeningV1()).toMatchObject({ opens_gate: false,
    hosted_input_acknowledgment_collected: false,
    required_hosted_input_acknowledgment: expect.stringMatching(/^HOSTED_INPUT_TOKEN_UNCERTAINTY_ACCEPTED_FOR_ONE_EXPERIMENT sha256:/),
    separate_operator_decision_required: expect.stringMatching(/^APPROVE REVIEWED SOURCE GATE OPENING sha256:/) });
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it.each([false, true, "USAGE_UNKNOWN_ACCEPTED_FOR_ONE_EXPERIMENT", "HOSTED_INPUT_TOKEN_UNCERTAINTY_ACCEPTED_FOR_ONE_EXPERIMENT", "WRONG_DIGEST"])("rejects insufficient hosted acknowledgment %s before credentials/state/I/O", async acknowledgment => {
  const x = await setup();
  const a = { ...x.authorization, hosted_input_uncertainty_acknowledgment: acknowledgment };
  await expect(x.runNativeLiveTransportExperimentV1(a)).rejects.toThrow("HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
  expect(existsSync(join(root, "reserved.json"))).toBe(false);
});
it("accepts synthetic risk acknowledgment with hosted qualification still false, without changing local proof", async () => {
  const x = await setup();
  expect(x.inspectNativeInputTokenBoundV1().qualified).toBe(false);
  expect(() => x.validateNativeAuthorizationV1(x.authorization)).not.toThrow();
  expect(() => x.requireNativeLocalInputBoundsV1()).not.toThrow();
  expect(x.inspectNativeInputTokenBoundV1().wire_body_sha256).toBe("sha256:8b0e30d724da4959bddb3404b099d14f8d0b72d06e2633622cf12049783e563d");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it.each(["endpoint", "body", "oversize", "output_tokens", "content_length"])("risk acknowledgment cannot weaken native local validation of %s", async field => {
  const x = await setup();
  const { GuardedNativeHttpsClientV1 } = await import("../../../qualification/teacher-one-shot/live.http");
  const { LiveAttemptJournalV1 } = await import("../../../qualification/teacher-one-shot/live.journal");
  const contracts = await import("../../../qualification/teacher-one-shot/live.contracts");
  const journal = LiveAttemptJournalV1.fixedLocation();
  journal.reserve(contracts.createNativeExperimentManifestV1()); journal.acquireDispatchPermission();
  const base = x.buildInjectedCloudflareRequestV1(contracts.createInjectedExperimentManifestV1(), contracts.OFFLINE_AUTHORIZATION_V1);
  const input = { ...base, headers: { ...base.headers, authorization: `Bearer ${synthetic}` } };
  if (field === "endpoint") input.url += "?invalid=1";
  if (field === "body") input.body += " ";
  if (field === "oversize") input.body = "x".repeat(16385);
  if (field === "output_tokens") input.body = JSON.stringify({ ...JSON.parse(input.body), max_tokens: 513 });
  if (field === "content_length") input.headers["content-length"] = "999";
  await expect(new GuardedNativeHttpsClientV1(x.authorization, journal).post(input, new AbortController().signal))
    .rejects.toThrow(field === "endpoint" ? "ENDPOINT_INVALID" : "NATIVE_REQUEST_INVALID");
  expect(https.request).not.toHaveBeenCalled();
});
it.each(["experiment_id", "required_acknowledgment", "hosted_input_token_count", "hosted_template_overhead", "provider_estimated_input_validation", "context_window_tokens", "rejection_consumes_attempt"])("rejects altered hosted risk policy %s", async key => {
  const x = await setup(); const a: any = structuredClone(x.authorization);
  a.manifest.hosted_input_risk[key] = "INVALID";
  await expect(x.runNativeLiveTransportExperimentV1(a)).rejects.toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
  expect(x.credential).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it.each(["input_length", "model_compatibility", "quota", "json_schema"])("permanently consumes native provider rejection for %s", async reason => {
  const x = await setup();
  vi.mocked(https.request).mockImplementation(((_url: unknown, options: any, callback: any) => {
    expect(existsSync(join(root, "dispatch.json"))).toBe(true);
    expect(options.method).toBe("POST");
    const outgoing = new EventEmitter() as any;
    outgoing.end = () => {
      const response = new PassThrough() as any;
      response.statusCode = reason === "quota" ? 429 : 400;
      response.headers = { "content-type": "application/json" };
      // Synthetic generic errors do not assert undocumented numeric Cloudflare error mappings.
      callback(response); response.end(JSON.stringify({ success: false, errors: [{ code: reason === "quota" ? 3036 : 9999 }] }));
    };
    return outgoing;
  }) as any);
  const receipt = await x.runNativeLiveTransportExperimentV1(x.authorization);
  expect(receipt).toMatchObject({ outcome: "PROVIDER_ERROR", state: "STOPPED", dispatch: "PERMISSION_CONSUMED",
    neurons: "UNKNOWN", public_response_unchanged: true, automatic_training: false, lifecycle: "SHADOW" });
  expect(JSON.parse(readFileSync(join(root, "result.json"), "utf8"))).toEqual(receipt);
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("ATTEMPT_ALREADY_RESERVED");
  expect(https.request).toHaveBeenCalledTimes(1); expect(x.credential).toHaveBeenCalledTimes(1);
});
it("secure console denies redirected input without reading any credential source", async () => {
  const { readDedicatedTokenV1 } = await import("../../../qualification/teacher-one-shot/live.credential");
  vi.spyOn(process, "stdin", "get").mockReturnValue({ isTTY: false } as any);
  await expect(readDedicatedTokenV1()).rejects.toThrow("INTERACTIVE_CONSOLE_REQUIRED");
});
it.each(["enter", "cancel", "invalid", "stream-error"])("secure console handles %s without echo and restores raw mode", async kind => {
  const { readDedicatedTokenV1 } = await import("../../../qualification/teacher-one-shot/live.credential");
  const input = Object.assign(new EventEmitter(), { isTTY: true, isRaw: false, setRawMode: vi.fn(),
    isPaused: () => true, resume: vi.fn(), pause: vi.fn() });
  const write = vi.fn();
  vi.spyOn(process, "stdin", "get").mockReturnValue(input as any);
  vi.spyOn(process, "stdout", "get").mockReturnValue({ isTTY: true, write } as any);
  const promise = readDedicatedTokenV1();
  const assertion = kind === "enter" ? expect(promise).resolves.toBe(synthetic) : expect(promise).rejects.toThrow("CREDENTIAL_ENTRY_CANCELLED_OR_INVALID");
  if (kind === "stream-error") input.emit("error", new Error(synthetic));
  else input.emit("data", Buffer.from(synthetic + (kind === "enter" ? "\r" : kind === "cancel" ? "\u0003" : "!")));
  await assertion;
  expect(write.mock.calls.flat().join("")).not.toContain(synthetic);
  expect(input.setRawMode.mock.calls).toEqual([[true], [false]]);
  expect(input.listenerCount("data")).toBe(0); expect(input.pause).toHaveBeenCalled();
});
it("native journal permission cannot be reused by a separate client or reconstructed journal", async () => {
  const x = await setup();
  const { LiveAttemptJournalV1 } = await import("../../../qualification/teacher-one-shot/live.journal");
  const { createNativeExperimentManifestV1 } = await import("../../../qualification/teacher-one-shot/live.contracts");
  const journal = LiveAttemptJournalV1.fixedLocation();
  journal.reserve(createNativeExperimentManifestV1()); journal.acquireDispatchPermission();
  journal.claimNativeRequest();
  expect(() => journal.claimNativeRequest()).toThrow("DISPATCH_PERMISSION_DENIED");
  expect(() => LiveAttemptJournalV1.fixedLocation().claimNativeRequest()).toThrow("DISPATCH_PERMISSION_DENIED");
  expect(https.request).not.toHaveBeenCalled(); expect(x.credential).not.toHaveBeenCalled();
});
it.each(["deadline", "oversize"])("native %s consumes permission without retry", async kind => {
  const x = await setup();
  vi.mocked(https.request).mockImplementation(((_url: unknown, _options: unknown, callback: any) => {
    const outgoing = new EventEmitter() as any;
    outgoing.end = () => {
      if (kind === "deadline") return;
      const response = new PassThrough() as any;
      response.statusCode = 200; response.headers = { "content-type": "application/json", "content-length": "65537" };
      callback(response);
    };
    return outgoing;
  }) as any);
  const pending = x.runNativeLiveTransportExperimentV1(x.authorization);
  if (kind === "deadline") await vi.advanceTimersByTimeAsync(30000);
  const r = await pending;
  expect(r.failure_code).toBe(kind === "deadline" ? "DEADLINE_EXCEEDED" : "RESPONSE_TOO_LARGE");
  expect(https.request).toHaveBeenCalledTimes(1);
  await expect(x.runNativeLiveTransportExperimentV1(x.authorization)).rejects.toThrow("ATTEMPT_ALREADY_RESERVED");
});

// Exercise the actual terminal catch without console input, credentials or a journal.
async function terminalDiagnostic(args: string[], injected?: { error: unknown }) {
  const previousExitCode = process.exitCode;
  const previousArgv = process.argv;
  const errorOutput = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.argv = [process.execPath, "live.native.cli.ts", ...args];
  const credential = vi.fn(async () => { throw new Error(synthetic); });
  vi.doMock("../../../qualification/teacher-one-shot/live.credential", () => ({ readDedicatedTokenV1: credential }));
  if (injected) {
    vi.doMock("../../../qualification/teacher-one-shot/live.contracts", async importOriginal => {
      const actual: any = await importOriginal();
      return { ...actual, inspectLiveTransportAvailabilityV1: () => { throw injected.error; } };
    });
  }
  const { LiveAttemptJournalV1 } = await import("../../../qualification/teacher-one-shot/live.journal");
  const fixedLocation = vi.spyOn(LiveAttemptJournalV1, "fixedLocation");
  const reserve = vi.spyOn(LiveAttemptJournalV1.prototype, "reserve");
  try {
    await import("../../../qualification/teacher-one-shot/live.native.cli");
    await Promise.resolve();
    expect(process.exitCode).toBe(1);
    expect(credential).not.toHaveBeenCalled();
    expect(fixedLocation).not.toHaveBeenCalled(); expect(reserve).not.toHaveBeenCalled();
    expect(https.request).not.toHaveBeenCalled();
    expect(errorOutput.mock.calls).toHaveLength(2);
    expect(errorOutput.mock.calls[0]).toEqual(["ONE_SHOT_DENIED_OR_STOPPED_NO_RETRY"]);
    return errorOutput.mock.calls.map(call => call[0]);
  } finally { process.argv = previousArgv; process.exitCode = previousExitCode; }
}

it("CLI reports the closed production gate before credential or journal access", async () => {
  expect(readFileSync("qualification/teacher-one-shot/live.contracts.ts", "utf8")).toContain("LIVE_NETWORK_ENABLED_V1 = false as const");
  expect(await terminalDiagnostic(["--execute"])).toEqual([
    "ONE_SHOT_DENIED_OR_STOPPED_NO_RETRY", "ONE_SHOT_ERROR_CLASS=REAL_DISPATCH_DISABLED_STEP13J",
  ]);
});
it.each([{ args: [] }, { args: ["--invalid"] }, { args: ["--inspect", "extra"] }])("CLI classifies invalid argument set $args", async ({ args }) => {
  expect((await terminalDiagnostic(args))[1]).toBe("ONE_SHOT_ERROR_CLASS=ARGUMENTS_DENIED");
});
it.each([
  "REAL_DISPATCH_DISABLED_STEP13J", "LOCAL_INPUT_BOUNDS_INVALID", "INTERACTIVE_CONSOLE_REQUIRED",
  "HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED", "DEDICATED_TOKEN_EXPIRED_OR_REVERIFY_REQUIRED",
  "EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED", "ATTEMPT_ALREADY_RESERVED", "CREDENTIAL_ENTRY_CANCELLED_OR_INVALID",
  "MANIFEST_INVALID", "DEDICATED_AUTHORIZATION_REQUIRED", "INPUT_TOO_LARGE", "EXPOSURE_DENIED",
  "RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE", "DISPATCH_PERMISSION_DENIED", "TERMINAL_RECEIPT_UNAVAILABLE_NO_RETRY",
])("CLI exposes only the fixed typed classification %s", async code => {
  const { OneShotTransportErrorV1 } = await import("../../../qualification/teacher-one-shot/live.contracts");
  const error = new OneShotTransportErrorV1(code);
  error.message = synthetic; error.stack = synthetic;
  Object.defineProperty(error, "cause", { value: synthetic });
  // Native lazy stack descriptors must not prevent classification or expose stack content.
  expect(Object.getOwnPropertyDescriptor(error, "stack")?.get).toBe(Object.getOwnPropertyDescriptor(new Error(), "stack")?.get);
  expect((await terminalDiagnostic(["--inspect"], { error }))[1]).toBe(`ONE_SHOT_ERROR_CLASS=${code}`);
});
it.each([
  "ARGUMENTS_DENIED", "INTERACTIVE_CONSOLE_REQUIRED", "ONE_SHOT_PAYLOAD_REVIEW_REQUIRED",
  "NATURAL_CAPABILITIES_SOURCE_REVIEW_REQUIRED",
])("CLI classifies known legacy denial %s", async message => {
  expect((await terminalDiagnostic(["--inspect"], { error: new Error(message) }))[1]).toBe(`ONE_SHOT_ERROR_CLASS=${message}`);
  vi.restoreAllMocks(); vi.resetModules();
  const error = new Error(message);
  const getter = vi.fn(() => { throw new Error(synthetic); });
  Object.defineProperty(error, "stack", { get: getter });
  const output = await terminalDiagnostic(["--inspect"], { error });
  expect(output[1]).toBe("ONE_SHOT_ERROR_CLASS=UNCLASSIFIED_LOCAL_FAILURE");
  expect(output.join("\n")).not.toContain(synthetic);
  expect(getter).not.toHaveBeenCalled();
});
it.each(["ordinary", "unknown-code", "string", "object", "message-getter", "code-getter", "cause-getter", "proxy"])(
  "CLI redacts unknown or hostile %s errors", async kind => {
    const { OneShotTransportErrorV1 } = await import("../../../qualification/teacher-one-shot/live.contracts");
    const getter = vi.fn(() => { throw new Error(synthetic); });
    let error: unknown = new Error(synthetic);
    if (kind === "unknown-code") error = new OneShotTransportErrorV1("SYNTHETIC_OFFLINE_CREDENTIAL_123456");
    if (kind === "string") error = synthetic;
    if (kind === "object") error = { code: "REAL_DISPATCH_DISABLED_STEP13J", message: synthetic };
    if (kind === "message-getter") Object.defineProperty(error, "message", { get: getter });
    if (kind === "code-getter") Object.defineProperty(error, "code", { get: getter });
    if (kind === "cause-getter") {
      error = new OneShotTransportErrorV1("REAL_DISPATCH_DISABLED_STEP13J");
      Object.defineProperty(error, "cause", { get: getter });
    }
    if (kind === "proxy") error = new Proxy(new Error(synthetic), { get: getter, getPrototypeOf: getter, getOwnPropertyDescriptor: getter });
    const output = await terminalDiagnostic(["--inspect"], { error });
    expect(output[1]).toBe("ONE_SHOT_ERROR_CLASS=UNCLASSIFIED_LOCAL_FAILURE");
    expect(output.join("\n")).not.toContain(synthetic);
    expect(getter).not.toHaveBeenCalled();
  },
);
