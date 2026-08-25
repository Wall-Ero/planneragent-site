import { describe, expect, it } from "vitest";
import { parseConversationalInterpretationResultV1 } from "../cognition/conversational.cognition.contracts.v1";
import { buildGoldExportV1, GCC4J_EXPECTED_CORPUS_DIGEST } from "../../../training/interpretation/gcc4j/prepare_gcc4j_bundle";
import config from "../../../training/interpretation/gcc4j/experiment.config.json";
import training from "../../../training/interpretation/gcc4j/train_first_local_student.py?raw";
import evaluation from "../../../training/interpretation/gcc4j/evaluate_interpretation_student.py?raw";
import verifier from "../../../training/interpretation/gcc4j/verify_gcc4j_result.ts?raw";

describe("GCC-4J portable training bundle", () => {
  it("exports deterministic parser-valid GOLD-39 evaluation material", () => {
    const first = buildGoldExportV1();
    expect(buildGoldExportV1()).toBe(first);
    const lines = first.trimEnd().split("\n");
    expect(lines).toHaveLength(39);
    for (const line of lines) expect(parseConversationalInterpretationResultV1((JSON.parse(line) as { target: unknown }).target)).toBeDefined();
  });

  it("pins the immutable corpus gate and exact complete target representation", () => {
    expect(config.corpus_digest).toBe(GCC4J_EXPECTED_CORPUS_DIGEST);
    expect(config.expected_splits).toEqual({ train: 120, validation: 20, qualification: 20, holdout: 20, adversarial: 20, gold: 39 });
    expect(config.instruction).toBe("Return only a PlannerAgent ConversationalInterpretationResultV1 JSON object matching the required contract.");
  });

  it("keeps gradient and unseen evaluation loaders physically separated", () => {
    expect(training).toContain('train_dataset=TrainingDataset(tokenizer, load_jsonl(CORPUS / "train.jsonl"))');
    expect(training).toContain('["validation", "qualification", "holdout", "adversarial", "gold"]');
    expect(training).toContain('eval_dataset=TrainingDataset(tokenizer, load_jsonl(CORPUS / "validation.jsonl"))');
    expect(training).not.toMatch(/train_dataset=TrainingDataset\([^\n]*(?:qualification|holdout|adversarial|gold)/);
    expect(evaluation).toContain("do_sample=False");
  });

  it("contains deterministic fixture metrics and portable hash verification seams", () => {
    expect(evaluation).toContain('"exact_target_match": exact');
    expect(evaluation).toContain('"authority_invariant_violations"');
    expect(evaluation).toContain('"PROTECTED_DISCLOSURE"');
    expect(verifier).toContain("GCC4J_ARTIFACT_HASH_INVALID");
    expect(verifier).toContain("TRAINED_CANDIDATE");
  });
});
