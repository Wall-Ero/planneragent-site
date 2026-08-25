import { describe, expect, it } from "vitest";
import { createSyntheticConversationalExerciseV1, type SyntheticConversationalExerciseV1 } from "../learning/synthetic.conversational.exercise.v1";
import { createSyntheticConversationalPersonaV1 } from "../learning/synthetic.conversational.persona.v1";
import { createSyntheticConversationalScenarioV1 } from "../learning/synthetic.conversational.scenario.v1";

const scenario = (changes: Record<string, unknown> = {}) => createSyntheticConversationalScenarioV1({
  version: 1, scenario_id: "scenario:supplier-commitment", scenario_version: "1", scenario_kind: "OPERATIONAL", learning_objective: "INTERPRETATION",
  truth_projection: { projection_id: "synthetic-projection:commitment", projection_version: "1" },
  facts: [{ semantic_id: "fact:commitment", value: { changed: true, ...changes } }],
  uncertainties: [{ semantic_id: "uncertainty:cause", value: { status: "UNKNOWN" } }],
  permitted_conclusions: [{ conclusion_id: "conclusion:changed", semantic_ref: "fact:commitment" }],
  prohibited_conclusions: [{ conclusion_id: "conclusion:caused-failure", semantic_ref: "uncertainty:cause" }],
  expected_boundary_posture: ["OBSERVATION_ONLY", "NO_EXECUTION"],
});

const persona = (id = "persona:planner-en", language = "en") => createSyntheticConversationalPersonaV1({
  version: 1, persona_id: id, persona_version: "1", declared_role: { label: "supply chain manager" }, language,
  language_quality_traits: ["FLUENT"], expertise: "PRACTITIONER", communication_traits: ["DIRECT"],
  terminology_traits: ["USES_DOMAIN_TERMINOLOGY"],
});

const exercise = (s = scenario(), p = persona(), id = "exercise:commitment-planner") => createSyntheticConversationalExerciseV1({
  version: 1, exercise_id: id, exercise_version: "1", scenario: s, persona: p,
});

