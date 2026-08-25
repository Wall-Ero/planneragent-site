import { describe, expect, it } from "vitest";
import { createSyntheticConversationalExerciseV1 } from "../learning/synthetic.conversational.exercise.v1";
import { createSyntheticConversationalPersonaV1 } from "../learning/synthetic.conversational.persona.v1";
import { createSyntheticConversationalScenarioV1 } from "../learning/synthetic.conversational.scenario.v1";
import { createSyntheticConversationalUserUtteranceV1 } from "../learning/synthetic.conversational.user.utterance.v1";
import { createSyntheticConversationalUtteranceGenerationRecordV1, type SyntheticConversationalUtteranceGenerationRecordV1 } from "../learning/synthetic.conversational.utterance.generation.v1";

const scenario = (id = "scenario:product") => createSyntheticConversationalScenarioV1({
  version: 1, scenario_id: id, scenario_version: "1", scenario_kind: "PRODUCT", learning_objective: "INTERPRETATION",
  truth_projection: { projection_id: "synthetic-projection:product", projection_version: "1" }, facts: [{ semantic_id: "fact:product", value: { product: "PlannerAgent" } }],
  uncertainties: [], permitted_conclusions: [{ conclusion_id: "conclusion:question", semantic_ref: "fact:product" }], prohibited_conclusions: [],
  expected_boundary_posture: ["REQUESTER_CONTENT_NON_AUTHORITATIVE"],
});
const persona = () => createSyntheticConversationalPersonaV1({
  version: 1, persona_id: "persona:planner", persona_version: "1", declared_role: { label: "planner" }, language: "en",
  language_quality_traits: ["FLUENT"], expertise: "PRACTITIONER", communication_traits: ["DIRECT"], terminology_traits: [],
});
const exercise = (id = "exercise:product", scenarioId = "scenario:product") => createSyntheticConversationalExerciseV1({ version: 1, exercise_id: id, exercise_version: "1", scenario: scenario(scenarioId), persona: persona() });
const utterance = (e = exercise(), text = "What can PlannerAgent do?", id = "utterance:product") => createSyntheticConversationalUserUtteranceV1({ version: 1, utterance_id: id, utterance_version: "1", exercise: e, text });
const authored = (e = exercise(), u = utterance(e), overrides: Record<string, unknown> = {}) => ({
  version: 1, generation_id: "generation:authored", generation_version: "1", exercise: e, utterance: u,
  generator: { source_kind: "PLANNERAGENT_AUTHORED", generator_id: "generator:fixture-author", generator_version: "1" },
  generation_policy: { policy_id: "policy:synthetic-utterance", policy_version: "1" }, generated_at: "2026-08-25T08:00:00.000Z", ...overrides,
});

