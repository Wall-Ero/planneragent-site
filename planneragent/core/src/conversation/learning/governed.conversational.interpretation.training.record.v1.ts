import { createHash } from "node:crypto";
import { parseConversationalInterpretationResultV1, type ConversationalInterpretationResultV1 } from "../cognition/conversational.cognition.contracts.v1";
import { isConversationalTrainingSourceEligibleV1, type ConversationalTrainingSourceEligibilityDecisionV1, type ConversationalTrainingSourceIdentityV1 } from "./conversational.training.source.eligibility.v1";
import type { SyntheticConversationalUserUtteranceV1 } from "./synthetic.conversational.user.utterance.v1";
import type { SyntheticConversationalUtteranceGenerationRecordV1 } from "./synthetic.conversational.utterance.generation.v1";

export const CONVERSATIONAL_INTERPRETATION_ORACLE_KINDS_V1 = Object.freeze(["PLANNERAGENT_AUTHORED", "HUMAN_APPROVED"] as const);
export type ConversationalInterpretationOracleKindV1 = (typeof CONVERSATIONAL_INTERPRETATION_ORACLE_KINDS_V1)[number];

export type ConversationalInterpretationAnnotationInputV1 = Readonly<{
  annotation_id: string;
  annotation_version: string;
  oracle_kind: ConversationalInterpretationOracleKindV1;
  oracle_id: string;
  oracle_version: string;
  approved_at: string;
  evidence: Readonly<{ evidence_id: string; evidence_version: string; evidence_digest: string }>;
}>;

export type GovernedConversationalInterpretationAnnotationV1 = Readonly<ConversationalInterpretationAnnotationInputV1 & {
  pair_digest: string;
}>;

export type CreateGovernedConversationalInterpretationTrainingRecordInputV1 = Readonly<{
  version: 1;
  record_id: string;
  record_version: string;
  utterance: SyntheticConversationalUserUtteranceV1;
  generation: SyntheticConversationalUtteranceGenerationRecordV1;
  eligibility_decision: ConversationalTrainingSourceEligibilityDecisionV1;
  admitted_at: string;
  target: ConversationalInterpretationResultV1;
  annotation: ConversationalInterpretationAnnotationInputV1;
}>;

declare const governedInterpretationTrainingRecordBrand: unique symbol;
export type GovernedConversationalInterpretationTrainingRecordV1 = Readonly<{
  version: 1;
  record_id: string;
  record_version: string;
  utterance: Readonly<{ utterance_id: string; utterance_version: string; utterance_digest: string }>;
  generation: Readonly<{ generation_id: string; generation_version: string; generation_digest: string }>;
  eligibility_decision: Readonly<{ decision_id: string; decision_version: string; decision_digest: string }>;
  admitted_at: string;
  learning_use: "SUPERVISED_TRAINING_MATERIAL";
  target: ConversationalInterpretationResultV1;
  annotation: GovernedConversationalInterpretationAnnotationV1;
  record_digest: string;
  readonly [governedInterpretationTrainingRecordBrand]: true;
}>;

const INPUT_KEYS = Object.freeze(["admitted_at", "annotation", "eligibility_decision", "generation", "record_id", "record_version", "target", "utterance", "version"] as const);
const ANNOTATION_KEYS = Object.freeze(["annotation_id", "annotation_version", "approved_at", "evidence", "oracle_id", "oracle_kind", "oracle_version"] as const);
const EVIDENCE_KEYS = Object.freeze(["evidence_digest", "evidence_id", "evidence_version"] as const);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const CANONICAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UTTERANCE_DIGEST = /^synthetic-conversational-user-utterance:sha256:[0-9a-f]{64}$/;
const GENERATION_DIGEST = /^synthetic-conversational-utterance-generation:sha256:[0-9a-f]{64}$/;
const DECISION_DIGEST = /^conversational-training-source-eligibility:sha256:[0-9a-f]{64}$/;
const ANNOTATION_EVIDENCE_DIGEST = /^interpretation-annotation-evidence:sha256:[0-9a-f]{64}$/;

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}
function identifier(value: unknown): value is string { return typeof value === "string" && IDENTIFIER.test(value); }
function canonicalTime(value: unknown): value is string { return typeof value === "string" && CANONICAL_TIME.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }

