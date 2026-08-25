import { createHash } from "node:crypto";
import type { SyntheticConversationalExerciseV1 } from "./synthetic.conversational.exercise.v1";

export const SYNTHETIC_CONVERSATIONAL_USER_UTTERANCE_TEXT_MAX_LENGTH_V1 = 1_200;

export type SyntheticConversationalExerciseReferenceV1 = Readonly<{
  exercise_id: string;
  exercise_version: string;
  exercise_digest: string;
}>;

export type CreateSyntheticConversationalUserUtteranceInputV1 = Readonly<{
  version: 1;
  utterance_id: string;
  utterance_version: string;
  exercise: SyntheticConversationalExerciseV1;
  text: string;
}>;

declare const syntheticUserUtteranceBrand: unique symbol;
export type SyntheticConversationalUserUtteranceV1 = Readonly<{
  version: 1;
  utterance_id: string;
  utterance_version: string;
  exercise: SyntheticConversationalExerciseReferenceV1;
  text: string;
  origin: "SYNTHETIC";
  speaker: "SYNTHETIC_USER";
  authority: "NONE";
  operational_truth: false;
  utterance_digest: string;
  readonly [syntheticUserUtteranceBrand]: true;
}>;

const INPUT_KEYS = Object.freeze(["exercise", "text", "utterance_id", "utterance_version", "version"] as const);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const EXERCISE_DIGEST = /^synthetic-conversational-exercise:sha256:[0-9a-f]{64}$/;
const UNSAFE_CONTROL_CHARACTER = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function exactInput(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === INPUT_KEYS.length && Object.keys(value).every((key) => INPUT_KEYS.includes(key as typeof INPUT_KEYS[number]));
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value);
}

function canonicalExercise(value: unknown): value is SyntheticConversationalExerciseV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const exercise = value as Partial<SyntheticConversationalExerciseV1>;
  return exercise.version === 1 && identifier(exercise.exercise_id) && identifier(exercise.exercise_version) &&
    typeof exercise.exercise_digest === "string" && EXERCISE_DIGEST.test(exercise.exercise_digest) &&
    exercise.purpose === "CONVERSATIONAL_LEARNING";
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

export function createSyntheticConversationalUserUtteranceV1(input: CreateSyntheticConversationalUserUtteranceInputV1): SyntheticConversationalUserUtteranceV1;
export function createSyntheticConversationalUserUtteranceV1(input: unknown): SyntheticConversationalUserUtteranceV1 {
  if (!exactInput(input) || input.version !== 1 || !identifier(input.utterance_id) || !identifier(input.utterance_version)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_USER_UTTERANCE");
  if (!canonicalExercise(input.exercise)) throw new TypeError("INVALID_SYNTHETIC_USER_UTTERANCE_EXERCISE");
  if (typeof input.text !== "string" || input.text.trim().length === 0 || input.text.length > SYNTHETIC_CONVERSATIONAL_USER_UTTERANCE_TEXT_MAX_LENGTH_V1 || UNSAFE_CONTROL_CHARACTER.test(input.text)) throw new TypeError("INVALID_SYNTHETIC_USER_UTTERANCE_TEXT");

  const semantic = {
    version: 1 as const,
    utterance_id: input.utterance_id,
    utterance_version: input.utterance_version,
    exercise: {
      exercise_id: input.exercise.exercise_id,
      exercise_version: input.exercise.exercise_version,
      exercise_digest: input.exercise.exercise_digest,
    },
    text: input.text,
    origin: "SYNTHETIC" as const,
    speaker: "SYNTHETIC_USER" as const,
    authority: "NONE" as const,
    operational_truth: false as const,
  };
  const utterance_digest = `synthetic-conversational-user-utterance:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, utterance_digest }) as unknown as SyntheticConversationalUserUtteranceV1;
}
