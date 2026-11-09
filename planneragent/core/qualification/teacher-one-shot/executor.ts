import { existsSync, lstatSync, mkdirSync, readFileSync } from "node:fs";
import { writeExclusiveSyncedV1 as writeExclusiveSynced } from "./local-state";
import { isAbsolute, join, resolve } from "node:path";
import { parseRealizationEnvelopeV1 } from "../../src/conversation/cognitive.realization.envelope.v1";
import { CloudflareTeacherRestOfflineAdapterV1, MockCloudflareTeacherRestTransportV1, prepareCloudflareTeacherRealizationWireV1,
  type OfflineCloudflareRestFixtureV1 } from "../../src/conversation/cognition/cloudflare.teacher.rest.offline.v1";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { HYBRID_TEACHER_MODEL_V1, OfflineMockTeacherQuotaV1, type OfflineTeacherConfigurationV1 } from "../../src/conversation/cognition/hybrid.conversational.teacher.v1";
import { runOfflineHybridSupervisionV1 } from "../../src/conversation/cognition/hybrid.conversational.supervision.v1";
import { authorizeNaturalCapabilitiesTeacherExposureV1, createNaturalCapabilitiesAnswerPlanV1, NATURAL_CAPABILITIES_SCOPE_V1,
  prepareNaturalCapabilitiesRealizationV1, renderNaturalCapabilitiesV1, verifyNaturalCapabilitiesBindingV1 } from "../../src/conversation/cognition/hybrid.natural.capabilities.v1";
import { OfflineHybridEvidenceRegistryV1 } from "../../src/conversation/learning/hybrid.conversational.evidence.v1";

export const ONE_SHOT_LIMITS_V1 = Object.freeze({ max_input_bytes: 16384, max_output_tokens: 512,
  timeout_ms: 30000, max_response_bytes: 65536, max_retries: 0, max_in_flight: 1, max_attempts: 1 });
export const FUTURE_CREDENTIAL_CONTRACT_V1 = Object.freeze({ version: 1, dedicated: true,
  source: "DEDICATED_WORKERS_AI_TOKEN", scope: "SINGLE_OPERATOR_VERIFIED_ACCOUNT", permissions: "WORKERS_AI_ONLY",
  permissions_documentation: "https://developers.cloudflare.com/workers-ai/get-started/rest-api/",
  read_in_dry_run: false, cli_value_allowed: false, inherited_credentials_allowed: false });
export const FROZEN_PAYLOAD_DIGEST_V1 = "sha256:74dce8541223ec4723953eeeb990970be3c4c6b70e372d4e3436c61ff1ac2764";
export type DryRunScenarioV1 = "VALID" | "MALFORMED" | "FREE_PROSE" | "TIMEOUT" | "UNKNOWN_USAGE" | "PROVIDER_ERROR";
const scenarios: readonly DryRunScenarioV1[] = ["VALID", "MALFORMED", "FREE_PROSE", "TIMEOUT", "UNKNOWN_USAGE", "PROVIDER_ERROR"];

// Non-secret readiness assertions ONLY. Even all true never enable a live path.
export function inspectFutureLivePrerequisitesV1(value: unknown) {
  const x = value as Record<string, unknown> | undefined;
  const keys = ["dedicated_token_available", "account_scope_verified", "workers_ai_permissions_verified", "free_plan_manually_verified",
    "remaining_quota_manually_verified", "operator_authorized", "input_token_bound_qualified"];
  const missing = keys.filter(k => x?.[k] !== true);
  return Object.freeze({ live_execution_enabled: false, missing: Object.freeze(missing),
    blockers: Object.freeze(["STEP13H_DRY_RUN_ONLY", ...missing]) });
}

