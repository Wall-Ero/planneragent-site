import { describe, expect, it } from "vitest";
import {
  createSyntheticConversationalScenarioV1,
  type CreateSyntheticConversationalScenarioInputV1,
} from "../learning/synthetic.conversational.scenario.v1";

const input = (): CreateSyntheticConversationalScenarioInputV1 => ({
  version: 1,
  scenario_id: "scenario:supplier-commitment-change",
  scenario_version: "1",
  scenario_kind: "OPERATIONAL",
  learning_objective: "INTERPRETATION",
  truth_projection: { projection_id: "synthetic-projection:supplier-commitment", projection_version: "1" },
  facts: [{ semantic_id: "fact:commitment-change", value: { original_date: "2026-08-24", revised_date: "2026-08-26" } }],
  uncertainties: [{ semantic_id: "uncertainty:cause", value: { status: "UNKNOWN" } }],
  permitted_conclusions: [{ conclusion_id: "conclusion:commitment-changed", semantic_ref: "fact:commitment-change" }],
  prohibited_conclusions: [{ conclusion_id: "conclusion:supplier-caused-failure", semantic_ref: "uncertainty:cause" }],
  expected_boundary_posture: ["OBSERVATION_ONLY", "NO_EXECUTION"],
});

describe("SyntheticConversationalScenarioV1", () => {
  it("constructs a deeply immutable scenario with fixed isolation invariants", () => {
    const scenario = createSyntheticConversationalScenarioV1(input());
    expect(scenario).toMatchObject({ source: "SYNTHETIC", authority: "TRAINING_ONLY", production_truth: false, tenant_binding: "NONE", operational_ingress: "FORBIDDEN" });
    expect(scenario.facts[0].value).toEqual({ original_date: "2026-08-24", revised_date: "2026-08-26" });
    expect(scenario.uncertainties).toEqual([{ semantic_id: "uncertainty:cause", value: { status: "UNKNOWN" } }]);
    expect(Object.isFrozen(scenario) && Object.isFrozen(scenario.facts) && Object.isFrozen(scenario.facts[0]) && Object.isFrozen(scenario.facts[0].value)).toBe(true);
  });

  it("owns isolation markers and rejects caller attempts to weaken them or add production identity", () => {
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), production_truth: true })).toThrow("INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO");
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), tenant_binding: "tenant:1" })).toThrow("INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO");
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), facts: [{ semantic_id: "fact:x", value: { tenant_id: "tenant:1" } }] })).toThrow("INVALID_SYNTHETIC_SCENARIO_SEMANTICS");
  });

  it.each([
    [{ ...input(), scenario_id: "" }, "INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO"],
    [{ ...input(), scenario_version: "" }, "INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO"],
    [{ ...input(), scenario_kind: "ITALIAN" }, "INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO_KIND"],
    [{ ...input(), learning_objective: "MULTI_TURN" }, "INVALID_SYNTHETIC_CONVERSATIONAL_LEARNING_OBJECTIVE"],
    [{ ...input(), truth_projection: { projection_id: "", projection_version: "1" } }, "INVALID_SYNTHETIC_SCENARIO_TRUTH_PROJECTION"],
    [{ ...input(), expected_boundary_posture: ["UNRESTRICTED"] }, "INVALID_SYNTHETIC_SCENARIO_BOUNDARY_POSTURE"],
  ])("rejects invalid identity, taxonomy, projection, and posture", (candidate, error) => {
    expect(() => createSyntheticConversationalScenarioV1(candidate)).toThrow(error);
  });

  it("rejects duplicate semantic IDs, duplicate conclusion IDs, and permitted/prohibited collisions", () => {
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), uncertainties: [{ semantic_id: "fact:commitment-change", value: null }] })).toThrow("DUPLICATE_SYNTHETIC_SCENARIO_SEMANTIC_ID");
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), permitted_conclusions: [{ conclusion_id: "conclusion:x", semantic_ref: "fact:commitment-change" }, { conclusion_id: "conclusion:x", semantic_ref: "fact:commitment-change" }] })).toThrow("INVALID_SYNTHETIC_SCENARIO_SEMANTICS");
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), prohibited_conclusions: [{ conclusion_id: "conclusion:commitment-changed", semantic_ref: "uncertainty:cause" }] })).toThrow("SYNTHETIC_SCENARIO_CONCLUSION_COLLISION");
  });

  it("seals deterministic semantic identity independent of object property order", () => {
    const first = createSyntheticConversationalScenarioV1(input());
    const reordered = { ...input(), facts: [{ semantic_id: "fact:commitment-change", value: { revised_date: "2026-08-26", original_date: "2026-08-24" } }] };
    const second = createSyntheticConversationalScenarioV1(reordered);
    expect(second.scenario_digest).toBe(first.scenario_digest);
    expect(createSyntheticConversationalScenarioV1({ ...input(), scenario_version: "2" }).scenario_digest).not.toBe(first.scenario_digest);
    expect(createSyntheticConversationalScenarioV1({ ...input(), uncertainties: [{ semantic_id: "uncertainty:cause", value: { status: "KNOWN" } }] }).scenario_digest).not.toBe(first.scenario_digest);
  });

  it("rejects unknown fields and malformed JSON-safe values", () => {
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), display_name: "mutable" })).toThrow("INVALID_SYNTHETIC_CONVERSATIONAL_SCENARIO");
    expect(() => createSyntheticConversationalScenarioV1({ ...input(), facts: [{ semantic_id: "fact:x", value: Number.NaN }] })).toThrow("INVALID_SYNTHETIC_SCENARIO_SEMANTICS");
  });
});
