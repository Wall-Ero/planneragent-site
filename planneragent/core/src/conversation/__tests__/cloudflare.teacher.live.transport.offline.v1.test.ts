import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import https from "node:https";
import { createInjectedExperimentManifestV1, FIXED_LIVE_STATE_DIRECTORY_V1, inspectLiveTransportAvailabilityV1,
  OFFLINE_AUTHORIZATION_V1, TEACHER_ACCOUNT_ID_V1, TEACHER_ENDPOINT_V1 } from "../../../qualification/teacher-one-shot/live.contracts";
import { HardDisabledHttpsClientV1, InjectedHttpFixtureClientV1, type InjectedHttpFixtureV1 } from "../../../qualification/teacher-one-shot/live.http";
import { LiveAttemptJournalV1 } from "../../../qualification/teacher-one-shot/live.journal";
import { buildInjectedCloudflareRequestV1, runInjectedLiveTransportExperimentV1 } from "../../../qualification/teacher-one-shot/live.transport";
import { createValidInjectedCompletionV1, createValidInjectedHttpFixtureV1 } from "../../../qualification/teacher-one-shot/live.fixtures";
import { FROZEN_PAYLOAD_DIGEST_V1, inspectFrozenOneShotPayloadV1 } from "../../../qualification/teacher-one-shot/executor";

let root: string, nativeCalls: ReturnType<typeof vi.spyOn>;
const directory = () => join(root, "fixture-state");
const journal = () => LiveAttemptJournalV1.isolatedOfflineFixture(directory());
const manifest = createInjectedExperimentManifestV1;
function fixtureWith(mutate: (value: any) => void): InjectedHttpFixtureV1 {
  const value = createValidInjectedCompletionV1(); mutate(value);
  return { status: 200, headers: { "content-type": "application/json" }, chunks: [JSON.stringify(value)] };
}
function run(fixture = createValidInjectedHttpFixtureV1()) {
  const client = new InjectedHttpFixtureClientV1(fixture), store = journal();
  return { client, store, promise: runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, client, store) };
}
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "pa-step13j-"));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); }));
  nativeCalls = vi.spyOn(https, "request").mockImplementation(() => { throw new Error("SOCKET_FORBIDDEN"); });
});
afterEach(() => {
  expect(globalThis.fetch).not.toHaveBeenCalled(); expect(nativeCalls).not.toHaveBeenCalled();
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  const path = resolve(root), parent = resolve(tmpdir());
  if (!path.startsWith(parent + "\\") && !path.startsWith(parent + "/")) throw new Error("TEST_PATH_INVALID");
  rmSync(root, { recursive: true, force: true });
});

