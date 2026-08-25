import { createHash } from "node:crypto";
import type { SyntheticConversationalExerciseV1 } from "./synthetic.conversational.exercise.v1";
import type { SyntheticConversationalUserUtteranceV1 } from "./synthetic.conversational.user.utterance.v1";

export const SYNTHETIC_UTTERANCE_GENERATOR_SOURCE_KINDS_V1 = Object.freeze(["PLANNERAGENT_AUTHORED", "DETERMINISTIC", "MODEL"] as const);
export type SyntheticUtteranceGeneratorSourceKindV1 = (typeof SYNTHETIC_UTTERANCE_GENERATOR_SOURCE_KINDS_V1)[number];

export type SyntheticUtteranceGeneratorIdentityV1 = Readonly<{
  source_kind: SyntheticUtteranceGeneratorSourceKindV1;
  generator_id: string;
  generator_version: string;
}>;

export type SyntheticUtteranceModelProvenanceV1 = Readonly<{
  provider_id: string;
  model_id: string;
  model_version: string;
  adapter_id: string;
  adapter_version: string;
}>;

export type SyntheticUtteranceGenerationPolicyReferenceV1 = Readonly<{
  policy_id: string;
  policy_version: string;
}>;

export type CreateSyntheticConversationalUtteranceGenerationRecordInputV1 = Readonly<{
  version: 1;
  generation_id: string;
  generation_version: string;
  exercise: SyntheticConversationalExerciseV1;
  utterance: SyntheticConversationalUserUtteranceV1;
  generator: SyntheticUtteranceGeneratorIdentityV1;
  model?: SyntheticUtteranceModelProvenanceV1;
  generation_policy: SyntheticUtteranceGenerationPolicyReferenceV1;
  generated_at: string;
}>;

declare const syntheticUtteranceGenerationBrand: unique symbol;
export type SyntheticConversationalUtteranceGenerationRecordV1 = Readonly<{
  version: 1;
  generation_id: string;
  generation_version: string;
  exercise: Readonly<{ exercise_id: string; exercise_version: string; exercise_digest: string }>;
  utterance: Readonly<{ utterance_id: string; utterance_version: string; utterance_digest: string }>;
  generator: SyntheticUtteranceGeneratorIdentityV1;
  model?: SyntheticUtteranceModelProvenanceV1;
  generation_policy: SyntheticUtteranceGenerationPolicyReferenceV1;
  generated_at: string;
  generation_digest: string;
  readonly [syntheticUtteranceGenerationBrand]: true;
}>;

const REQUIRED_KEYS = Object.freeze(["exercise", "generated_at", "generation_id", "generation_policy", "generation_version", "generator", "utterance", "version"] as const);
const ALLOWED_KEYS = Object.freeze([...REQUIRED_KEYS, "model"] as const);
const GENERATOR_KEYS = Object.freeze(["generator_id", "generator_version", "source_kind"] as const);
const MODEL_KEYS = Object.freeze(["adapter_id", "adapter_version", "model_id", "model_version", "provider_id"] as const);
const POLICY_KEYS = Object.freeze(["policy_id", "policy_version"] as const);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const EXERCISE_DIGEST = /^synthetic-conversational-exercise:sha256:[0-9a-f]{64}$/;
const UTTERANCE_DIGEST = /^synthetic-conversational-user-utterance:sha256:[0-9a-f]{64}$/;
const CANONICAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function exactInput(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return REQUIRED_KEYS.every((key) => keys.includes(key)) && keys.every((key) => ALLOWED_KEYS.includes(key as typeof ALLOWED_KEYS[number]));
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

function canonicalExercise(value: unknown): value is SyntheticConversationalExerciseV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const exercise = value as Partial<SyntheticConversationalExerciseV1>;
  return exercise.version === 1 && identifier(exercise.exercise_id) && identifier(exercise.exercise_version) &&
    typeof exercise.exercise_digest === "string" && EXERCISE_DIGEST.test(exercise.exercise_digest) && exercise.purpose === "CONVERSATIONAL_LEARNING";
}

