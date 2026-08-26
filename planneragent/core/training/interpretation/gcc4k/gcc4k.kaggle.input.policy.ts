import { createHash } from "node:crypto";

export const GCC4K_RECOVERY_ZIP_SHA256="ab13d4b3bc7c6d19b8f83f0fc5e764687dde8acdc29239ff8d4782750e80205c";
export const GCC4K_CORPUS_DIGEST="sha256:bd1b19fc6733cca6622051e30ac03dc3cbac3a602997894c7b4a1733467f3619";
export const GCC4K_EXPLODED_REQUIRED=["SHA256SUMS.txt","corpus/manifest.json","corpus/train.jsonl","corpus/validation.jsonl","corpus/qualification.jsonl","corpus/holdout.jsonl","corpus/adversarial.jsonl","scripts/train_targeted_student_v02.py","scripts/gcc4k_recovery.py","scripts/experiment.config.json","v01/adapter/adapter_model.safetensors"] as const;
export type Gcc4kKaggleInputV1={mode:"EXPLODED_KAGGLE_DATASET";root:string;outer_zip_digest:"NOT_APPLICABLE_KAGGLE_EXPLODED_INPUT"}|{mode:"RECOVERY_ZIP";root:string;outer_zip_digest:string};
export type Gcc4kAdapterCandidateV1={path:string;sha256:string};

export function safeGcc4kPayloadPathV1(value:string){return value.length>0&&!value.includes("\\")&&!value.startsWith("/")&&!/^[A-Za-z]:/.test(value)&&!value.split("/").includes("..");}
export function selectGcc4kKaggleInputV1(explodedRoots:string[],zipPaths:string[]):Gcc4kKaggleInputV1{
  if(explodedRoots.length>1)throw new Error("MULTIPLE_GCC4K_EXPLODED_INPUTS");
  if(explodedRoots.length===1)return {mode:"EXPLODED_KAGGLE_DATASET",root:explodedRoots[0],outer_zip_digest:"NOT_APPLICABLE_KAGGLE_EXPLODED_INPUT"};
  if(zipPaths.length!==1)throw new Error(zipPaths.length===0?"GCC4K_INPUT_NOT_FOUND":"MULTIPLE_GCC4K_ZIP_INPUTS");
  return {mode:"RECOVERY_ZIP",root:zipPaths[0],outer_zip_digest:GCC4K_RECOVERY_ZIP_SHA256};
}
export function verifyGcc4kPayloadV1(entries:ReadonlyMap<string,Uint8Array>,sums:string,corpusDigest:string){
  if(corpusDigest!==GCC4K_CORPUS_DIGEST)throw new Error("GCC4K_CORPUS_DIGEST_MISMATCH");
  let verified=0;
  for(const line of sums.split(/\r?\n/).filter(Boolean)){const match=/^([0-9a-f]{64})  (.+)$/.exec(line);if(!match||!safeGcc4kPayloadPathV1(match[2]))throw new Error("UNSAFE_GCC4K_PAYLOAD_PATH");const bytes=entries.get(match[2]);if(!bytes)throw new Error("GCC4K_PAYLOAD_MISSING");if(createHash("sha256").update(bytes).digest("hex")!==match[1])throw new Error("GCC4K_PAYLOAD_HASH_MISMATCH");verified++;}
  for(const required of GCC4K_EXPLODED_REQUIRED)if(required!=="SHA256SUMS.txt"&&!entries.has(required))throw new Error("GCC4K_REQUIRED_INPUT_MISSING");
  return verified;
}
export function selectGcc4kManifestBoundAdapterV1(manifestPaths:string[],manifestAdapterSha256:string,candidates:Gcc4kAdapterCandidateV1[]){
  if(manifestPaths.length===0)throw new Error("TRAIN_RUN_MANIFEST_NOT_FOUND");
  if(manifestPaths.length!==1)throw new Error("MULTIPLE_TRAIN_RUN_MANIFESTS");
  const manifestPath=manifestPaths[0],directory=manifestPath.replace(/[/\\][^/\\]+$/,"");
  const matching=candidates.filter(candidate=>candidate.sha256===manifestAdapterSha256);
  if(matching.length===0)throw new Error("PRESERVED_V02_ADAPTER_NOT_FOUND");
  const siblings=matching.filter(candidate=>candidate.path.replace(/[/\\][^/\\]+$/,"")===directory);
  if(siblings.length>1)throw new Error("MULTIPLE_MANIFEST_SIBLING_ADAPTERS");
  const selected=siblings[0]??[...matching].sort((left,right)=>left.path<right.path?-1:left.path>right.path?1:0)[0];
  return {adapter_candidate_count:candidates.length,adapter_matching_count:matching.length,adapter_selected_path:selected.path,adapter_input_sha256:selected.sha256};
}
