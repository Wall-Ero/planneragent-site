import { describe, expect, it } from "vitest";
import { CONVERSATIONAL_INTERACTIONS_V1, CONVERSATIONAL_PRODUCT_FOCUSES_V1, parseConversationalInterpretationResultV1 } from "../cognition/conversational.cognition.contracts.v1";
import { CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1 } from "../evaluation/conversational.interpretation.gold.corpus.v1";
import { buildInterpretationPilotCorpusV1, PILOT_SPLITS_V1 } from "../learning/pilot/interpretation.pilot.corpus.v1";

const normalize = (value: string) => value.toLowerCase().trim().replace(/\s+/g, " ");
const scenarioId = (item: ReturnType<typeof buildInterpretationPilotCorpusV1>["items"][number]) =>
  (item.scenario_ref as { scenario_id: string }).scenario_id;

describe("PA-INTERPRETATION-PILOT-v1", () => {
  it("builds 200 parseable governed items with exact immutable split counts", () => {
    const built = buildInterpretationPilotCorpusV1();
    expect(built.items).toHaveLength(200);
    expect(built.manifest.split_counts).toEqual({ TRAIN: 120, VALIDATION: 20, QUALIFICATION: 20, HOLDOUT: 20, ADVERSARIAL: 20 });
    for (const split of PILOT_SPLITS_V1) {
      const lines = built.jsonl[split].trimEnd().split("\n");
      expect(lines).toHaveLength(split === "TRAIN" ? 120 : 20);
      for (const line of lines) {
        const item = JSON.parse(line) as (typeof built.items)[number];
        expect(parseConversationalInterpretationResultV1(item.target)).toEqual(item.target);
        expect(item.eligibility_decision_ref).toMatchObject({ decision_id: expect.stringContaining("eligibility-") });
      }
    }
  });

  it("isolates all 40 scenario families and rejects identity or benchmark leakage", () => {
    const built = buildInterpretationPilotCorpusV1();
    const familySplits = new Map<string, Set<string>>();
    for (const item of built.items) {
      const splits = familySplits.get(scenarioId(item)) ?? new Set<string>();
      splits.add(item.split);
      familySplits.set(scenarioId(item), splits);
    }
    expect(familySplits.size).toBe(40);
    expect([...familySplits.values()].every((splits) => splits.size === 1)).toBe(true);
    expect(Object.values(built.manifest.scenario_family_assignments).filter((split) => split === "TRAIN")).toHaveLength(24);
    for (const split of ["VALIDATION", "QUALIFICATION", "HOLDOUT", "ADVERSARIAL"] as const) expect(Object.values(built.manifest.scenario_family_assignments).filter((value) => value === split)).toHaveLength(4);
    expect(new Set(built.items.map((item) => item.record_id)).size).toBe(200);
    expect(new Set(built.items.map((item) => item.record_digest)).size).toBe(200);
    expect(new Set(built.items.map((item) => (item.utterance_ref as { utterance_digest: string }).utterance_digest)).size).toBe(200);
    const goldExact = new Set(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.map((item) => item.message));
    const goldNormalized = new Set(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.map((item) => normalize(item.message)));
    expect(built.items.some((item) => goldExact.has(item.input_text))).toBe(false);
    expect(built.items.some((item) => goldNormalized.has(normalize(item.input_text)))).toBe(false);
  });

  it("covers the canonical taxonomy and required linguistic boundaries", () => {
    const built = buildInterpretationPilotCorpusV1();
    expect(Object.keys(built.manifest.interaction_distribution).sort()).toEqual([...CONVERSATIONAL_INTERACTIONS_V1].sort());
    expect(Object.keys(built.manifest.product_focus_distribution).sort()).toEqual([...CONVERSATIONAL_PRODUCT_FOCUSES_V1].sort());
    expect(built.manifest.language_distribution).toMatchObject({ en: expect.any(Number), it: expect.any(Number), mixed: expect.any(Number) });
    expect(built.manifest.language_distribution.en).toBeGreaterThan(0);
    expect(built.manifest.language_distribution.it).toBeGreaterThan(0);
    expect(built.manifest.language_distribution.mixed).toBeGreaterThan(0);
    expect(built.manifest.critical_boundary_counts).toMatchObject({ DATA: expect.any(Number), EXECUTION: expect.any(Number), PROTECTED: expect.any(Number) });
    expect(Object.values(built.manifest.critical_boundary_counts).every((count) => count > 0)).toBe(true);
    expect(built.manifest.audience_declaration_count).toBeGreaterThan(0);
    expect(built.manifest.ambiguity_count).toBeGreaterThan(0);
    expect(built.items.some((item) => /\b(?:PO|SKU|MAT|CMP)-?\d+/i.test(item.input_text))).toBe(true);
    expect(built.items.some((item) => /\b(?:wht|realy|suppy|sliping|chnging|rescedule|ths|qsto|prodution)\b/i.test(item.input_text))).toBe(true);
  });

  it("is byte-identical and digest-identical across builds", () => {
    const first = buildInterpretationPilotCorpusV1();
    const second = buildInterpretationPilotCorpusV1();
    expect(second.items.map(({ record_id, record_digest, split }) => ({ record_id, record_digest, split }))).toEqual(first.items.map(({ record_id, record_digest, split }) => ({ record_id, record_digest, split })));
    expect(second.jsonl).toEqual(first.jsonl);
    expect(second.manifest.aggregate_corpus_digest).toBe(first.manifest.aggregate_corpus_digest);
    expect(second.manifest.split_digests).toEqual(first.manifest.split_digests);
  });
});
