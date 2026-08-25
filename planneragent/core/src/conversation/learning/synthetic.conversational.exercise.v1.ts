import { createHash } from "node:crypto";
import type {
  SyntheticConversationalLearningObjectiveV1,
  SyntheticConversationalScenarioKindV1,
  SyntheticConversationalScenarioV1,
} from "./synthetic.conversational.scenario.v1";
import type { SyntheticConversationalPersonaV1 } from "./synthetic.conversational.persona.v1";

export type SyntheticConversationalScenarioReferenceV1 = Readonly<{
  scenario_id: string;
  scenario_version: string;
  scenario_digest: string;
}>;

export type SyntheticConversationalPersonaReferenceV1 = Readonly<{
  persona_id: string;
  persona_version: string;
  persona_digest: string;
}>;

export type CreateSyntheticConversationalExerciseInputV1 = Readonly<{
  version: 1;
  exercise_id: string;
  exercise_version: string;
  scenario: SyntheticConversationalScenarioV1;
  persona: SyntheticConversationalPersonaV1;
}>;

declare const syntheticExerciseBrand: unique symbol;
export type SyntheticConversationalExerciseV1 = Readonly<{
  version: 1;
  exercise_id: string;
  exercise_version: string;
  scenario: SyntheticConversationalScenarioReferenceV1;
  persona: SyntheticConversationalPersonaReferenceV1;
  learning_objective: SyntheticConversationalLearningObjectiveV1;
  scenario_kind: SyntheticConversationalScenarioKindV1;
  purpose: "CONVERSATIONAL_LEARNING";
  exercise_digest: string;
  readonly [syntheticExerciseBrand]: true;
}>;

const INPUT_KEYS = Object.freeze(["exercise_id", "exercise_version", "persona", "scenario", "version"] as const);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const SCENARIO_DIGEST = /^synthetic-conversational-scenario:sha256:[0-9a-f]{64}$/;
const PERSONA_DIGEST = /^synthetic-conversational-persona:sha256:[0-9a-f]{64}$/;

function exactInput(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === INPUT_KEYS.length && Object.keys(value).every((key) => INPUT_KEYS.includes(key as typeof INPUT_KEYS[number]));
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value);
}

function canonicalScenario(value: unknown): value is SyntheticConversationalScenarioV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const scenario = value as Partial<SyntheticConversationalScenarioV1>;
  return scenario.version === 1 && identifier(scenario.scenario_id) && identifier(scenario.scenario_version) &&
    typeof scenario.scenario_digest === "string" && SCENARIO_DIGEST.test(scenario.scenario_digest) &&
    scenario.source === "SYNTHETIC" && scenario.authority === "TRAINING_ONLY" && scenario.production_truth === false &&
    scenario.tenant_binding === "NONE" && scenario.operational_ingress === "FORBIDDEN" &&
    typeof scenario.scenario_kind === "string" && typeof scenario.learning_objective === "string";
}

function canonicalPersona(value: unknown): value is SyntheticConversationalPersonaV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const persona = value as Partial<SyntheticConversationalPersonaV1>;
  return persona.version === 1 && identifier(persona.persona_id) && identifier(persona.persona_version) &&
    typeof persona.persona_digest === "string" && PERSONA_DIGEST.test(persona.persona_digest) &&
    persona.origin === "SYNTHETIC" && persona.authority === "NONE" && persona.identity_verified === false && persona.operational_truth === false;
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

export function createSyntheticConversationalExerciseV1(input: CreateSyntheticConversationalExerciseInputV1): SyntheticConversationalExerciseV1;
export function createSyntheticConversationalExerciseV1(input: unknown): SyntheticConversationalExerciseV1 {
  if (!exactInput(input) || input.version !== 1 || !identifier(input.exercise_id) || !identifier(input.exercise_version)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE");
  if (!canonicalScenario(input.scenario)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE_SCENARIO");
  if (!canonicalPersona(input.persona)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE_PERSONA");

  const semantic = {
    version: 1 as const,
    exercise_id: input.exercise_id,
    exercise_version: input.exercise_version,
    scenario: {
      scenario_id: input.scenario.scenario_id,
      scenario_version: input.scenario.scenario_version,
      scenario_digest: input.scenario.scenario_digest,
    },
    persona: {
      persona_id: input.persona.persona_id,
      persona_version: input.persona.persona_version,
      persona_digest: input.persona.persona_digest,
    },
    learning_objective: input.scenario.learning_objective,
    scenario_kind: input.scenario.scenario_kind,
    purpose: "CONVERSATIONAL_LEARNING" as const,
  };
  const exercise_digest = `synthetic-conversational-exercise:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, exercise_digest }) as unknown as SyntheticConversationalExerciseV1;
}