describe("STEP13J isolated HTTPS semantics with injected responses only", () => {
  it("builds exactly one account/model POST with frozen bytes and redacted authorization inspection", async () => {
    const x = run(); const r = await x.promise, observed = x.client.inspect();
    expect(observed.calls).toBe(1); expect(observed.closed).toBe(true);
    expect(observed.request).toMatchObject({ method: "POST", url: TEACHER_ENDPOINT_V1, body: inspectFrozenOneShotPayloadV1().wire.body,
      authorization_nonempty: true, headers: { authorization: "Bearer [REDACTED]", "content-type": "application/json", "content-length": "2094", "accept-encoding": "identity" } });
    expect(JSON.parse(observed.request!.body)).toMatchObject({ stream: false, max_tokens: 512, temperature: 0 });
    expect(r).toMatchObject({ mode: "INJECTED_HTTP_FIXTURE_ONLY", account_id: TEACHER_ACCOUNT_ID_V1, payload_digest: FROZEN_PAYLOAD_DIGEST_V1,
      outcome: "COMPLETED", dispatch: "PERMISSION_CONSUMED", lifecycle: "SHADOW", injected_http_requests: 1, actual_network_requests: 0,
      envelope_valid: true, structural_conformity: true, semantic_fidelity: "PASS", linguistic_quality: "INDEPENDENT_REVIEW_REQUIRED",
      provider_tokens: { state: "KNOWN", input_tokens: 100, output_tokens: 80, total_tokens: 180 }, neurons: "UNKNOWN",
      public_response_unchanged: true, automatic_training: false });
    const reservation = JSON.parse(readFileSync(join(directory(), "reserved.json"), "utf8"));
    expect(reservation).toMatchObject({ experiment_id: r.experiment_id, account_id: r.account_id, model: r.model,
      payload_digest: r.payload_digest, authorization_evidence_ref: r.authorization_evidence_ref, attempt_state: "RESERVED_NO_REPLAY" });
    expect(JSON.parse(readFileSync(join(directory(), "result.json"), "utf8"))).toEqual(r);
    expect(x.store.inspect()).toMatchObject({ state: "STOPPED", automatic_retry_allowed: false });
  });

  it.each(["account_id", "model", "payload_digest", "state_location", "authorization_evidence_ref", "experiment_id", "mode", "limits", "extra"])("rejects invalid %s before reservation or HTTP", async field => {
    const m: any = JSON.parse(JSON.stringify(manifest()));
    if (field === "limits") m.limits.timeout_ms = 30001;
    else if (field === "extra") m.extra = true;
    else m[field] = "INVALID";
    const client = new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1());
    await expect(runInjectedLiveTransportExperimentV1(m, OFFLINE_AUTHORIZATION_V1, client, journal())).rejects.toThrow("MANIFEST_INVALID");
    expect(client.inspect().calls).toBe(0); expect(existsSync(directory())).toBe(false);
  });

  it("denies missing authorization, real clients and arbitrary callback clients before any state write", async () => {
    const fixture = new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1());
    await expect(runInjectedLiveTransportExperimentV1(manifest(), undefined as any, fixture, journal())).rejects.toThrow("DEDICATED_AUTHORIZATION_REQUIRED");
    await expect(runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, new HardDisabledHttpsClientV1(), journal())).rejects.toThrow("REAL_DISPATCH_DISABLED");
    const post = vi.fn();
    await expect(runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, { post }, journal())).rejects.toThrow("REAL_DISPATCH_DISABLED");
    expect(post).not.toHaveBeenCalled(); expect(existsSync(directory())).toBe(false);
  });

  it("keeps native HTTPS unconditionally disabled even when directly invoked without valid inputs", async () => {
    await expect(new HardDisabledHttpsClientV1().post(undefined as any, undefined as any)).rejects.toThrow("REAL_DISPATCH_DISABLED_STEP13J");
    expect(inspectLiveTransportAvailabilityV1()).toMatchObject({ real_dispatch_enabled: false, teacher: "DISABLED", lifecycle: "SHADOW" });
    const existed = existsSync(FIXED_LIVE_STATE_DIRECTORY_V1);
    await expect(runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1,
      new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1()), LiveAttemptJournalV1.fixedLocation())).rejects.toThrow("REAL_DISPATCH_DISABLED");
    expect(existsSync(FIXED_LIVE_STATE_DIRECTORY_V1)).toBe(existed);
  });

  it.each([301, 302, 303, 307, 308])("consumes and rejects redirect %s without a second request", async status => {
    const x = run({ ...createValidInjectedHttpFixtureV1(), status, headers: { location: "https://example.invalid/never-follow" } });
    expect(await x.promise).toMatchObject({ outcome: "REJECTED", failure_code: "REDIRECT_DENIED", neurons: "UNKNOWN" });
    expect(x.client.inspect()).toMatchObject({ calls: 1, chunks_read: 0, closed: true });
  });
  it.each(["https://example.invalid", TEACHER_ENDPOINT_V1 + "?other=1"])("rejects changed response origin or path", async url => {
    const r = await run({ ...createValidInjectedHttpFixtureV1(), url }).promise;
    expect(r.failure_code).toBe("RESPONSE_ORIGIN_OR_PATH_INVALID");
  });
  it.each(["text/html", "text/event-stream", "text/plain", "application/json; charset=latin1"])("rejects unexpected content type %s", async type => {
    const x = run({ ...createValidInjectedHttpFixtureV1(), headers: { "content-type": type } });
    expect((await x.promise).failure_code).toBe("CONTENT_TYPE_DENIED"); expect(x.client.inspect().chunks_read).toBe(0);
  });
  it.each(["gzip", "br", "deflate"])("rejects unsupported encoding %s before body reading", async encoding => {
    const x = run({ ...createValidInjectedHttpFixtureV1(), headers: { "content-type": "application/json", "content-encoding": encoding } });
    expect((await x.promise).failure_code).toBe("CONTENT_ENCODING_DENIED"); expect(x.client.inspect().chunks_read).toBe(0);
  });
  it("enforces 64 KiB incrementally, stops reading, and rejects oversized Content-Length early", async () => {
    const x = run({ status: 200, headers: { "content-type": "application/json" }, chunks: [" ".repeat(65536), "x", "NOT_READ"] });
    expect((await x.promise).failure_code).toBe("RESPONSE_TOO_LARGE"); expect(x.client.inspect().chunks_read).toBe(2);
    const c = new InjectedHttpFixtureClientV1({ ...createValidInjectedHttpFixtureV1(), headers: { "content-type": "application/json", "content-length": "65537" } });
    const r = await runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, c, LiveAttemptJournalV1.isolatedOfflineFixture(join(root, "other-fixture")));
    expect(r.failure_code).toBe("RESPONSE_TOO_LARGE"); expect(c.inspect().chunks_read).toBe(0);
  });
  it.each(["mismatch", "duplicate", "array"])("rejects anomalous %s response headers", async scenario => {
    const headers: Record<string, string | string[]> = { "content-type": "application/json" };
    if (scenario === "mismatch") headers["content-length"] = "1";
    if (scenario === "duplicate") headers["Content-Type"] = "application/json";
    if (scenario === "array") headers["content-type"] = ["application/json", "text/html"];
    expect((await run({ ...createValidInjectedHttpFixtureV1(), headers }).promise).outcome).toBe("REJECTED");
  });
  it.each(["malformed", "utf8", "raw-completion", "legacy-response", "extra-wrapper"])("rejects %s without permissive response fallback", async scenario => {
    let f: InjectedHttpFixtureV1 = { status: 200, headers: { "content-type": "application/json" }, chunks: ["not-json"] };
    if (scenario === "utf8") f = { ...f, byte_chunks: [[255]] };
    if (scenario === "raw-completion") f = { ...f, chunks: [JSON.stringify(createValidInjectedCompletionV1().result)] };
    if (scenario === "legacy-response") f = { ...f, chunks: [JSON.stringify({ success: true, errors: [], result: { response: "legacy" } })] };
    if (scenario === "extra-wrapper") f = fixtureWith(x => { x.unexpected = true; });
    const r = await run(f).promise;
    expect(r.outcome).toBe("REJECTED"); expect(r.semantic_fidelity).toBe("INCONCLUSIVE"); expect(r.envelope_valid).toBe(false);
  });
  it.each(["missing-choices", "multiple", "bad-index", "role", "tools", "reasoning-type", "truncated", "bad-stop", "id", "created", "model", "envelope"])("rejects invalid completion %s", async scenario => {
    const f = fixtureWith(x => {
      const c = x.result.choices[0];
      if (scenario === "missing-choices") delete x.result.choices;
      if (scenario === "multiple") x.result.choices.push(c);
      if (scenario === "bad-index") c.index = 1;
      if (scenario === "role") c.message.role = "user";
      if (scenario === "tools") c.message.tool_calls = [{ type: "function" }];
      if (scenario === "reasoning-type") c.message.reasoning_content = {};
      if (scenario === "truncated") c.finish_reason = "length";
      if (scenario === "bad-stop") c.stop_reason = "length";
      if (scenario === "id") delete x.result.id;
      if (scenario === "created") x.result.created = -1;
      if (scenario === "model") x.result.model = "other-model";
      if (scenario === "envelope") c.message.content = JSON.stringify({ version: 1, answer: "Valid prose", grants_authority: true });
    });
    const r = await run(f).promise;
    expect(r.outcome).toBe("REJECTED"); expect(r.structural_conformity).toBe(false); expect(r.semantic_fidelity).toBe("INCONCLUSIVE");
  });
  it("excludes reasoning and protected headers from receipt and persisted evidence", async () => {
    const x = run({ ...fixtureWith(v => { v.result.choices[0].message.reasoning_content = "PRIVATE_REASONING_CANARY"; }),
      headers: { "content-type": "application/json", "set-cookie": "PROTECTED_HEADER_CANARY" } });
    expect((await x.promise).semantic_fidelity).toBe("PASS");
    const persisted = ["reserved.json", "dispatch.json", "result.json"].map(f => readFileSync(join(directory(), f), "utf8")).join("");
    expect(persisted).not.toMatch(/PRIVATE_REASONING_CANARY|PROTECTED_HEADER_CANARY|reasoning_content|set-cookie|authorization_nonempty|offline_neurons/);
    expect(persisted).toContain('"reasoning_persisted": false');
  });
  it("keeps free-form valid JSON INCONCLUSIVE with no public replacement or training", async () => {
    const f = { status: 200, headers: { "content-type": "application/json" }, chunks: [JSON.stringify(createValidInjectedCompletionV1("PlannerAgent is an excellent planning assistant."))] };
    expect(await run(f).promise).toMatchObject({ envelope_valid: true, structural_conformity: true, semantic_fidelity: "INCONCLUSIVE",
      public_response_unchanged: true, automatic_training: false, lifecycle: "SHADOW" });
  });
  it.each(["missing", "partial", "inconsistent", "negative", "over-limit"])("records %s usage without manufacturing Neurons or successful admission", async scenario => {
    const f = fixtureWith(v => {
      if (scenario === "missing") delete v.result.usage;
      if (scenario === "partial") delete v.result.usage.total_tokens;
      if (scenario === "inconsistent") v.result.usage.total_tokens = 1;
      if (scenario === "negative") v.result.usage.prompt_tokens = -1;
      if (scenario === "over-limit") v.result.usage = { prompt_tokens: 100, completion_tokens: 513, total_tokens: 613 };
    });
    const r = await run(f).promise;
    expect(r).toMatchObject({ outcome: "REJECTED", neurons: "UNKNOWN", envelope_valid: true, semantic_fidelity: "PASS" });
    expect(r.provider_tokens.state).toBe(["missing", "partial"].includes(scenario) ? "UNKNOWN" : "INCONSISTENT");
    expect(r.failure_code).toMatch(/^USAGE_/);
  });
  it.each([[429, 3036, "CF_DAILY_QUOTA_EXHAUSTED"], [403, 5035, "CF_PAID_PLAN_REQUIRED"], [429, 3040, "CF_CAPACITY_UNAVAILABLE"],
    [408, 3007, "CF_PROVIDER_TIMEOUT"], [500, 9999, "CF_PROVIDER_ERROR"]] as const)("stops on Cloudflare %s/%s with no retry", async (status, code, expected) => {
    const x = run({ status, headers: { "content-type": "application/json" }, chunks: [JSON.stringify({ success: false, errors: [{ code, message: "UNTRUSTED_PROVIDER_MESSAGE" }], result: null })] });
    const r = await x.promise;
    expect(r).toMatchObject({ outcome: "PROVIDER_ERROR", failure_code: expected, provider_error_codes: [code], neurons: "UNKNOWN" });
    expect(x.client.inspect().calls).toBe(1); expect(JSON.stringify(r)).not.toContain("UNTRUSTED_PROVIDER_MESSAGE");
    await expect(runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, x.client, journal())).rejects.toThrow(/RESERVATION/);
  });
  it.each(["connection_failure", "body_failure"] as const)("redacts %s and permanently consumes an ambiguous dispatch", async failure => {
    const x = run({ ...createValidInjectedHttpFixtureV1(), [failure]: true });
    const r = await x.promise;
    expect(r).toMatchObject({ outcome: "UNCERTAIN", failure_code: "CONNECTION_OR_BODY_FAILED", neurons: "UNKNOWN" });
    expect(JSON.stringify(r)).not.toContain("INJECTED_UNTRUSTED"); expect(x.store.inspect().automatic_retry_allowed).toBe(false);
  });
  it("uses one deadline across headers and body, aborts after dispatch, and never resumes", async () => {
    vi.useFakeTimers();
    const x = run({ ...createValidInjectedHttpFixtureV1(), header_delay_ms: 20000, chunk_delay_ms: 20000 });
    await vi.advanceTimersByTimeAsync(29999);
    expect(x.client.inspect()).toMatchObject({ calls: 1, chunks_read: 0 });
    await vi.advanceTimersByTimeAsync(1);
    const r = await x.promise;
    expect(r).toMatchObject({ outcome: "UNCERTAIN", failure_code: "DEADLINE_EXCEEDED", dispatch: "PERMISSION_CONSUMED" });
    expect(x.client.inspect().closed).toBe(true); expect(vi.getTimerCount()).toBe(0);
    await expect(runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, x.client, journal())).rejects.toThrow(/RESERVATION/);
  });
});

