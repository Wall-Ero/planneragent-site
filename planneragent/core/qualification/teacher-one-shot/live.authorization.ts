import { hybridCanonicalV1, hybridDigestV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { createNativeExperimentManifestV1, OneShotTransportErrorV1, NATIVE_INPUT_TOKEN_BOUND_QUALIFIED_V1 } from "./live.contracts";
import { FROZEN_PAYLOAD_DIGEST_V1, inspectFrozenOneShotPayloadV1, ONE_SHOT_LIMITS_V1 } from "./executor";
import { HYBRID_TEACHER_MODEL_V1 } from "../../src/conversation/cognition/hybrid.conversational.teacher.v1";
import { createHash } from "node:crypto";

// This template is evidence to be affirmed interactively, never an authorization grant.
export function nativeAuthorizationChallengeV1() {
  return {
    manifest: createNativeExperimentManifestV1(),
    operator_verified_workers_free: true,
    operator_verified_no_payment_method: true,
    route: "DIRECT_WORKERS_AI_NO_GATEWAY_NO_PREPAID",
    neuron_usage: "UNKNOWN",
    authorize_exactly_one_post: true,
    token_name: "planneragent-teacher-oneshot",
    token_expires: "2026-10-29",
  } as const;
}
function verifiedLocalInputV1() {
  // The existing inspector verifies the frozen artifact SHA-256 and canonical wire bytes.
  const frozen = inspectFrozenOneShotPayloadV1();
  const body = JSON.parse(frozen.wire.body);
  const wireBytes = Buffer.byteLength(frozen.wire.body, "utf8");
  if (frozen.model !== HYBRID_TEACHER_MODEL_V1 || frozen.wire.method !== "POST" ||
      frozen.wire.path_template !== `/client/v4/accounts/{ACCOUNT_ID}/ai/run/${HYBRID_TEACHER_MODEL_V1}` ||
      wireBytes !== 2094 || wireBytes > ONE_SHOT_LIMITS_V1.max_input_bytes ||
      typeof body.prompt !== "string" || Buffer.byteLength(body.prompt, "utf8") !== 1762 ||
      body.max_tokens !== 512 || body.max_tokens !== ONE_SHOT_LIMITS_V1.max_output_tokens || body.stream !== false) {
    throw new OneShotTransportErrorV1("LOCAL_INPUT_BOUNDS_INVALID");
  }
  return { frozen, body, wireBytes };
}
export function inspectNativeInputTokenBoundV1() {
  const { frozen, body, wireBytes } = verifiedLocalInputV1();
  return {
    qualified: NATIVE_INPUT_TOKEN_BOUND_QUALIFIED_V1,
    local_input_state: "LOCAL_INPUT_BYTES_VERIFIED",
    wire_utf8_bytes: wireBytes, max_request_bytes: ONE_SHOT_LIMITS_V1.max_input_bytes,
    payload_digest: FROZEN_PAYLOAD_DIGEST_V1,
    wire_body_sha256: `sha256:${createHash("sha256").update(frozen.wire.body, "utf8").digest("hex")}`,
    prompt_utf8_bytes: Buffer.byteLength(body.prompt, "utf8"),
    context_window_tokens: 32768, reserved_output_tokens: body.max_tokens,
    local_token_estimate: { classification: "LOCAL_TOKEN_ESTIMATE", state: "NOT_CLAIMED" },
    hosted_input_state: "HOSTED_INPUT_TOKEN_COUNT_UNKNOWN", hosted_template_state: "HOSTED_TEMPLATE_OVERHEAD_UNKNOWN",
    provider_estimated_input_validation: "PROVIDER_SIDE_SAFEGUARD_ONLY",
    exact_prompt_tokens: "UNKNOWN", deployed_tokenizer_parity: "UNVERIFIED",
    provider_template_overhead_tokens: "UNKNOWN", provider_schema_overhead_tokens: "UNKNOWN",
    total_input_token_upper_bound: "UNRESOLVED",
  } as const;
}
export function requireNativeLocalInputBoundsV1(): void { verifiedLocalInputV1(); }
export function nativeHostedInputAcknowledgmentPhraseV1(): string {
  return `HOSTED_INPUT_TOKEN_UNCERTAINTY_ACCEPTED_FOR_ONE_EXPERIMENT ${hybridDigestV1(nativeAuthorizationChallengeV1())}`;
}
export function requireNativeHostedInputAcknowledgmentV1(value: unknown): void {
  if (value !== nativeHostedInputAcknowledgmentPhraseV1()) throw new OneShotTransportErrorV1("HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED");
}
export function inspectNativeGateOpeningV1() {
  const challenge = nativeAuthorizationChallengeV1();
  return {
    opens_gate: false,
    separate_operator_decision_required: `APPROVE REVIEWED SOURCE GATE OPENING ${hybridDigestV1(challenge)}`,
    mechanism: "REVIEWED_SOURCE_CHANGE_THEN_EXISTING_INTERACTIVE_AUTHORIZATION",
    input_token_bound: inspectNativeInputTokenBoundV1(),
    required_hosted_input_acknowledgment: nativeHostedInputAcknowledgmentPhraseV1(),
    hosted_input_acknowledgment_collected: false,
    prerequisite: "SEPARATE_HOSTED_INPUT_RISK_ACKNOWLEDGMENT_AND_EXPLICIT_ONE_POST_AUTHORIZATION",
  } as const;
}
export function nativeAuthorizationPhraseV1(): string {
  return `AUTHORIZE ONE POST ${hybridDigestV1(nativeAuthorizationChallengeV1())}`;
}
export function validateNativeAuthorizationV1(value: unknown): void {
  // Exact expiry time is unknown: conservatively stop at the start of expiry day (UTC).
  if (Date.now() >= Date.parse("2026-10-29T00:00:00Z")) throw new OneShotTransportErrorV1("DEDICATED_TOKEN_EXPIRED_OR_REVERIFY_REQUIRED");
  try {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const { hosted_input_uncertainty_acknowledgment, ...authorization } = value as Record<string, unknown>;
      if (hybridCanonicalV1(authorization) === hybridCanonicalV1({ ...nativeAuthorizationChallengeV1(), confirmation: nativeAuthorizationPhraseV1() })) {
        requireNativeHostedInputAcknowledgmentV1(hosted_input_uncertainty_acknowledgment); return;
      }
    }
  } catch (error) {
    if (error instanceof OneShotTransportErrorV1 && error.code === "HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED") throw error;
    // Never expose untrusted input or raw exceptions.
  }
  throw new OneShotTransportErrorV1("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
}