export function buildOneShotPublicPayloadV1() {
  const wire = prepareCloudflareTeacherRealizationWireV1(ONE_SHOT_LIMITS_V1.max_output_tokens);
  return hybridSnapshotV1({ version: 1, scope: NATURAL_CAPABILITIES_SCOPE_V1, model: HYBRID_TEACHER_MODEL_V1,
    surface_digest: hybridDigestV1(prepareNaturalCapabilitiesRealizationV1()), wire });
}
export function inspectFrozenOneShotPayloadV1() {
  const value: unknown = JSON.parse(readFileSync(new URL("./payload.v1.json", import.meta.url), "utf8"));
  if (hybridDigestV1(value) !== FROZEN_PAYLOAD_DIGEST_V1 || hybridCanonicalV1(value) !== hybridCanonicalV1(buildOneShotPublicPayloadV1())) {
    throw new Error("ONE_SHOT_PAYLOAD_REVIEW_REQUIRED");
  }
  return hybridSnapshotV1(value as ReturnType<typeof buildOneShotPublicPayloadV1>);
}
export function createOneShotDryRunConfigurationV1() {
  return hybridSnapshotV1({ version: 1, mode: "DRY_RUN", lifecycle: "SHADOW", limits: ONE_SHOT_LIMITS_V1,
    credential_contract: FUTURE_CREDENTIAL_CONTRACT_V1, payload: inspectFrozenOneShotPayloadV1() });
}
export type OneShotDryRunConfigurationV1 = ReturnType<typeof createOneShotDryRunConfigurationV1>;

// A local admission journal, NOT a quota ledger or production distributed lock.
// claim.json is never removed, reset, or reused, even if completion is missing/corrupt.
export function claimOneShotDryRunV1(directory: string, configuration: OneShotDryRunConfigurationV1) {
  if (typeof directory !== "string" || !isAbsolute(directory) || resolve(directory) === resolve(directory, "..")) throw new Error("ONE_SHOT_STATE_PATH_INVALID");
  if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
  if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) throw new Error("ONE_SHOT_STATE_PATH_INVALID");
  if (existsSync(join(directory, "result.json"))) throw new Error("ONE_SHOT_ALREADY_CLAIMED");
  try {
    writeExclusiveSynced(join(directory, "claim.json"), { version: 1, state: "CLAIMED_STOP_AFTER_ANY_OUTCOME", mode: "DRY_RUN",
      experiment_id: "step13h-realization-v1", payload_digest: FROZEN_PAYLOAD_DIGEST_V1, configuration_digest: hybridDigestV1(configuration),
      model: HYBRID_TEACHER_MODEL_V1, lifecycle: "SHADOW", logical_attempts: 1, real_neurons: 0 });
  } catch { throw new Error("ONE_SHOT_ALREADY_CLAIMED_OR_STORAGE_UNAVAILABLE"); }
}

function mockFixture(scenario: DryRunScenarioV1): OfflineCloudflareRestFixtureV1 {
  const answer = scenario === "FREE_PROSE" ? "PlannerAgent is an excellent planning assistant." : renderNaturalCapabilitiesV1(createNaturalCapabilitiesAnswerPlanV1()).text;
  const body = scenario === "MALFORMED" ? "not-json" : scenario === "PROVIDER_ERROR" ? JSON.stringify({ success: false, errors: [{ code: 3040 }] }) :
    JSON.stringify({ success: true, errors: [], messages: [], result: { object: "chat.completion", model: HYBRID_TEACHER_MODEL_V1,
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({ version: 1, answer }) } }],
      usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 } } });
  return { status: scenario === "PROVIDER_ERROR" ? 429 : 200, body,
    ...(scenario === "UNKNOWN_USAGE" ? {} : { offline_neurons: 1 }), ...(scenario === "TIMEOUT" ? { delay_ms: 30001 } : {}) };
}

