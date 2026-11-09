import { fileURLToPath } from "node:url";
import { hybridSnapshotV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { HYBRID_TEACHER_MODEL_V1 } from "../../src/conversation/cognition/hybrid.conversational.teacher.v1";
import { NATURAL_CAPABILITIES_SCOPE_V1 } from "../../src/conversation/cognition/hybrid.natural.capabilities.v1";
import { FROZEN_PAYLOAD_DIGEST_V1, ONE_SHOT_LIMITS_V1 } from "./executor";

export const TEACHER_ACCOUNT_ID_V1 = "efd250d57d6fad4a3c4ca458fc20c550";
export const LIVE_EXPERIMENT_ID_V1 = "teacher-realization-live-experiment-v1";
// Fixed relative to this module, never cwd, env, manifest or CLI-selected.
export const FIXED_LIVE_STATE_DIRECTORY_V1 = fileURLToPath(new URL("./live-state/", import.meta.url));
export const TEACHER_ENDPOINT_V1 = `https://api.cloudflare.com/client/v4/accounts/${TEACHER_ACCOUNT_ID_V1}/ai/run/${HYBRID_TEACHER_MODEL_V1}`;
export const LIVE_NETWORK_ENABLED_V1 = false as const;
// Evidence only, never an admission grant: hosted tokenization is not locally qualified.
export const NATIVE_INPUT_TOKEN_BOUND_QUALIFIED_V1 = false as const;
export const ONE_EXPERIMENT_HOSTED_INPUT_RISK_V1 = hybridSnapshotV1({
  experiment_id: LIVE_EXPERIMENT_ID_V1,
  required_acknowledgment: "HOSTED_INPUT_TOKEN_UNCERTAINTY_ACCEPTED_FOR_ONE_EXPERIMENT",
  hosted_input_token_count: "UNKNOWN", hosted_template_overhead: "UNKNOWN",
  provider_estimated_input_validation: "PROVIDER_SIDE_SAFEGUARD_ONLY", context_window_tokens: 32768,
  rejection_consumes_attempt: true,
});
export const ONE_EXPERIMENT_USAGE_POLICY_V1 = hybridSnapshotV1({
  experiment_id: LIVE_EXPERIMENT_ID_V1,
  operator_decision: "USAGE_UNKNOWN_ACCEPTED_FOR_ONE_EXPERIMENT",
  daily_neurons: "UNKNOWN", actual_neurons: "UNKNOWN", workers_free_required: true,
  payment_method_allowed: false, paid_upgrade_allowed: false,
  route: "DIRECT_WORKERS_AI_NO_GATEWAY_NO_PREPAID",
  max_posts: 1, quota_error_consumes_attempt: true, retries: 0, fallback_allowed: false,
});

export class OneShotTransportErrorV1 extends Error {
  constructor(readonly code: string) {
    if (!/^[A-Z][A-Z0-9_]{0,79}$/.test(code)) throw new TypeError("INVALID_SAFE_ERROR_CODE");
    super(code); this.name = "OneShotTransportErrorV1";
  }
}
export function denyRealDispatchV1(): never { throw new OneShotTransportErrorV1("REAL_DISPATCH_DISABLED_STEP13J"); }
export function inspectLiveTransportAvailabilityV1() {
  return hybridSnapshotV1({ real_dispatch_enabled: LIVE_NETWORK_ENABLED_V1, teacher: "DISABLED", lifecycle: "SHADOW",
    fixed_state_directory: FIXED_LIVE_STATE_DIRECTORY_V1, account_id: TEACHER_ACCOUNT_ID_V1, model: HYBRID_TEACHER_MODEL_V1,
    neuron_policy: ONE_EXPERIMENT_USAGE_POLICY_V1,
    hosted_input_risk: ONE_EXPERIMENT_HOSTED_INPUT_RISK_V1,
    blockers: ["STEP13LR_SOURCE_GATE_CLOSED", "FUTURE_OPERATOR_AUTHORIZATION_REQUIRED", "DEDICATED_CREDENTIAL_NOT_ENTERED",
      "CURRENT_WORKERS_FREE_NO_PAYMENT_METHOD_EVIDENCE_REQUIRED", "SEPARATE_HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED", "HOSTED_RESPONSE_COMPATIBILITY_UNVERIFIED"] });
}

// Evidence refs, not credentials. This contract is deliberately not an authorization grant.
export const FUTURE_DEDICATED_CREDENTIAL_V1 = hybridSnapshotV1({ source: "DEDICATED_WORKERS_AI_TOKEN", account_id: TEACHER_ACCOUNT_ID_V1,
  allowed_product: "WORKERS_AI_ONLY", acquisition_enabled: false, oauth_allowed: false, environment_fallback: false,
  cli_value_allowed: false, existing_worker_secrets_allowed: false,
  permissions_status: "DOCUMENTED_CONFLICT_READ_EDIT_VS_READ_OR_WRITE_REVERIFY_BEFORE_PROVISIONING" });
export function createInjectedExperimentManifestV1() {
  return hybridSnapshotV1({ version: 1, mode: "INJECTED_HTTP_FIXTURE_ONLY" as const, boundary: "CONVERSATIONAL_SURFACE_ONLY", lifecycle: "SHADOW",
    experiment_id: LIVE_EXPERIMENT_ID_V1, account_id: TEACHER_ACCOUNT_ID_V1, model: HYBRID_TEACHER_MODEL_V1,
    scope: NATURAL_CAPABILITIES_SCOPE_V1, payload_digest: FROZEN_PAYLOAD_DIGEST_V1, state_location: FIXED_LIVE_STATE_DIRECTORY_V1,
    authorization_evidence_ref: "fixture:operator-not-live-authorization", limits: ONE_SHOT_LIMITS_V1 });
}
export type InjectedExperimentManifestV1 = ReturnType<typeof createInjectedExperimentManifestV1>;
export function createNativeExperimentManifestV1() {
  return hybridSnapshotV1({ ...createInjectedExperimentManifestV1(), mode: "NATIVE_HTTPS_ONESHOT" as const,
    authorization_evidence_ref: "operator:step13lr-explicit-risk-single-experiment",
    admission_policy: ONE_EXPERIMENT_USAGE_POLICY_V1, hosted_input_risk: ONE_EXPERIMENT_HOSTED_INPUT_RISK_V1 });
}
export type ExperimentManifestV1 = InjectedExperimentManifestV1 | ReturnType<typeof createNativeExperimentManifestV1>;
export const OFFLINE_AUTHORIZATION_V1 = Object.freeze({ kind: "OFFLINE_PLACEHOLDER_NOT_A_CREDENTIAL" as const });
export type OfflineAuthorizationV1 = typeof OFFLINE_AUTHORIZATION_V1;
export type ProviderTokensV1 = Readonly<{ state: "KNOWN"; provenance: "INJECTED_PROVIDER_RESPONSE" | "NATIVE_PROVIDER_RESPONSE"; input_tokens: number; output_tokens: number; total_tokens: number }> |
  Readonly<{ state: "UNKNOWN" | "INCONSISTENT"; provenance: "INJECTED_PROVIDER_RESPONSE" | "NATIVE_PROVIDER_RESPONSE" }>;
export type LiveAttemptReceiptV1 = Readonly<{
  version: 1; mode: "INJECTED_HTTP_FIXTURE_ONLY" | "NATIVE_HTTPS_ONESHOT"; lifecycle: "SHADOW"; experiment_id: string;
  account_id: string; model: string; payload_digest: string; authorization_evidence_ref: string;
  state: "STOPPED"; dispatch: "PERMISSION_CONSUMED"; outcome: "COMPLETED" | "PROVIDER_ERROR" | "REJECTED" | "UNCERTAIN";
  failure_code?: string; provider_status?: number; provider_error_codes: readonly number[];
  injected_http_requests: number; actual_network_requests: number; neurons: "UNKNOWN";
  provider_tokens: ProviderTokensV1; envelope_valid: boolean; structural_conformity: boolean;
  semantic_fidelity: "PASS" | "FAIL" | "INCONCLUSIVE"; linguistic_quality: "INDEPENDENT_REVIEW_REQUIRED";
  reasoning_persisted: false; public_response_unchanged: true; automatic_training: false;
  candidate_digest?: string; verification?: unknown;
}>;
