import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildOneShotPublicPayloadV1, createOneShotDryRunConfigurationV1, FROZEN_PAYLOAD_DIGEST_V1, FUTURE_CREDENTIAL_CONTRACT_V1,
  inspectFrozenOneShotPayloadV1, inspectFutureLivePrerequisitesV1, ONE_SHOT_LIMITS_V1, runOneShotDryRunV1,
  type DryRunScenarioV1 } from "../../../qualification/teacher-one-shot/executor";
import { hybridDigestV1 } from "../cognition/hybrid.conversational.contracts.v1";
import { createNaturalCapabilitiesAnswerPlanV1 } from "../cognition/hybrid.natural.capabilities.v1";
import { inspectLiveTeacherAvailabilityV1 } from "../cognition/hybrid.conversational.teacher.v1";

let root: string;
const state = () => join(root, "experiment");
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "pa-step13h-"));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); }));
});
afterEach(() => {
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  // Only the absolute directory returned by mkdtemp is ever removed.
  if (!resolve(root).startsWith(resolve(tmpdir()) + "\\") && !resolve(root).startsWith(resolve(tmpdir()) + "/")) throw new Error("TEST_PATH_INVALID");
  rmSync(root, { recursive: true, force: true });
});

describe("STEP13H local one-shot DRY_RUN", () => {
  it("pins the public wire, version, digest, model and limits without private payload slots", () => {
    const payload = inspectFrozenOneShotPayloadV1();
    expect(payload).toEqual(buildOneShotPublicPayloadV1());
    expect(hybridDigestV1(payload)).toBe(FROZEN_PAYLOAD_DIGEST_V1);
    expect(Object.isFrozen(payload.wire)).toBe(true);
    expect(payload.scope).toBe("ANONYMOUS_VISION_GENERAL_CAPABILITIES_EN_V1");
    const body = JSON.parse(payload.wire.body);
    expect(body).toMatchObject({ stream: false, max_tokens: 512, temperature: 0 });
    expect(Object.keys(body).sort()).toEqual(["max_tokens", "prompt", "response_format", "stream", "temperature"]);
    expect(Buffer.byteLength(payload.wire.body)).toBeLessThanOrEqual(16384);
    for (const element of createNaturalCapabilitiesAnswerPlanV1().mandatory_elements) expect(body.prompt).toContain(element.approved_text);
    expect(payload.wire.body).not.toMatch(/current_user_message|raw_user_message|history|organization_id|tenant_id|erp_records|mes_records|I-ORS|Lightning|STUDENT_BEARER_TOKEN|OPENROUTER_API_KEY|oauth_token|Authorization/);
    expect(ONE_SHOT_LIMITS_V1).toMatchObject({ max_attempts: 1, max_in_flight: 1, max_retries: 0, timeout_ms: 30000, max_response_bytes: 65536 });
  });

  it.each(["payload", "model", "limits", "credential_contract", "extra", "live", "missing", "unknown-scenario"])("denies altered or missing %s before durable admission", async kind => {
    const c: any = JSON.parse(JSON.stringify(createOneShotDryRunConfigurationV1()));
    if (kind === "payload") c.payload.wire.body += " ";
    if (kind === "model") c.payload.model = "other-model";
    if (kind === "limits") c.limits.max_retries = 1;
    if (kind === "credential_contract") delete c.credential_contract;
    if (kind === "extra") c.authorization = null;
    if (kind === "live") c.mode = "LIVE";
    if (kind === "missing") delete c.payload;
    await expect(runOneShotDryRunV1(state(), c, kind === "unknown-scenario" ? "OTHER" as any : "VALID")).rejects.toThrow();
    expect(existsSync(state())).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("denies missing future secret and never enables live execution even with all prerequisite assertions", () => {
    const absent = inspectFutureLivePrerequisitesV1(undefined);
    expect(absent.missing).toContain("dedicated_token_available");
    expect(absent.live_execution_enabled).toBe(false);
    const assertions = Object.fromEntries(absent.missing.map(k => [k, true]));
    expect(inspectFutureLivePrerequisitesV1(assertions)).toMatchObject({ missing: [], live_execution_enabled: false, blockers: ["STEP13H_DRY_RUN_ONLY"] });
    expect(FUTURE_CREDENTIAL_CONTRACT_V1).toMatchObject({ read_in_dry_run: false, inherited_credentials_allowed: false, cli_value_allowed: false });
  });

  it("persists one attempt, existing registry evidence and separate verification with no publication/training", async () => {
    const report = await runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1());
    expect(report).toMatchObject({ state: "STOPPED", logical_attempts: 1, mock_requests: 1, real_requests: 0, real_neurons: 0,
      lifecycle: "SHADOW", envelope_valid: true, structural_conformity: true, semantic_fidelity: "PASS",
      linguistic_quality: "INDEPENDENT_REVIEW_REQUIRED", public_response_unchanged: true, automatic_training: false,
      usage: { provenance: "SYNTHETIC_FIXTURE_ONLY", known: true, fixture: { neurons: 1 } } });
    expect(report.observations).toHaveLength(1);
    expect(report.observations[0].learning_state).toBe("PENDING_ELIGIBILITY");
    expect(JSON.parse(readFileSync(join(state(), "result.json"), "utf8"))).toEqual(report);
    expect(JSON.parse(readFileSync(join(state(), "claim.json"), "utf8"))).toMatchObject({ logical_attempts: 1, state: "CLAIMED_STOP_AFTER_ANY_OUTCOME" });
    expect(inspectLiveTeacherAvailabilityV1().state).toBe("TEACHER_DISABLED");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("denies a second invocation and concurrent admission using the same persistent experiment", async () => {
    const outcomes = await Promise.allSettled([runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1()), runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1())]);
    expect(outcomes.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(r => r.status === "rejected")).toHaveLength(1);
    await expect(runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1())).rejects.toThrow(/CLAIMED/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each(["MALFORMED", "FREE_PROSE", "UNKNOWN_USAGE", "PROVIDER_ERROR"] as DryRunScenarioV1[])("stops after %s without retry/fallback or JSON-only semantic PASS", async scenario => {
    const r = await runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1(), scenario);
    expect(r.mock_requests).toBe(1);
    expect(r.observations[0].teacher_attempts).toHaveLength(1);
    expect(r.semantic_fidelity).not.toBe("PASS");
    if (scenario === "FREE_PROSE") expect(r).toMatchObject({ envelope_valid: true, structural_conformity: true, semantic_fidelity: "INCONCLUSIVE" });
    if (scenario === "MALFORMED") expect(r).toMatchObject({ envelope_valid: false, structural_conformity: false });
    if (scenario === "UNKNOWN_USAGE") expect(r).toMatchObject({ envelope_valid: true, result_uncertain: true, usage: { known: false } });
    expect(r.public_response_unchanged).toBe(true);
    expect(r.real_neurons).toBe(0);
    await expect(runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1())).rejects.toThrow(/CLAIMED/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("times out at 30 seconds, marks uncertainty and denies restart", async () => {
    vi.useFakeTimers();
    const pending = runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1(), "TIMEOUT");
    await vi.advanceTimersByTimeAsync(30000);
    const r = await pending;
    expect(r).toMatchObject({ outcome: "TIMEOUT", result_uncertain: true, mock_requests: 1, real_requests: 0 });
    await expect(runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1())).rejects.toThrow(/CLAIMED/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("survives an actual process exit immediately after durable admission with no second attempt on restart", () => {
    const preload = join(root, "crash.cjs");
    writeFileSync(preload, "const fs=require('node:fs');const original=fs.fsyncSync;fs.fsyncSync=(fd)=>{original(fd);process.exit(77)};globalThis.fetch=()=>{process.exit(88)};\n");
    const cli = [resolve("node_modules/vite-node/vite-node.mjs"), "--script", resolve("qualification/teacher-one-shot/cli.ts"), "--dry-run", "--state-dir", state()];
    const crashed = spawnSync(process.execPath, ["--require", preload, ...cli], { encoding: "utf8", timeout: 25000 });
    expect(crashed.status, crashed.stderr).toBe(77);
    expect(existsSync(join(state(), "claim.json"))).toBe(true);
    expect(existsSync(join(state(), "result.json"))).toBe(false);
    const restarted = spawnSync(process.execPath, cli, { encoding: "utf8", timeout: 25000 });
    expect(restarted.status).toBe(1);
    expect(restarted.stderr).toContain("ONE_SHOT_DENIED_OR_STOPPED_NO_RETRY");
    expect(existsSync(join(state(), "result.json"))).toBe(false);
  }, 60000);

  it("rejects malformed existing state without deleting or repairing it", async () => {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(state()); writeFileSync(join(state(), "claim.json"), "partial");
    await expect(runOneShotDryRunV1(state(), createOneShotDryRunConfigurationV1())).rejects.toThrow(/CLAIMED/);
    expect(readFileSync(join(state(), "claim.json"), "utf8")).toBe("partial");
    expect(existsSync(join(state(), "result.json"))).toBe(false);
  });

  it("CLI rejects live, credential arguments and arbitrary prompts before creating state", () => {
    const cli = resolve("qualification/teacher-one-shot/cli.ts");
    for (const args of [["--live", "--state-dir", state()], ["--dry-run", "--state-dir", state(), "--token"],
      ["--dry-run", "--state-dir", state(), "--prompt", "arbitrary"]]) {
      const r = spawnSync(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script", cli, ...args], { encoding: "utf8", timeout: 25000 });
      expect(r.status).toBe(1); expect(existsSync(state())).toBe(false);
    }
    const sources = [cli, resolve("qualification/teacher-one-shot/executor.ts")].map(p => readFileSync(p, "utf8")).join("\n");
    expect(sources).not.toMatch(/process\.env|\bfetch\s*\(|node:https|node:http|dotenv|\.dev\.vars|\.dev.vars/);
  }, 30000);
});