describe("SyntheticConversationalUtteranceGenerationRecordV1", () => {
  it("accepts authored and deterministic generation provenance", () => {
    const record = createSyntheticConversationalUtteranceGenerationRecordV1(authored() as never);
    expect(record.generator.source_kind).toBe("PLANNERAGENT_AUTHORED");
    expect(createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, { generator: { source_kind: "DETERMINISTIC", generator_id: "generator:typo", generator_version: "2" } }) as never).generator.source_kind).toBe("DETERMINISTIC");
  });

  it("accepts provider-neutral remote and local MODEL provenance", () => {
    for (const provider_id of ["generic-provider", "openai", "planneragent-local"]) {
      const record = createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, {
        generation_id: `generation:model:${provider_id}`, generator: { source_kind: "MODEL", generator_id: "generator:model", generator_version: "1" },
        model: { provider_id, model_id: "model:synthetic-user", model_version: "revision:1", adapter_id: "adapter:generator", adapter_version: "1" },
      }) as never);
      expect(record.model?.provider_id).toBe(provider_id);
    }
  });

  it("retains exact frozen Exercise and Utterance references", () => {
    const e = exercise(); const u = utterance(e); const record = createSyntheticConversationalUtteranceGenerationRecordV1(authored(e, u) as never);
    expect(record.exercise).toEqual({ exercise_id: e.exercise_id, exercise_version: e.exercise_version, exercise_digest: e.exercise_digest });
    expect(record.utterance).toEqual({ utterance_id: u.utterance_id, utterance_version: u.utterance_version, utterance_digest: u.utterance_digest });
    expect(Object.isFrozen(record) && Object.isFrozen(record.exercise) && Object.isFrozen(record.utterance) && Object.isFrozen(record.generator)).toBe(true);
  });

  it("rejects Exercise/Utterance lineage mismatch", () => {
    const first = exercise(); const second = exercise("exercise:other", "scenario:other");
    expect(() => createSyntheticConversationalUtteranceGenerationRecordV1(authored(first, utterance(second)) as never)).toThrow("SYNTHETIC_UTTERANCE_GENERATION_LINEAGE_MISMATCH");
  });

  it.each([
    [{ version: 2 }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_RECORD"], [{ generation_id: "" }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_RECORD"],
    [{ generation_version: "" }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_RECORD"], [{ exercise: { ...exercise(), exercise_digest: "forged" } }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_EXERCISE"],
    [{ utterance: { ...utterance(), utterance_digest: "forged" } }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_UTTERANCE"],
    [{ generator: { source_kind: "TEACHER", generator_id: "generator:x", generator_version: "1" } }, "INVALID_SYNTHETIC_UTTERANCE_GENERATOR"],
    [{ generation_policy: { policy_id: "", policy_version: "1" } }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_POLICY"],
    [{ generated_at: "2026-08-25" }, "INVALID_SYNTHETIC_UTTERANCE_GENERATION_TIME"],
  ])("rejects malformed canonical provenance", (override, failure) => expect(() => createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, override) as never)).toThrow(failure));

  it("requires MODEL provenance and forbids it for other mechanisms", () => {
    expect(() => createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, { generator: { source_kind: "MODEL", generator_id: "generator:model", generator_version: "1" } }) as never)).toThrow("SYNTHETIC_UTTERANCE_MODEL_PROVENANCE_REQUIRED");
    expect(() => createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, { model: { provider_id: "x", model_id: "x", model_version: "1", adapter_id: "x", adapter_version: "1" } }) as never)).toThrow("SYNTHETIC_UTTERANCE_MODEL_PROVENANCE_FORBIDDEN");
  });

  it("seals deterministic identity and changes it for every bound provenance dimension", () => {
    const base = createSyntheticConversationalUtteranceGenerationRecordV1(authored() as never);
    expect(createSyntheticConversationalUtteranceGenerationRecordV1(authored() as never).generation_digest).toBe(base.generation_digest);
    for (const override of [
      { generator: { source_kind: "DETERMINISTIC", generator_id: "generator:other", generator_version: "1" } },
      { generation_policy: { policy_id: "policy:synthetic-utterance", policy_version: "2" } }, { generated_at: "2026-08-25T08:00:01.000Z" },
    ]) expect(createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, override) as never).generation_digest).not.toBe(base.generation_digest);
    const e = exercise(); const differentUtterance = utterance(e, "What ca you dot?", "utterance:typo");
    expect(createSyntheticConversationalUtteranceGenerationRecordV1(authored(e, differentUtterance) as never).generation_digest).not.toBe(base.generation_digest);
    const otherExercise = exercise("exercise:other", "scenario:other"); const otherUtterance = utterance(otherExercise, "What can PlannerAgent do?", "utterance:other");
    expect(createSyntheticConversationalUtteranceGenerationRecordV1(authored(otherExercise, otherUtterance) as never).generation_digest).not.toBe(base.generation_digest);
    const modelRecord = (model_id: string) => createSyntheticConversationalUtteranceGenerationRecordV1(authored(undefined, undefined, {
      generator: { source_kind: "MODEL", generator_id: "generator:model", generator_version: "1" },
      model: { provider_id: "provider:test", model_id, model_version: "1", adapter_id: "adapter:test", adapter_version: "1" },
    }) as never);
    expect(modelRecord("model:one").generation_digest).not.toBe(modelRecord("model:two").generation_digest);
  });

  it("treats identical output as distinct generation events", () => {
    const e = exercise(); const firstUtterance = utterance(e, "same", "utterance:one"); const secondUtterance = utterance(e, "same", "utterance:two");
    const first = createSyntheticConversationalUtteranceGenerationRecordV1(authored(e, firstUtterance, { generation_id: "generation:one" }) as never);
    const second = createSyntheticConversationalUtteranceGenerationRecordV1(authored(e, secondUtterance, { generation_id: "generation:two", generated_at: "2026-08-25T08:00:01.000Z" }) as never);
    expect(first.generation_digest).not.toBe(second.generation_digest);
  });

  it("is independent of input property order", () => {
    const value = authored(); const first = createSyntheticConversationalUtteranceGenerationRecordV1(value as never);
    const reordered = createSyntheticConversationalUtteranceGenerationRecordV1({ generated_at: value.generated_at, generation_policy: value.generation_policy, generator: value.generator, utterance: value.utterance, exercise: value.exercise, generation_version: value.generation_version, generation_id: value.generation_id, version: value.version } as never);
    expect(reordered.generation_digest).toBe(first.generation_digest);
  });

  it("adds no training, target, truth, authority, evidence, identity, or runtime semantics", () => {
    expect(Object.keys(createSyntheticConversationalUtteranceGenerationRecordV1(authored() as never))).not.toEqual(expect.arrayContaining([
      "training_eligibility", "dataset_split", "interaction", "product_focus", "response", "governed_meaning", "voice_profile", "authority",
      "operational_truth", "evidence_id", "tenant_id", "organization_id", "user_id", "conversation_id", "runtime_request_id",
    ]));
  });

  it("does not mutate source assets and requires nominal construction", () => {
    const e = exercise(); const u = utterance(e); const exerciseDigest = e.exercise_digest; const utteranceDigest = u.utterance_digest;
    createSyntheticConversationalUtteranceGenerationRecordV1(authored(e, u) as never);
    expect(e.exercise_digest).toBe(exerciseDigest); expect(u.utterance_digest).toBe(utteranceDigest);
    const plain = { ...authored(), generation_digest: "digest" };
    // @ts-expect-error Plain input lacks canonical references and the private brand.
    const branded: SyntheticConversationalUtteranceGenerationRecordV1 = plain;
    expect(branded).toBe(plain);
  });
});