function canonicalUtterance(value: unknown): value is SyntheticConversationalUserUtteranceV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const item = value as Partial<SyntheticConversationalUserUtteranceV1>;
  return item.version === 1 && identifier(item.utterance_id) && identifier(item.utterance_version) && typeof item.utterance_digest === "string" && UTTERANCE_DIGEST.test(item.utterance_digest) && item.origin === "SYNTHETIC" && item.speaker === "SYNTHETIC_USER" && item.authority === "NONE" && item.operational_truth === false;
}
function canonicalGeneration(value: unknown): value is SyntheticConversationalUtteranceGenerationRecordV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const item = value as Partial<SyntheticConversationalUtteranceGenerationRecordV1>;
  return item.version === 1 && identifier(item.generation_id) && identifier(item.generation_version) && typeof item.generation_digest === "string" && GENERATION_DIGEST.test(item.generation_digest) && item.generator !== undefined && item.utterance !== undefined;
}
function canonicalDecision(value: unknown): value is ConversationalTrainingSourceEligibilityDecisionV1 {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const item = value as Partial<ConversationalTrainingSourceEligibilityDecisionV1>;
  return item.version === 1 && identifier(item.decision_id) && identifier(item.decision_version) && typeof item.decision_digest === "string" && DECISION_DIGEST.test(item.decision_digest) && item.source !== undefined;
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
  if (value !== null && typeof value === "object") { const object = value as Readonly<Record<string, CanonicalJson>>; return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`; }
  return JSON.stringify(value);
}

function sourceFromGeneration(generation: SyntheticConversationalUtteranceGenerationRecordV1): ConversationalTrainingSourceIdentityV1 {
  return deepFreeze({ source_kind: generation.generator.source_kind, generator_id: generation.generator.generator_id, generator_version: generation.generator.generator_version, ...(generation.model ? { model: { ...generation.model } } : {}) }) as ConversationalTrainingSourceIdentityV1;
}

export function createGovernedConversationalInterpretationTrainingRecordV1(input: CreateGovernedConversationalInterpretationTrainingRecordInputV1): GovernedConversationalInterpretationTrainingRecordV1;
export function createGovernedConversationalInterpretationTrainingRecordV1(input: unknown): GovernedConversationalInterpretationTrainingRecordV1 {
  if (!exactObject(input, INPUT_KEYS) || input.version !== 1 || !identifier(input.record_id) || !identifier(input.record_version)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_TRAINING_RECORD");
  if (!canonicalUtterance(input.utterance)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_TRAINING_UTTERANCE");
  if (!canonicalGeneration(input.generation)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_TRAINING_GENERATION");
  if (input.generation.utterance.utterance_id !== input.utterance.utterance_id || input.generation.utterance.utterance_version !== input.utterance.utterance_version || input.generation.utterance.utterance_digest !== input.utterance.utterance_digest) throw new TypeError("GOVERNED_INTERPRETATION_TRAINING_LINEAGE_MISMATCH");
  if (!canonicalDecision(input.eligibility_decision)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_TRAINING_ELIGIBILITY_DECISION");
  if (!canonicalTime(input.admitted_at)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_TRAINING_ADMISSION_TIME");
  const source = sourceFromGeneration(input.generation);
  if (!isConversationalTrainingSourceEligibleV1(input.eligibility_decision, source, "SUPERVISED_TRAINING_MATERIAL", input.admitted_at)) throw new TypeError("GOVERNED_INTERPRETATION_TRAINING_SOURCE_NOT_ELIGIBLE");
  const target = parseConversationalInterpretationResultV1(input.target);
  if (!target) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_TRAINING_TARGET");
  if (!exactObject(input.annotation, ANNOTATION_KEYS) || !identifier(input.annotation.annotation_id) || !identifier(input.annotation.annotation_version) || !CONVERSATIONAL_INTERPRETATION_ORACLE_KINDS_V1.includes(input.annotation.oracle_kind as ConversationalInterpretationOracleKindV1) || !identifier(input.annotation.oracle_id) || !identifier(input.annotation.oracle_version) || !canonicalTime(input.annotation.approved_at)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_ANNOTATION");
  if (!exactObject(input.annotation.evidence, EVIDENCE_KEYS) || !identifier(input.annotation.evidence.evidence_id) || !identifier(input.annotation.evidence.evidence_version) || typeof input.annotation.evidence.evidence_digest !== "string" || !ANNOTATION_EVIDENCE_DIGEST.test(input.annotation.evidence.evidence_digest)) throw new TypeError("INVALID_GOVERNED_INTERPRETATION_ANNOTATION_EVIDENCE");

  const utterance = { utterance_id: input.utterance.utterance_id, utterance_version: input.utterance.utterance_version, utterance_digest: input.utterance.utterance_digest };
  const pair_digest = `conversational-interpretation-annotation-pair:sha256:${createHash("sha256").update(stableJson({ utterance, target })).digest("hex")}`;
  const annotation = { annotation_id: input.annotation.annotation_id, annotation_version: input.annotation.annotation_version, oracle_kind: input.annotation.oracle_kind as ConversationalInterpretationOracleKindV1, oracle_id: input.annotation.oracle_id, oracle_version: input.annotation.oracle_version, approved_at: input.annotation.approved_at, evidence: { evidence_id: input.annotation.evidence.evidence_id, evidence_version: input.annotation.evidence.evidence_version, evidence_digest: input.annotation.evidence.evidence_digest }, pair_digest };
  const semantic = {
    version: 1 as const, record_id: input.record_id, record_version: input.record_version, utterance,
    generation: { generation_id: input.generation.generation_id, generation_version: input.generation.generation_version, generation_digest: input.generation.generation_digest },
    eligibility_decision: { decision_id: input.eligibility_decision.decision_id, decision_version: input.eligibility_decision.decision_version, decision_digest: input.eligibility_decision.decision_digest },
    admitted_at: input.admitted_at, learning_use: "SUPERVISED_TRAINING_MATERIAL" as const, target, annotation,
  };
  const record_digest = `governed-conversational-interpretation-training:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, record_digest }) as unknown as GovernedConversationalInterpretationTrainingRecordV1;
}
