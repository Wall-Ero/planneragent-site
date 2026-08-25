import { describe, expect, it } from "vitest";
import { createConversationalTrainingSourceEligibilityDecisionV1, isConversationalTrainingSourceEligibleV1, type ConversationalTrainingSourceEligibilityDecisionV1, type ConversationalTrainingSourceIdentityV1 } from "../learning/conversational.training.source.eligibility.v1";

const digest = `eligibility-evidence:sha256:${"a".repeat(64)}`;
const modelSource = (changes: Record<string, unknown> = {}): ConversationalTrainingSourceIdentityV1 => ({
  source_kind: "MODEL", generator_id: "generator:model", generator_version: "1",
  model: { provider_id: "test-provider", model_id: "test-model", model_version: "v1", adapter_id: "test-adapter", adapter_version: "v1", ...changes },
});
const authoredSource: ConversationalTrainingSourceIdentityV1 = { source_kind: "PLANNERAGENT_AUTHORED", generator_id: "generator:authored", generator_version: "1" };
const input = (eligibility: "ALLOWED" | "DENIED" | "UNKNOWN" = "ALLOWED", changes: Record<string, unknown> = {}) => ({
  version: 1, decision_id: "decision:test-model:supervised", decision_version: "1", source: modelSource(), learning_use: "SUPERVISED_TRAINING_MATERIAL", eligibility,
  ...(eligibility === "UNKNOWN" ? {} : { evidence: { evidence_id: "eligibility-evidence-001", evidence_version: "v1", evidence_digest: digest } }),
  decision_policy: { policy_id: "policy:learning-source-review", policy_version: "1" }, effective_from: "2026-08-25T00:00:00.000Z", effective_until: "2026-09-25T00:00:00.000Z", ...changes,
});