function canonicalUtterance(value: unknown): value is SyntheticConversationalUserUtteranceV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const utterance = value as Partial<SyntheticConversationalUserUtteranceV1>;
  return utterance.version === 1 && identifier(utterance.utterance_id) && identifier(utterance.utterance_version) &&
    typeof utterance.utterance_digest === "string" && UTTERANCE_DIGEST.test(utterance.utterance_digest) && utterance.origin === "SYNTHETIC" &&
    utterance.speaker === "SYNTHETIC_USER" && utterance.authority === "NONE" && utterance.operational_truth === false;
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

export function createSyntheticConversationalUtteranceGenerationRecordV1(input: CreateSyntheticConversationalUtteranceGenerationRecordInputV1): SyntheticConversationalUtteranceGenerationRecordV1;
export function createSyntheticConversationalUtteranceGenerationRecordV1(input: unknown): SyntheticConversationalUtteranceGenerationRecordV1 {
  if (!exactInput(input) || input.version !== 1 || !identifier(input.generation_id) || !identifier(input.generation_version)) throw new TypeError("INVALID_SYNTHETIC_UTTERANCE_GENERATION_RECORD");
  if (!canonicalExercise(input.exercise)) throw new TypeError("INVALID_SYNTHETIC_UTTERANCE_GENERATION_EXERCISE");
  if (!canonicalUtterance(input.utterance)) throw new TypeError("INVALID_SYNTHETIC_UTTERANCE_GENERATION_UTTERANCE");
  const bound = input.utterance.exercise;
  if (bound.exercise_id !== input.exercise.exercise_id || bound.exercise_version !== input.exercise.exercise_version || bound.exercise_digest !== input.exercise.exercise_digest) throw new TypeError("SYNTHETIC_UTTERANCE_GENERATION_LINEAGE_MISMATCH");
  if (!exactObject(input.generator, GENERATOR_KEYS) || !SYNTHETIC_UTTERANCE_GENERATOR_SOURCE_KINDS_V1.includes(input.generator.source_kind as SyntheticUtteranceGeneratorSourceKindV1) || !identifier(input.generator.generator_id) || !identifier(input.generator.generator_version)) throw new TypeError("INVALID_SYNTHETIC_UTTERANCE_GENERATOR");
  if (!exactObject(input.generation_policy, POLICY_KEYS) || !identifier(input.generation_policy.policy_id) || !identifier(input.generation_policy.policy_version)) throw new TypeError("INVALID_SYNTHETIC_UTTERANCE_GENERATION_POLICY");
  if (!canonicalTime(input.generated_at)) throw new TypeError("INVALID_SYNTHETIC_UTTERANCE_GENERATION_TIME");
  if (input.generator.source_kind === "MODEL") {
    if (!exactObject(input.model, MODEL_KEYS) || !Object.values(input.model).every(identifier)) throw new TypeError("SYNTHETIC_UTTERANCE_MODEL_PROVENANCE_REQUIRED");
  } else if (input.model !== undefined) throw new TypeError("SYNTHETIC_UTTERANCE_MODEL_PROVENANCE_FORBIDDEN");
  const model = input.model as SyntheticUtteranceModelProvenanceV1 | undefined;

  const semantic = {
    version: 1 as const,
    generation_id: input.generation_id,
    generation_version: input.generation_version,
    exercise: { exercise_id: input.exercise.exercise_id, exercise_version: input.exercise.exercise_version, exercise_digest: input.exercise.exercise_digest },
    utterance: { utterance_id: input.utterance.utterance_id, utterance_version: input.utterance.utterance_version, utterance_digest: input.utterance.utterance_digest },
    generator: { source_kind: input.generator.source_kind as SyntheticUtteranceGeneratorSourceKindV1, generator_id: input.generator.generator_id, generator_version: input.generator.generator_version },
    ...(model === undefined ? {} : { model: { provider_id: model.provider_id, model_id: model.model_id, model_version: model.model_version, adapter_id: model.adapter_id, adapter_version: model.adapter_version } }),
    generation_policy: { policy_id: input.generation_policy.policy_id, policy_version: input.generation_policy.policy_version },
    generated_at: input.generated_at,
  };
  const generation_digest = `synthetic-conversational-utterance-generation:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, generation_digest }) as unknown as SyntheticConversationalUtteranceGenerationRecordV1;
}
