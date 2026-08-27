import { createHash } from "node:crypto";

export const GCC4P_RECOVERY_ZIP_SHA256="7f2e026e71131ac4a1c6cf09c02066655fc40b213bbb9034dce673d8c5fc10b3";
export const GCC4P_CORPUS_DIGEST="sha256:b5db5a57c5e0f1cc041e5bd138cd53e06359f349a8d7f4a5ec36018c985d64ef";
export const GCC4P_TRAIN_RUNTIME_REQUIRED=["corpus/manifest.json","corpus/oracle.audit.json","corpus/leakage.audit.json","corpus/train.jsonl","corpus/validation.jsonl","scripts/train_targeted_student_v04.py","scripts/evaluate_interpretation_student_v04.py","scripts/gcc4p_recovery.py","scripts/experiment.config.json","scripts/lost-run.evidence.json"] as const;
export const GCC4P_EVALUATE_RUNTIME_REQUIRED=["corpus/manifest.json","corpus/oracle.audit.json","corpus/leakage.audit.json","corpus/validation.jsonl","corpus/qualification.jsonl","corpus/holdout.jsonl","corpus/adversarial.jsonl","historical/validation.jsonl","historical/qualification.jsonl","historical/holdout.jsonl","historical/adversarial.jsonl","historical/gold.jsonl","ood/benchmark.jsonl","ood/manifest.json","scripts/train_targeted_student_v04.py","scripts/evaluate_interpretation_student_v04.py","scripts/gcc4p_recovery.py","scripts/experiment.config.json","scripts/lost-run.evidence.json","baselines/v02.evidence.review.json","baselines/v03.generalization.audit.json","policy/declared.role.fidelity.policy.json"] as const;
export const GCC4P_EXPLODED_REQUIRED=["SHA256SUMS.txt",...new Set([...GCC4P_TRAIN_RUNTIME_REQUIRED,...GCC4P_EVALUATE_RUNTIME_REQUIRED])] as const;
export type Gcc4pKaggleInputV1={mode:"EXPLODED_KAGGLE_DATASET";root:string;outer_zip_digest:"NOT_APPLICABLE_KAGGLE_EXPLODED_INPUT"}|{mode:"RECOVERY_ZIP";root:string;outer_zip_digest:string};
export type Gcc4pAdapterCandidateV1={path:string;sha256:string};

export function safeGcc4pPayloadPathV1(value:string){return value.length>0&&!value.includes("\\")&&!value.startsWith("/")&&!/^[A-Za-z]:/.test(value)&&!value.split("/").includes("..");}
export function selectGcc4pKaggleInputV1(explodedRoots:string[],zipPaths:string[]):Gcc4pKaggleInputV1{
  if(explodedRoots.length>1)throw new Error("MULTIPLE_GCC4P_EXPLODED_INPUTS");
  if(explodedRoots.length===1)return {mode:"EXPLODED_KAGGLE_DATASET",root:explodedRoots[0],outer_zip_digest:"NOT_APPLICABLE_KAGGLE_EXPLODED_INPUT"};
  if(zipPaths.length!==1)throw new Error(zipPaths.length===0?"GCC4P_INPUT_NOT_FOUND":"MULTIPLE_GCC4P_ZIP_INPUTS");
  return {mode:"RECOVERY_ZIP",root:zipPaths[0],outer_zip_digest:GCC4P_RECOVERY_ZIP_SHA256};
}
export function verifyGcc4pPayloadV1(entries:ReadonlyMap<string,Uint8Array>,sums:string,corpusDigest:string){
  if(corpusDigest!==GCC4P_CORPUS_DIGEST)throw new Error("GCC4P_CORPUS_DIGEST_MISMATCH");
  let verified=0;
  for(const line of sums.split(/\r?\n/).filter(Boolean)){const match=/^([0-9a-f]{64})  (.+)$/.exec(line);if(!match||!safeGcc4pPayloadPathV1(match[2]))throw new Error("UNSAFE_GCC4P_PAYLOAD_PATH");const bytes=entries.get(match[2]);if(!bytes)throw new Error("GCC4P_PAYLOAD_MISSING");if(createHash("sha256").update(bytes).digest("hex")!==match[1])throw new Error("GCC4P_PAYLOAD_HASH_MISMATCH");verified++;}
  for(const required of GCC4P_EXPLODED_REQUIRED)if(required!=="SHA256SUMS.txt"&&!entries.has(required))throw new Error("GCC4P_REQUIRED_INPUT_MISSING");
  return verified;
}
export function selectGcc4pManifestBoundAdapterV1(manifestPaths:string[],manifestAdapterSha256:string,candidates:Gcc4pAdapterCandidateV1[]){
  if(manifestPaths.length===0)throw new Error("TRAIN_RUN_MANIFEST_NOT_FOUND");
  if(manifestPaths.length!==1)throw new Error("MULTIPLE_TRAIN_RUN_MANIFESTS");
  const manifestPath=manifestPaths[0],directory=manifestPath.replace(/[/\\][^/\\]+$/,"");
  const matching=candidates.filter(candidate=>candidate.sha256===manifestAdapterSha256);
  if(matching.length===0)throw new Error("PRESERVED_V04_ADAPTER_NOT_FOUND");
  const siblings=matching.filter(candidate=>candidate.path.replace(/[/\\][^/\\]+$/,"")===directory);
  if(siblings.length>1)throw new Error("MULTIPLE_MANIFEST_SIBLING_ADAPTERS");
  const selected=siblings[0]??[...matching].sort((left,right)=>left.path<right.path?-1:left.path>right.path?1:0)[0];
  return {adapter_candidate_count:candidates.length,adapter_matching_count:matching.length,adapter_selected_path:selected.path,adapter_input_sha256:selected.sha256};
}
