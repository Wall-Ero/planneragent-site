import { describe, expect, it } from "vitest";
import config from "../../../training/interpretation/gcc4k/experiment.config.json";
import notebook from "../../../training/interpretation/gcc4k/gcc4k_colab.ipynb?raw";
import training from "../../../training/interpretation/gcc4k/train_targeted_student_v02.py?raw";
import { hasOnlyPosixZipEntries } from "../../../training/interpretation/gcc4k/prepare_gcc4k_bundle";

describe("GCC-4K targeted student v0.2 bundle",()=>{
  it("freezes the same base, revision, instruction, and LoRA experiment",()=>{
    expect(config).toMatchObject({candidate_id:"PA-INTERPRETATION-STUDENT-v0.2",base_model:"Qwen/Qwen3-0.6B-Base",base_revision:"da87bfb608c14b7cf20ba1ce41287e8de496c0cd",transformers_version:"4.51.3",epochs:3,learning_rate:.0002,batch_size:2,gradient_accumulation_steps:4,max_sequence_length:384,lora_rank:8,lora_alpha:16,lora_dropout:.05,seed:4701});
  });
  it("uses TRAIN only for gradients and validation only for monitoring",()=>{
    expect(training).toContain('train_dataset=TrainingDataset(tokenizer,load_jsonl(CORPUS/"train.jsonl"))'); expect(training).toContain('eval_dataset=TrainingDataset(tokenizer,load_jsonl(CORPUS/"validation.jsonl"))'); expect(training).not.toMatch(/train_dataset=TrainingDataset\([^\n]*(?:qualification|holdout|adversarial|historical|gold)/); expect(training).toContain('label_names=["labels"]'); expect(training).toContain("labels=[-100]");
  });
  it("performs compatibility preflight before model loading",()=>{
    expect(training.indexOf("preflight()")).toBeLessThan(training.indexOf("load_base()")); expect(training).toContain('transformers.__version__!="4.51.3"'); expect(training).toContain("INCOMPATIBLE_TORCHAO_PRESENT"); expect(JSON.stringify(notebook)).toContain("pip','uninstall','-y','torchao"); expect(JSON.stringify(notebook)).toContain("transformers==4.51.3");
  });
  it("admits only safe POSIX ZIP entry names",()=>{
    expect(hasOnlyPosixZipEntries(["corpus/train.jsonl","scripts/train_targeted_student_v02.py"])).toBe(true); expect(hasOnlyPosixZipEntries(["corpus\\train.jsonl"])).toBe(false); expect(hasOnlyPosixZipEntries(["../secret"])).toBe(false);
  });
});
