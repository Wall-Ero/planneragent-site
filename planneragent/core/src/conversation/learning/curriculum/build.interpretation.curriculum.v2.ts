import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildInterpretationCurriculumV2, CURRICULUM_V2_SPLITS } from "./interpretation.curriculum.v2";

async function main(): Promise<void> {
  const output=resolve(process.cwd(),"training-artifacts","PA-INTERPRETATION-CURRICULUM-v2"); const built=buildInterpretationCurriculumV2(); await mkdir(output,{recursive:true});
  for(const split of CURRICULUM_V2_SPLITS) await writeFile(resolve(output,`${split.toLowerCase()}.jsonl`),built.jsonl[split],"utf8");
  await writeFile(resolve(output,"manifest.json"),`${JSON.stringify(built.manifest,null,2)}\n`,"utf8");
  process.stdout.write(`${JSON.stringify({output,total:built.manifest.total_records,splits:built.manifest.split_counts,families:built.manifest.family_counts,train_interactions:built.manifest.split_interaction_distribution.TRAIN,evaluation_interactions:Object.fromEntries(CURRICULUM_V2_SPLITS.filter((split)=>split!=="TRAIN").map((split)=>[split,built.manifest.split_interaction_distribution[split]])),languages:built.manifest.language_distribution,product_focus:built.manifest.product_focus_counts,sources:built.manifest.source_distribution,robustness:built.manifest.robustness_coverage,critical:built.manifest.critical_boundary_counts,corpus_digest:built.manifest.aggregate_corpus_digest},null,2)}\n`);
}
main().catch((error)=>{process.stderr.write(`${error instanceof Error?error.stack:error}\n`);process.exitCode=1;});