describe("STEP13J persistent live journal and hard-disabled entrypoints", () => {
  it("does not acquire permission before reservation or twice after reservation", () => {
    const j = journal(); expect(() => j.acquireDispatchPermission()).toThrow("DISPATCH_PERMISSION_DENIED");
    j.reserve(manifest()); j.acquireDispatchPermission();
    expect(() => j.acquireDispatchPermission()).toThrow("DISPATCH_PERMISSION_DENIED");
    expect(j.inspect()).toMatchObject({ state: "CONSUMED_OUTCOME_UNKNOWN", automatic_retry_allowed: false });
  });
  it("has both synced identity markers before invoking the injected client", async () => {
    const client = new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1()), j = journal();
    const original = client.post.bind(client);
    vi.spyOn(client, "post").mockImplementation((input, signal) => {
      expect(j.inspect()).toMatchObject({ reserved: true, dispatch: true, result: false, state: "CONSUMED_OUTCOME_UNKNOWN" });
      const record = JSON.parse(readFileSync(join(directory(), "reserved.json"), "utf8"));
      expect(record).toMatchObject({ account_id: TEACHER_ACCOUNT_ID_V1, payload_digest: FROZEN_PAYLOAD_DIGEST_V1 });
      return original(input, signal);
    });
    expect((await runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, client, j)).outcome).toBe("COMPLETED");
  });
  it("rejects invalid status metadata without persisting untrusted values", async () => {
    const x = run({ ...createValidInjectedHttpFixtureV1(), status: "UNTRUSTED_STATUS_CANARY" as any });
    const receipt = await x.promise;
    expect(receipt.failure_code).toBe("RESPONSE_STATUS_INVALID");
    expect(receipt.provider_status).toBeUndefined();
    expect(readFileSync(join(directory(), "result.json"), "utf8")).not.toContain("UNTRUSTED_STATUS_CANARY");
  });
  it.each(["existing-dispatch", "corrupt-reservation", "changed-account"])("denies dispatch when %s", scenario => {
    const j = journal(); j.reserve(manifest());
    if (scenario === "existing-dispatch") writeFileSync(join(directory(), "dispatch.json"), "partial");
    if (scenario === "corrupt-reservation") writeFileSync(join(directory(), "reserved.json"), "partial");
    if (scenario === "changed-account") { const p = join(directory(), "reserved.json"), v = JSON.parse(readFileSync(p, "utf8")); v.account_id = "other"; writeFileSync(p, JSON.stringify(v)); }
    expect(() => j.acquireDispatchPermission()).toThrow("DISPATCH_PERMISSION_DENIED");
    expect(() => journal().reserve(manifest())).toThrow(/RESERVATION_DENIED/);
  });
  it("allows only one concurrent reservation/dispatch, denies duplicate execution and never resets state", async () => {
    const clients = [new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1()), new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1())];
    const outcomes = await Promise.allSettled(clients.map(client => runInjectedLiveTransportExperimentV1(manifest(), OFFLINE_AUTHORIZATION_V1, client, journal())));
    expect(outcomes.filter(x => x.status === "fulfilled")).toHaveLength(1); expect(clients.reduce((n, c) => n + c.inspect().calls, 0)).toBe(1);
    expect(() => journal().reserve(manifest())).toThrow(/RESERVATION_DENIED/);
  });
  it("fails closed on inability to write the terminal receipt without reopening dispatch", async () => {
    vi.useFakeTimers();
    const x = run({ ...createValidInjectedHttpFixtureV1(), chunk_delay_ms: 10 });
    const result = x.promise.catch(error => error);
    await vi.advanceTimersByTimeAsync(1); writeFileSync(join(directory(), "result.json"), "existing");
    await vi.advanceTimersByTimeAsync(9);
    expect((await result).message).toBe("TERMINAL_RECEIPT_UNAVAILABLE_NO_RETRY");
    expect(readFileSync(join(directory(), "result.json"), "utf8")).toBe("existing");
    expect(() => journal().reserve(manifest())).toThrow(/RESERVATION_DENIED/);
  });

  it.each([1, 2, 3])("survives actual process exit after synced transition %s; restart cannot resend", phase => {
    const preload = join(root, "fault.cjs"), entry = join(root, "child.ts");
    writeFileSync(preload, `const fs=require('node:fs');const original=fs.fsyncSync;let count=0;fs.fsyncSync=fd=>{original(fd);if(++count===${phase})process.exit(77)};require('node:https').request=()=>process.exit(88);globalThis.fetch=()=>process.exit(88);`);
    const base = resolve("qualification/teacher-one-shot").replace(/\\/g, "/");
    writeFileSync(entry, `import {createInjectedExperimentManifestV1,OFFLINE_AUTHORIZATION_V1} from ${JSON.stringify(base + "/live.contracts.ts")};
import {LiveAttemptJournalV1} from ${JSON.stringify(base + "/live.journal.ts")};
import {InjectedHttpFixtureClientV1} from ${JSON.stringify(base + "/live.http.ts")};
import {createValidInjectedHttpFixtureV1} from ${JSON.stringify(base + "/live.fixtures.ts")};
import {runInjectedLiveTransportExperimentV1} from ${JSON.stringify(base + "/live.transport.ts")};
runInjectedLiveTransportExperimentV1(createInjectedExperimentManifestV1(),OFFLINE_AUTHORIZATION_V1,new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1()),LiveAttemptJournalV1.isolatedOfflineFixture(process.argv[2])).catch(()=>{console.error('RECOVERY_DENIED');process.exitCode=1});`);
    const args = [resolve("node_modules/vite-node/vite-node.mjs"), "--script", entry, directory()];
    const crashed = spawnSync(process.execPath, ["--require", preload, ...args], { encoding: "utf8", timeout: 25000 });
    expect(crashed.status, crashed.stderr).toBe(77);
    expect(existsSync(join(directory(), "reserved.json"))).toBe(true);
    expect(existsSync(join(directory(), "dispatch.json"))).toBe(phase >= 2);
    expect(existsSync(join(directory(), "result.json"))).toBe(phase >= 3);
    const restarted = spawnSync(process.execPath, args, { encoding: "utf8", timeout: 25000 });
    expect(restarted.status, restarted.stderr).toBe(1); expect(restarted.stderr).toContain("RECOVERY_DENIED");
    expect(journal().inspect().automatic_retry_allowed).toBe(false);
  }, 60000);

  it("has no recovery executor before reservation or after process reconstruction", () => {
    expect(journal().inspect()).toMatchObject({ state: "UNCLAIMED", automatic_retry_allowed: false });
    const j = journal(); j.reserve(manifest());
    const recovered = journal();
    expect(recovered.inspect()).toMatchObject({ state: "RESERVED_RECOVERY_DENIED", automatic_retry_allowed: false });
    expect(() => recovered.acquireDispatchPermission()).toThrow("DISPATCH_PERMISSION_DENIED");
  });
  it("CLI rejects live activation and arbitrary state/credential arguments without touching real state", () => {
    const before = existsSync(FIXED_LIVE_STATE_DIRECTORY_V1);
    for (const args of [["--live"], ["--offline-demo", "--state-dir", directory()], ["--offline-demo", "--token"]]) {
      const r = spawnSync(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script", resolve("qualification/teacher-one-shot/live.offline.cli.ts"), ...args], { encoding: "utf8", timeout: 25000 });
      expect(r.status).toBe(1); expect(r.stderr).toContain("ONE_SHOT_LIVE_TRANSPORT_DISABLED_OR_ATTEMPT_CONSUMED");
    }
    expect(existsSync(directory())).toBe(false); expect(existsSync(FIXED_LIVE_STATE_DIRECTORY_V1)).toBe(before);
    const sources = ["live.offline.cli.ts", "live.contracts.ts", "live.http.ts", "live.transport.ts", "live.journal.ts"].map(f => readFileSync(resolve("qualification/teacher-one-shot", f), "utf8")).join("\n");
    expect(sources).not.toMatch(/process\.env|dotenv|\.dev\.vars|oauth_token|STUDENT_BEARER_TOKEN|OPENROUTER_API_KEY/);
    expect(buildInjectedCloudflareRequestV1(manifest(), OFFLINE_AUTHORIZATION_V1).url).toBe(TEACHER_ENDPOINT_V1);
  }, 60000);
});