describe("SyntheticConversationalExerciseV1", () => {
  it("composes exact immutable Scenario and Persona references", () => {
    const s = scenario(); const p = persona(); const value = exercise(s, p);
    expect(value).toMatchObject({
      version: 1, exercise_id: "exercise:commitment-planner", exercise_version: "1", purpose: "CONVERSATIONAL_LEARNING",
      scenario: { scenario_id: s.scenario_id, scenario_version: s.scenario_version, scenario_digest: s.scenario_digest },
      persona: { persona_id: p.persona_id, persona_version: p.persona_version, persona_digest: p.persona_digest },
    });
    expect(Object.isFrozen(value) && Object.isFrozen(value.scenario) && Object.isFrozen(value.persona)).toBe(true);
  });

  it("inherits objective and kind exclusively from Scenario", () => {
    const value = exercise();
    expect(value.learning_objective).toBe("INTERPRETATION");
    expect(value.scenario_kind).toBe("OPERATIONAL");
    expect(() => createSyntheticConversationalExerciseV1({ ...({ version: 1, exercise_id: "exercise:x", exercise_version: "1", scenario: scenario(), persona: persona() }), learning_objective: "REALIZATION" } as never)).toThrow("INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE");
  });

  it("adds no authority, truth, tenant, identity, or role synthesis", () => {
    const value = exercise(scenario(), createSyntheticConversationalPersonaV1({
      version: 1, persona_id: "persona:cfo", persona_version: "1", declared_role: { label: "CFO" }, language: "en",
      language_quality_traits: ["FLUENT"], expertise: "EXPERT", communication_traits: ["DIRECT"], terminology_traits: [],
    }));
    expect(value).not.toHaveProperty("authority");
    expect(value).not.toHaveProperty("production_truth");
    expect(value).not.toHaveProperty("tenant_id");
    expect(value).not.toHaveProperty("declared_role");
  });

  it("retains references only and cannot let Persona alter Scenario facts", () => {
    const s = scenario(); const p = persona(); const value = exercise(s, p);
    expect(value).not.toHaveProperty("facts");
    expect(value.scenario).not.toHaveProperty("facts");
    expect(value.persona).not.toHaveProperty("declared_role");
    expect(s.facts[0].value).toEqual({ changed: true });
  });

  it.each([
    [{ version: 2, exercise_id: "exercise:x", exercise_version: "1", scenario: scenario(), persona: persona() }, "INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE"],
    [{ version: 1, exercise_id: "", exercise_version: "1", scenario: scenario(), persona: persona() }, "INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE"],
    [{ version: 1, exercise_id: "exercise:x", exercise_version: "", scenario: scenario(), persona: persona() }, "INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE"],
    [{ version: 1, exercise_id: "exercise:x", exercise_version: "1", scenario: { ...scenario(), scenario_digest: "forged" }, persona: persona() }, "INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE_SCENARIO"],
    [{ version: 1, exercise_id: "exercise:x", exercise_version: "1", scenario: scenario(), persona: { ...persona(), persona_digest: "forged" } }, "INVALID_SYNTHETIC_CONVERSATIONAL_EXERCISE_PERSONA"],
  ])("rejects invalid identity and non-canonical inputs", (candidate, failure) => {
    expect(() => createSyntheticConversationalExerciseV1(candidate as never)).toThrow(failure);
  });

  it("produces deterministic composition identity independent of input property order", () => {
    const s = scenario(); const p = persona(); const first = exercise(s, p);
    const reordered = createSyntheticConversationalExerciseV1({ persona: p, scenario: s, exercise_version: "1", exercise_id: "exercise:commitment-planner", version: 1 });
    expect(reordered.exercise_digest).toBe(first.exercise_digest);
  });

  it("changes identity when either sealed source meaning changes", () => {
    const first = exercise();
    expect(exercise(scenario({ revised_date: "2026-08-27" }), persona()).exercise_digest).not.toBe(first.exercise_digest);
    expect(exercise(scenario(), persona("persona:planner-en", "it")).exercise_digest).not.toBe(first.exercise_digest);
  });

  it("supports one Scenario with many Personas and one Persona with many Scenarios", () => {
    const s = scenario(); const p = persona();
    const english = exercise(s, p, "exercise:en");
    const italian = exercise(s, persona("persona:planner-it", "it"), "exercise:it");
    const otherScenario = exercise(scenario({ revised_date: "2026-08-28" }), p, "exercise:other");
    expect(english.scenario.scenario_digest).toBe(italian.scenario.scenario_digest);
    expect(english.persona.persona_digest).toBe(otherScenario.persona.persona_digest);
    expect(english.exercise_digest).not.toBe(italian.exercise_digest);
  });

  it("does not mutate either source during composition", () => {
    const s = scenario(); const p = persona(); const scenarioDigest = s.scenario_digest; const personaDigest = p.persona_digest;
    exercise(s, p);
    expect(s.scenario_digest).toBe(scenarioDigest);
    expect(p.persona_digest).toBe(personaDigest);
    expect(Object.isFrozen(s) && Object.isFrozen(p)).toBe(true);
  });

  it("contains no generation, provider, eligibility, corpus, or conversation state", () => {
    expect(Object.keys(exercise())).not.toEqual(expect.arrayContaining([
      "utterance", "message", "prompt", "teacher", "provider", "model", "seed", "temperature", "training_eligibility",
      "dataset_split", "conversation_id", "turn_id", "session_id", "memory_id",
    ]));
  });

  it("requires canonical construction to obtain the branded Exercise type", () => {
    const plain = { version: 1 as const, exercise_id: "exercise:x", exercise_version: "1", scenario: {}, persona: {}, learning_objective: "INTERPRETATION" as const, scenario_kind: "OPERATIONAL" as const, purpose: "CONVERSATIONAL_LEARNING" as const, exercise_digest: "digest" };
    // @ts-expect-error Plain structural data lacks canonical references and the private brand.
    const branded: SyntheticConversationalExerciseV1 = plain;
    expect(branded).toBe(plain);
  });
});
