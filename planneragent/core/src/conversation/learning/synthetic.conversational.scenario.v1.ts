import { createHash } from "node:crypto";

export const SYNTHETIC_CONVERSATIONAL_SCENARIO_KINDS_V1 = Object.freeze([
  "PRODUCT", "AUDIENCE", "OPERATIONAL", "DATA", "EXECUTION", "PROTECTED", "CONTINUITY", "AMBIGUITY", "UNRELATED",
] as const);
export type SyntheticConversationalScenarioKindV1 = (typeof SYNTHETIC_CONVERSATIONAL_SCENARIO_KINDS_V1)[number];

export const SYNTHETIC_CONVERSATIONAL_LEARNING_OBJECTIVES_V1 = Object.freeze(["INTERPRETATION", "REALIZATION"] as const);
export type SyntheticConversationalLearningObjectiveV1 = (typeof SYNTHETIC_CONVERSATIONAL_LEARNING_OBJECTIVES_V1)[number];

export const SYNTHETIC_CONVERSATIONAL_BOUNDARY_POSTURES_V1 = Object.freeze([
  "OBSERVATION_ONLY", "NO_EXECUTION", "REQUESTER_CONTENT_NON_AUTHORITATIVE", "PROTECTED_DISCLOSURE_BOUNDARY",
  "DATA_INTRODUCTION_BOUNDARY", "AMBIGUITY_UNRESOLVED",
] as const);
export type SyntheticConversationalBoundaryPostureV1 = (typeof SYNTHETIC_CONVERSATIONAL_BOUNDARY_POSTURES_V1)[number];

export type SyntheticScenarioJsonValueV1 = null | boolean | number | string | readonly SyntheticScenarioJsonValueV1[] | Readonly<{ [key: string]: SyntheticScenarioJsonValueV1 }>;

export type SyntheticScenarioTruthProjectionReferenceV1 = Readonly<{
  projection_id: string;
  projection_version: string;
}>;

export type SyntheticScenarioSemanticItemV1 = Readonly<{
  semantic_id: string;
  value: SyntheticScenarioJsonValueV1;
}>;

export type SyntheticScenarioConclusionV1 = Readonly<{
  conclusion_id: string;
  semantic_ref: string;
}>;

export type CreateSyntheticConversationalScenarioInputV1 = Readonly<{
  version: 1;
  scenario_id: string;
  scenario_version: string;
  scenario_kind: SyntheticConversationalScenarioKindV1;
  learning_objective: SyntheticConversationalLearningObjectiveV1;
  truth_projection: SyntheticScenarioTruthProjectionReferenceV1;
  facts: readonly SyntheticScenarioSemanticItemV1[];
  uncertainties: readonly SyntheticScenarioSemanticItemV1[];
  permitted_conclusions: readonly SyntheticScenarioConclusionV1[];
  prohibited_conclusions: readonly SyntheticScenarioConclusionV1[];
  expected_boundary_posture: readonly SyntheticConversationalBoundaryPostureV1[];
}>;

declare const syntheticScenarioBrand: unique symbol;
export type SyntheticConversationalScenarioV1 = Readonly<CreateSyntheticConversationalScenarioInputV1 & {
  source: "SYNTHETIC";
  authority: "TRAINING_ONLY";
  production_truth: false;
  tenant_binding: "NONE";
  operational_ingress: "FORBIDDEN";
  scenario_digest: string;
  readonly [syntheticScenarioBrand]: true;
}>;

const INPUT_KEYS = Object.freeze([
  "expected_boundary_posture", "facts", "learning_objective", "permitted_conclusions", "prohibited_conclusions",
  "scenario_id", "scenario_kind", "scenario_version", "truth_projection", "uncertainties", "version",
] as const);
const PROJECTION_KEYS = Object.freeze(["projection_id", "projection_version"] as const);
const ITEM_KEYS = Object.freeze(["semantic_id", "value"] as const);
const CONCLUSION_KEYS = Object.freeze(["conclusion_id", "semantic_ref"] as const);
const RESERVED_PRODUCTION_IDENTITY_KEYS = new Set(["tenant_id", "organization_id", "participant_id", "user_id", "authenticated_role"]);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value);
}

function jsonSafe(value: unknown, seen = new Set<object>()): value is SyntheticScenarioJsonValueV1 {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every((entry) => jsonSafe(entry, seen));
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.entries(value).every(([key, entry]) => !RESERVED_PRODUCTION_IDENTITY_KEYS.has(key) && jsonSafe(entry, seen));
}