export async function runOneShotDryRunV1(directory: string, configuration: OneShotDryRunConfigurationV1, scenario: DryRunScenarioV1 = "VALID") {
  // Exact equality rejects extra fields (including credentials), live modes and relaxed limits.
  if (!scenarios.includes(scenario) || hybridCanonicalV1(configuration) !== hybridCanonicalV1(createOneShotDryRunConfigurationV1())) throw new Error("ONE_SHOT_CONFIGURATION_DENIED");
  if (Buffer.byteLength(configuration.payload.wire.body, "utf8") > ONE_SHOT_LIMITS_V1.max_input_bytes) throw new Error("ONE_SHOT_INPUT_BOUND_EXCEEDED");
  const surface = prepareNaturalCapabilitiesRealizationV1();
  if (!await authorizeNaturalCapabilitiesTeacherExposureV1(surface, hybridDigestV1(surface))) throw new Error("ONE_SHOT_EXPOSURE_DENIED");
  claimOneShotDryRunV1(directory, configuration); // Durable admission BEFORE any attempt. No automatic recovery.
  try {
    const fixture = mockFixture(scenario), transport = new MockCloudflareTeacherRestTransportV1([fixture]);
    const registry = new OfflineHybridEvidenceRegistryV1();
    const day = new Date().toISOString().slice(0, 10);
    const offline: OfflineTeacherConfigurationV1 = { mode: "MOCK_ONLY", provider: "CLOUDFLARE_WORKERS_AI", model: HYBRID_TEACHER_MODEL_V1,
      model_revision: "OFFLINE_FIXTURE_ONLY", configuration_version: "step13h-dry-run-v1", free_plan: "CONFIRMED_BY_OFFLINE_FIXTURE",
      model_free_eligibility: "CONFIRMED_BY_OFFLINE_FIXTURE", confirmation_ref: "fixture:not-live-authorization", day_utc: day, daily_neurons: 5,
      limits: { max_input_bytes: 16384, max_input_tokens: 4096, max_output_tokens: 512, max_neurons_per_attempt: 5, timeout_ms: 30000, max_retries: 0 } };
    const baseline = renderNaturalCapabilitiesV1(createNaturalCapabilitiesAnswerPlanV1()).text;
    const result = await runOfflineHybridSupervisionV1({ request_id: "step13h-realization-v1", request: surface, public_response: baseline,
      semantic_family: "GENERAL_CAPABILITIES", evaluation_kind: "INDEPENDENT_NEW" }, {
      // No Student service: a local unavailable fixture only requests the existing Teacher path.
      student: { descriptor: { version: 1, provider_id: "offline-unavailable", adapter_id: "offline-unavailable", adapter_version: "1",
        model_id: "offline-unavailable", model_version: "1", capabilities: ["REALIZATION"], deployment_class: "OFFLINE_FIXTURE", retention_privacy_class: "NO_RETENTION" },
        propose: async () => { throw new Error("OFFLINE_STUDENT_UNAVAILABLE"); } },
      registry, now: () => new Date().toISOString(), student_timeout_ms: 30000, verification_timeout_ms: 30000,
      authorize_exposure: authorizeNaturalCapabilitiesTeacherExposureV1, verify: verifyNaturalCapabilitiesBindingV1,
      teacher: { provider: new CloudflareTeacherRestOfflineAdapterV1(offline, transport), configuration: offline, quota: new OfflineMockTeacherQuotaV1(offline) } });
    const attempt = result.observation.teacher_attempts[0];
    let envelopeValid = false;
    try { envelopeValid = !!parseRealizationEnvelopeV1(JSON.parse(fixture.body).result.choices[0].message.content); } catch { /* No raw errors/bodies. */ }
    const report = hybridSnapshotV1({ version: 1, state: "STOPPED", mode: "DRY_RUN", lifecycle: "SHADOW", model: HYBRID_TEACHER_MODEL_V1,
      payload_digest: FROZEN_PAYLOAD_DIGEST_V1, logical_attempts: 1, mock_requests: transport.requests().length,
      real_requests: 0, real_neurons: 0, outcome: attempt?.state ?? "NO_ATTEMPT", envelope_valid: scenario !== "TIMEOUT" && envelopeValid,
      result_uncertain: !attempt || ["TIMEOUT", "METERING_INVALID", "PROVIDER_ERROR"].includes(attempt.state),
      structural_conformity: attempt?.gate?.schema_valid === true,
      semantic_fidelity: attempt?.gate?.status ?? "INCONCLUSIVE", linguistic_quality: "INDEPENDENT_REVIEW_REQUIRED",
      usage: { provenance: "SYNTHETIC_FIXTURE_ONLY", known: !!attempt?.usage, ...(attempt?.usage ? { fixture: attempt.usage } : {}) },
      input_token_bound: "NOT_QUALIFIED_FOR_LIVE", public_response_unchanged: result.public_response === baseline,
      automatic_training: false, observations: registry.list() });
    if (report.mock_requests > 1 || result.observation.teacher_attempts.length !== 1 || result.registry_status !== "RECORDED" || !report.public_response_unchanged) throw new Error("ONE_SHOT_INVARIANT_FAILED");
    writeExclusiveSynced(join(directory, "result.json"), report);
    return report;
  } catch {
    // A claimed experiment stays consumed even if the report cannot be persisted.
    throw new Error("ONE_SHOT_STOPPED_UNCERTAIN_NO_RETRY");
  }
}
