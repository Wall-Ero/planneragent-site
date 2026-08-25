import { createHash } from "node:crypto";
import { SYNTHETIC_UTTERANCE_GENERATOR_SOURCE_KINDS_V1, type SyntheticUtteranceGeneratorSourceKindV1, type SyntheticUtteranceModelProvenanceV1 } from "./synthetic.conversational.utterance.generation.v1";

export const CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_STATES_V1 = Object.freeze(["ALLOWED", "DENIED", "UNKNOWN"] as const);
export type ConversationalTrainingSourceEligibilityStateV1 = (typeof CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_STATES_V1)[number];

export const CONVERSATIONAL_TRAINING_LEARNING_USES_V1 = Object.freeze(["SUPERVISED_TRAINING_MATERIAL", "NEGATIVE_TRAINING_MATERIAL"] as const);
export type ConversationalTrainingLearningUseV1 = (typeof CONVERSATIONAL_TRAINING_LEARNING_USES_V1)[number];

export type ConversationalTrainingSourceIdentityV1 = Readonly<{
  source_kind: SyntheticUtteranceGeneratorSourceKindV1;
  generator_id: string;
  generator_version: string;
  model?: SyntheticUtteranceModelProvenanceV1;
}>;

export type ConversationalTrainingEligibilityEvidenceReferenceV1 = Readonly<{
  evidence_id: string;
  evidence_version: string;
  evidence_digest: string;
}>;

export type ConversationalTrainingEligibilityDecisionPolicyReferenceV1 = Readonly<{
  policy_id: string;
  policy_version: string;
}>;

export type CreateConversationalTrainingSourceEligibilityDecisionInputV1 = Readonly<{
  version: 1;
  decision_id: string;
  decision_version: string;
  source: ConversationalTrainingSourceIdentityV1;
  learning_use: ConversationalTrainingLearningUseV1;
  eligibility: ConversationalTrainingSourceEligibilityStateV1;
  evidence?: ConversationalTrainingEligibilityEvidenceReferenceV1;
  decision_policy: ConversationalTrainingEligibilityDecisionPolicyReferenceV1;
  effective_from: string;
  effective_until?: string;
}>;

declare const trainingEligibilityDecisionBrand: unique symbol;
export type ConversationalTrainingSourceEligibilityDecisionV1 = Readonly<CreateConversationalTrainingSourceEligibilityDecisionInputV1 & {
  decision_digest: string;
  readonly [trainingEligibilityDecisionBrand]: true;
}>;

const REQUIRED_KEYS = Object.freeze(["decision_id", "decision_policy", "decision_version", "effective_from", "eligibility", "learning_use", "source", "version"] as const);
const ALLOWED_KEYS = Object.freeze([...REQUIRED_KEYS, "effective_until", "evidence"] as const);
const SOURCE_REQUIRED_KEYS = Object.freeze(["generator_id", "generator_version", "source_kind"] as const);
const SOURCE_ALLOWED_KEYS = Object.freeze([...SOURCE_REQUIRED_KEYS, "model"] as const);
const MODEL_KEYS = Object.freeze(["adapter_id", "adapter_version", "model_id", "model_version", "provider_id"] as const);
const EVIDENCE_KEYS = Object.freeze(["evidence_digest", "evidence_id", "evidence_version"] as const);
const POLICY_KEYS = Object.freeze(["policy_id", "policy_version"] as const);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const EVIDENCE_DIGEST = /^eligibility-evidence:sha256:[0-9a-f]{64}$/;
const CANONICAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function exactWithOptional(value: unknown, required: readonly string[], allowed: readonly string[]): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) && keys.every((key) => allowed.includes(key));
}

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value);
}

