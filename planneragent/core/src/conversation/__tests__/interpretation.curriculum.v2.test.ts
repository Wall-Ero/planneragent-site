import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { CONVERSATIONAL_INTERACTIONS_V1, CONVERSATIONAL_PRODUCT_FOCUSES_V1, parseConversationalInterpretationResultV1 } from "../cognition/conversational.cognition.contracts.v1";
import { buildInterpretationCurriculumV2, CURRICULUM_V2_SPLITS } from "../learning/curriculum/interpretation.curriculum.v2";

const normalize=(value:string)=>value.toLowerCase().trim().replace(/\s+/g," ");
const sha=(value:string)=>createHash("sha256").update(value).digest("hex");
describe("PA-INTERPRETATION-CURRICULUM-v2",()=>{
  let built: ReturnType<typeof buildInterpretationCurriculumV2>;
  beforeAll(()=>{
    let first: ReturnType<typeof buildInterpretationCurriculumV2>|undefined=buildInterpretationCurriculumV2(); const splitHashes=Object.fromEntries(CURRICULUM_V2_SPLITS.map((split)=>[split,sha(first!.jsonl[split])])); const corpusDigest=first.manifest.aggregate_corpus_digest; const identityDigest=sha(JSON.stringify(first.items.map((item)=>[item.record_id,item.record_digest,item.split]))); first=undefined;
    built=buildInterpretationCurriculumV2(); for(const split of CURRICULUM_V2_SPLITS)expect(sha(built.jsonl[split])).toBe(splitHashes[split]); expect(built.manifest.aggregate_corpus_digest).toBe(corpusDigest); expect(sha(JSON.stringify(built.items.map((item)=>[item.record_id,item.record_digest,item.split])))).toBe(identityDigest);
  },60000);
  it("builds the exact governed corpus, split, family, and TRAIN distribution",()=>{
    expect(built.items).toHaveLength(10000); expect(built.manifest.split_counts).toEqual({TRAIN:9000,VALIDATION:500,QUALIFICATION:150,HOLDOUT:150,ADVERSARIAL:200}); expect(built.manifest.family_counts).toEqual({TRAIN:1800,VALIDATION:100,QUALIFICATION:30,HOLDOUT:30,ADVERSARIAL:40,total:2000});
    expect(built.manifest.split_interaction_distribution.TRAIN).toEqual({AUDIENCE_DECLARATION:1400,PRODUCT_QUESTION:900,OPERATIONAL_DESCRIPTION:700,CONVERSATIONAL_CONTINUITY:400,DATA_INTRODUCTION:600,EXECUTION_REQUEST:1400,PROTECTED_DISCLOSURE:1600,UNRELATED:900,AMBIGUOUS:1100});
    for(const split of CURRICULUM_V2_SPLITS) expect(built.jsonl[split].trimEnd().split("\n")).toHaveLength(built.manifest.split_counts[split]);
  });
  it("has no identity, text, normalized, historical, family, or high-Jaccard leakage",()=>{
    expect(new Set(built.items.map((item)=>item.record_id)).size).toBe(10000); expect(new Set(built.items.map((item)=>item.input_text)).size).toBe(10000); expect(new Set(built.items.map((item)=>normalize(item.input_text))).size).toBe(10000); expect(new Set(built.items.map((item)=>(item.utterance_ref as {utterance_digest:string}).utterance_digest)).size).toBe(10000); expect(Object.keys(built.manifest.family_assignments)).toHaveLength(2000); expect(built.manifest.historical_collision_result).toEqual({exact:0,normalized:0}); expect(built.manifest.near_duplicate_collision_result).toEqual({threshold:.9,count:0});
  });
  it("covers all canonical targets, languages, boundaries, contrastive neighborhoods, and governed provenance",()=>{
    expect(Object.keys(built.manifest.interaction_distribution).sort()).toEqual([...CONVERSATIONAL_INTERACTIONS_V1].sort()); expect(Object.keys(built.manifest.product_focus_counts).sort()).toEqual([...CONVERSATIONAL_PRODUCT_FOCUSES_V1].sort()); expect(built.manifest.language_distribution).toEqual({en:6500,it:3000,mixed:500}); expect(built.manifest.contrastive_neighborhoods).toHaveLength(8); expect(Object.values(built.manifest.critical_boundary_counts).every((count)=>count>0)).toBe(true); expect(built.manifest.source_distribution).toEqual({DETERMINISTIC:10000});
    for(const item of built.items){expect(parseConversationalInterpretationResultV1(item.target)).toEqual(item.target); expect(item.source_kind).toBe("DETERMINISTIC"); expect((item.eligibility_decision_ref as {decision_id:string}).decision_id).toBe("pa-int-curriculum-v2-eligibility-deterministic");}
  });
  it("retains the two-build reproducibility proof established by setup",()=>{expect(built.manifest.aggregate_corpus_digest).toMatch(/^sha256:[0-9a-f]{64}$/);});
});