function deepClone<T extends SyntheticScenarioJsonValueV1>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => deepClone(entry)) as unknown as T;
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, deepClone(entry)])) as T;
  return value;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function stableJson(value: SyntheticScenarioJsonValueV1): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Readonly<Record<string, SyntheticScenarioJsonValueV1>>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function semanticItems(value: unknown): readonly SyntheticScenarioSemanticItemV1[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = new Set<string>();
  const result: SyntheticScenarioSemanticItemV1[] = [];
  for (const entry of value) {
    if (!exactObject(entry, ITEM_KEYS) || !identifier(entry.semantic_id) || !jsonSafe(entry.value) || ids.has(entry.semantic_id)) return undefined;
    ids.add(entry.semantic_id);
    result.push({ semantic_id: entry.semantic_id, value: deepClone(entry.value) });
  }
  return result;
}

function conclusions(value: unknown): readonly SyntheticScenarioConclusionV1[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = new Set<string>();
  const result: SyntheticScenarioConclusionV1[] = [];
  for (const entry of value) {
    if (!exactObject(entry, CONCLUSION_KEYS) || !identifier(entry.conclusion_id) || !identifier(entry.semantic_ref) || ids.has(entry.conclusion_id)) return undefined;
    ids.add(entry.conclusion_id);
    result.push({ conclusion_id: entry.conclusion_id, semantic_ref: entry.semantic_ref });
  }
  return result;
}

export function createSyntheticConversationalScenarioV1(input: unknown): SyntheticConversationalScenarioV1 {
  if (!exactObject(input, INPUT_KEYS) || input.version !== 1 || !identifier(input.scenario_id) || !identifier(input.scenario_version)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO");
  if (!SYNTHETIC_CONVERSATIONAL_SCENARIO_KINDS_V1.includes(input.scenario_kind as SyntheticConversationalScenarioKindV1)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO_KIND");
  if (!SYNTHETIC_CONVERSATIONAL_LEARNING_OBJECTIVES_V1.includes(input.learning_objective as SyntheticConversationalLearningObjectiveV1)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_LEARNING_OBJECTIVE");
  if (!exactObject(input.truth_projection, PROJECTION_KEYS) || !identifier(input.truth_projection.projection_id) || !identifier(input.truth_projection.projection_version)) throw new TypeError("INVALID_SYNTHETIC_SCENARIO_TRUTH_PROJECTION");
  const facts = semanticItems(input.facts);
  const uncertainties = semanticItems(input.uncertainties);
  const permitted = conclusions(input.permitted_conclusions);
  const prohibited = conclusions(input.prohibited_conclusions);
  if (!facts || !uncertainties || !permitted || !prohibited) throw new TypeError("INVALID_SYNTHETIC_SCENARIO_SEMANTICS");
  const semanticIds = [...facts, ...uncertainties].map((entry) => entry.semantic_id);
  if (new Set(semanticIds).size !== semanticIds.length) throw new TypeError("DUPLICATE_SYNTHETIC_SCENARIO_SEMANTIC_ID");
  const prohibitedIds = new Set(prohibited.map((entry) => entry.conclusion_id));
  if (permitted.some((entry) => prohibitedIds.has(entry.conclusion_id))) throw new TypeError("SYNTHETIC_SCENARIO_CONCLUSION_COLLISION");
  if (!Array.isArray(input.expected_boundary_posture) || input.expected_boundary_posture.length === 0 || new Set(input.expected_boundary_posture).size !== input.expected_boundary_posture.length || input.expected_boundary_posture.some((entry) => !SYNTHETIC_CONVERSATIONAL_BOUNDARY_POSTURES_V1.includes(entry as SyntheticConversationalBoundaryPostureV1))) throw new TypeError("INVALID_SYNTHETIC_SCENARIO_BOUNDARY_POSTURE");

  const semantic = {
    version: 1 as const,
    scenario_id: input.scenario_id,
    scenario_version: input.scenario_version,
    scenario_kind: input.scenario_kind as SyntheticConversationalScenarioKindV1,
    learning_objective: input.learning_objective as SyntheticConversationalLearningObjectiveV1,
    truth_projection: { projection_id: input.truth_projection.projection_id, projection_version: input.truth_projection.projection_version },
    facts, uncertainties, permitted_conclusions: permitted, prohibited_conclusions: prohibited,
    expected_boundary_posture: [...input.expected_boundary_posture] as SyntheticConversationalBoundaryPostureV1[],
    source: "SYNTHETIC" as const, authority: "TRAINING_ONLY" as const, production_truth: false as const,
    tenant_binding: "NONE" as const, operational_ingress: "FORBIDDEN" as const,
  };
  const scenario_digest = `synthetic-conversational-scenario:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, scenario_digest }) as unknown as SyntheticConversationalScenarioV1;
}