function canonicalTime(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_TIME.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function sourceIdentity(value: unknown): ConversationalTrainingSourceIdentityV1 | undefined {
  if (!exactWithOptional(value, SOURCE_REQUIRED_KEYS, SOURCE_ALLOWED_KEYS) || !SYNTHETIC_UTTERANCE_GENERATOR_SOURCE_KINDS_V1.includes(value.source_kind as SyntheticUtteranceGeneratorSourceKindV1) || !identifier(value.generator_id) || !identifier(value.generator_version)) return undefined;
  if (value.source_kind === "MODEL") {
    if (!exactObject(value.model, MODEL_KEYS) || !Object.values(value.model).every(identifier)) return undefined;
    const model = value.model as Record<typeof MODEL_KEYS[number], string>;
    return { source_kind: "MODEL", generator_id: value.generator_id, generator_version: value.generator_version, model: { provider_id: model.provider_id, model_id: model.model_id, model_version: model.model_version, adapter_id: model.adapter_id, adapter_version: model.adapter_version } };
  }
  if (value.model !== undefined) return undefined;
  return { source_kind: value.source_kind as SyntheticUtteranceGeneratorSourceKindV1, generator_id: value.generator_id, generator_version: value.generator_version };
}

function evidenceReference(value: unknown): ConversationalTrainingEligibilityEvidenceReferenceV1 | undefined {
  if (!exactObject(value, EVIDENCE_KEYS) || !identifier(value.evidence_id) || !identifier(value.evidence_version) || typeof value.evidence_digest !== "string" || !EVIDENCE_DIGEST.test(value.evidence_digest)) return undefined;
  return { evidence_id: value.evidence_id, evidence_version: value.evidence_version, evidence_digest: value.evidence_digest };
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

type CanonicalJson = null | boolean | number | string | readonly CanonicalJson[] | Readonly<{ [key: string]: CanonicalJson }>;
function stableJson(value: CanonicalJson): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Readonly<Record<string, CanonicalJson>>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createConversationalTrainingSourceEligibilityDecisionV1(input: CreateConversationalTrainingSourceEligibilityDecisionInputV1): ConversationalTrainingSourceEligibilityDecisionV1;
export function createConversationalTrainingSourceEligibilityDecisionV1(input: unknown): ConversationalTrainingSourceEligibilityDecisionV1 {
  if (!exactWithOptional(input, REQUIRED_KEYS, ALLOWED_KEYS) || input.version !== 1 || !identifier(input.decision_id) || !identifier(input.decision_version)) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_DECISION");
  const source = sourceIdentity(input.source);
  if (!source) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_SOURCE_IDENTITY");
  if (!CONVERSATIONAL_TRAINING_LEARNING_USES_V1.includes(input.learning_use as ConversationalTrainingLearningUseV1)) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_LEARNING_USE");
  if (!CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_STATES_V1.includes(input.eligibility as ConversationalTrainingSourceEligibilityStateV1)) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_STATE");
  const evidence = input.evidence === undefined ? undefined : evidenceReference(input.evidence);
  if (input.evidence !== undefined && !evidence) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_EVIDENCE");
  if (input.eligibility !== "UNKNOWN" && !evidence) throw new TypeError("CONVERSATIONAL_TRAINING_ELIGIBILITY_EVIDENCE_REQUIRED");
  if (!exactObject(input.decision_policy, POLICY_KEYS) || !identifier(input.decision_policy.policy_id) || !identifier(input.decision_policy.policy_version)) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_DECISION_POLICY");
  if (!canonicalTime(input.effective_from) || (input.effective_until !== undefined && !canonicalTime(input.effective_until))) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_EFFECTIVE_TIME");
  if (input.effective_until !== undefined && Date.parse(input.effective_until) <= Date.parse(input.effective_from)) throw new TypeError("INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_INTERVAL");

  const semantic = {
    version: 1 as const, decision_id: input.decision_id, decision_version: input.decision_version, source,
    learning_use: input.learning_use as ConversationalTrainingLearningUseV1,
    eligibility: input.eligibility as ConversationalTrainingSourceEligibilityStateV1,
    ...(evidence ? { evidence } : {}),
    decision_policy: { policy_id: input.decision_policy.policy_id, policy_version: input.decision_policy.policy_version },
    effective_from: input.effective_from, ...(input.effective_until === undefined ? {} : { effective_until: input.effective_until }),
  };
  const decision_digest = `conversational-training-source-eligibility:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, decision_digest }) as unknown as ConversationalTrainingSourceEligibilityDecisionV1;
}

export function isConversationalTrainingSourceEligibleV1(decision: ConversationalTrainingSourceEligibilityDecisionV1, source: ConversationalTrainingSourceIdentityV1, learningUse: ConversationalTrainingLearningUseV1, at: string): boolean {
  if (decision.eligibility !== "ALLOWED" || !decision.evidence || decision.learning_use !== learningUse || !canonicalTime(at)) return false;
  if (stableJson(decision.source) !== stableJson(source)) return false;
  const instant = Date.parse(at);
  return instant >= Date.parse(decision.effective_from) && (decision.effective_until === undefined || instant < Date.parse(decision.effective_until));
}