describe("ConversationalTrainingSourceEligibilityDecisionV1", () => {
  it.each(["ALLOWED", "DENIED", "UNKNOWN"] as const)("accepts an immutable %s decision", (eligibility) => {
    const decision = createConversationalTrainingSourceEligibilityDecisionV1(input(eligibility) as never);
    expect(decision.eligibility).toBe(eligibility);
    expect(Object.isFrozen(decision) && Object.isFrozen(decision.source) && Object.isFrozen(decision.decision_policy)).toBe(true);
  });

  it("represents every source mechanism without implicit trust", () => {
    for (const source of [authoredSource, { source_kind: "DETERMINISTIC", generator_id: "generator:typo", generator_version: "1" }, modelSource({ provider_id: "openai" }), modelSource({ provider_id: "planneragent-local" })]) {
      const decision = createConversationalTrainingSourceEligibilityDecisionV1(input("UNKNOWN", { source, decision_id: `decision:${source.source_kind}` }) as never);
      expect(isConversationalTrainingSourceEligibleV1(decision, source as ConversationalTrainingSourceIdentityV1, "SUPERVISED_TRAINING_MATERIAL", "2026-08-26T00:00:00.000Z")).toBe(false);
    }
  });

  it("requires exact model provenance only for MODEL sources", () => {
    expect(() => createConversationalTrainingSourceEligibilityDecisionV1(input("UNKNOWN", { source: { source_kind: "MODEL", generator_id: "generator:x", generator_version: "1" } }) as never)).toThrow("INVALID_CONVERSATIONAL_TRAINING_SOURCE_IDENTITY");
    expect(() => createConversationalTrainingSourceEligibilityDecisionV1(input("UNKNOWN", { source: { ...authoredSource, model: modelSource().model } }) as never)).toThrow("INVALID_CONVERSATIONAL_TRAINING_SOURCE_IDENTITY");
  });

  it("requires evidence for ALLOWED and DENIED while permitting evidence-free UNKNOWN", () => {
    for (const state of ["ALLOWED", "DENIED"] as const) expect(() => createConversationalTrainingSourceEligibilityDecisionV1(input(state, { evidence: undefined }) as never)).toThrow("CONVERSATIONAL_TRAINING_ELIGIBILITY_EVIDENCE_REQUIRED");
    expect(createConversationalTrainingSourceEligibilityDecisionV1(input("UNKNOWN") as never)).not.toHaveProperty("evidence");
    expect(createConversationalTrainingSourceEligibilityDecisionV1(input("UNKNOWN", { evidence: { evidence_id: "evidence:review", evidence_version: "1", evidence_digest: digest } }) as never).evidence).toBeDefined();
  });

  it.each([
    [{ version: 2 }, "INVALID_CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_DECISION"], [{ source: { source_kind: "OTHER", generator_id: "x", generator_version: "1" } }, "INVALID_CONVERSATIONAL_TRAINING_SOURCE_IDENTITY"],
    [{ learning_use: "BENCHMARK" }, "INVALID_CONVERSATIONAL_TRAINING_LEARNING_USE"], [{ eligibility: "APPROVED" }, "INVALID_CONVERSATIONAL_TRAINING_SOURCE_ELIGIBILITY_STATE"],
    [{ evidence: { evidence_id: "evidence:x", evidence_version: "1", evidence_digest: "bad" } }, "INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_EVIDENCE"],
    [{ decision_policy: { policy_id: "", policy_version: "1" } }, "INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_DECISION_POLICY"],
    [{ effective_from: "2026-08-25" }, "INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_EFFECTIVE_TIME"],
    [{ effective_until: "2026-08-24T00:00:00.000Z" }, "INVALID_CONVERSATIONAL_TRAINING_ELIGIBILITY_INTERVAL"],
  ])("rejects malformed governed decisions", (change, failure) => expect(() => createConversationalTrainingSourceEligibilityDecisionV1(input("ALLOWED", change) as never)).toThrow(failure));

  it("makes every semantic decision dimension digest-bearing", () => {
    const base = createConversationalTrainingSourceEligibilityDecisionV1(input() as never);
    expect(createConversationalTrainingSourceEligibilityDecisionV1(input() as never).decision_digest).toBe(base.decision_digest);
    const changes = [
      { source: modelSource({ model_id: "neighbor-model" }) }, { source: modelSource({ adapter_id: "broker-adapter" }) }, { eligibility: "DENIED" },
      { learning_use: "NEGATIVE_TRAINING_MATERIAL" }, { evidence: { evidence_id: "evidence:other", evidence_version: "1", evidence_digest: digest } },
      { effective_until: "2026-10-25T00:00:00.000Z" },
    ];
    for (const change of changes) expect(createConversationalTrainingSourceEligibilityDecisionV1(input("ALLOWED", change) as never).decision_digest).not.toBe(base.decision_digest);
  });

  it("is independent of input property insertion order", () => {
    const value = input();
    const reordered = createConversationalTrainingSourceEligibilityDecisionV1({
      effective_until: value.effective_until, effective_from: value.effective_from, decision_policy: value.decision_policy,
      evidence: value.evidence, eligibility: value.eligibility, learning_use: value.learning_use, source: value.source,
      decision_version: value.decision_version, decision_id: value.decision_id, version: value.version,
    } as never);
    expect(reordered.decision_digest).toBe(createConversationalTrainingSourceEligibilityDecisionV1(value as never).decision_digest);
  });

  it("fails closed for UNKNOWN and DENIED under an exact active request", () => {
    for (const state of ["UNKNOWN", "DENIED"] as const) {
      const decision = createConversationalTrainingSourceEligibilityDecisionV1(input(state) as never);
      expect(isConversationalTrainingSourceEligibleV1(decision, modelSource(), "SUPERVISED_TRAINING_MATERIAL", "2026-08-26T00:00:00.000Z")).toBe(false);
    }
  });

  it("allows only exact source, use, and effective-window matches", () => {
    const decision = createConversationalTrainingSourceEligibilityDecisionV1(input() as never);
    expect(isConversationalTrainingSourceEligibleV1(decision, modelSource(), "SUPERVISED_TRAINING_MATERIAL", "2026-08-25T00:00:00.000Z")).toBe(true);
    for (const source of [modelSource({ model_id: "neighbor" }), modelSource({ model_version: "v2" }), modelSource({ adapter_id: "broker" }), { ...modelSource(), generator_version: "2" }]) {
      expect(isConversationalTrainingSourceEligibleV1(decision, source, "SUPERVISED_TRAINING_MATERIAL", "2026-08-26T00:00:00.000Z")).toBe(false);
    }
    expect(isConversationalTrainingSourceEligibleV1(decision, modelSource(), "NEGATIVE_TRAINING_MATERIAL", "2026-08-26T00:00:00.000Z")).toBe(false);
    expect(isConversationalTrainingSourceEligibleV1(decision, modelSource(), "SUPERVISED_TRAINING_MATERIAL", "2026-08-24T23:59:59.999Z")).toBe(false);
    expect(isConversationalTrainingSourceEligibleV1(decision, modelSource(), "SUPERVISED_TRAINING_MATERIAL", "2026-09-25T00:00:00.000Z")).toBe(false);
  });

  it("keeps expired historical decisions valid but currently ineffective", () => {
    const decision = createConversationalTrainingSourceEligibilityDecisionV1(input("ALLOWED", { effective_from: "2025-01-01T00:00:00.000Z", effective_until: "2025-02-01T00:00:00.000Z" }) as never);
    expect(decision.decision_digest).toMatch(/^conversational-training-source-eligibility:sha256:/);
    expect(isConversationalTrainingSourceEligibleV1(decision, modelSource(), "SUPERVISED_TRAINING_MATERIAL", "2026-08-25T00:00:00.000Z")).toBe(false);
  });

  it("contains no text, quality, runtime, economics, production identity, or admission semantics", () => {
    expect(Object.keys(createConversationalTrainingSourceEligibilityDecisionV1(input() as never))).not.toEqual(expect.arrayContaining([
      "text", "semantic_fidelity", "verified", "training_admitted", "runtime_qualified", "production_allowed", "cost", "economic_class",
      "tenant_id", "organization_id", "user_id", "generation_id", "utterance_id",
    ]));
  });

  it("requires canonical construction for the branded decision", () => {
    const plain = { ...input(), decision_digest: "digest" };
    // @ts-expect-error Plain input lacks the private nominal brand.
    const branded: ConversationalTrainingSourceEligibilityDecisionV1 = plain;
    expect(branded).toBe(plain);
  });
});
