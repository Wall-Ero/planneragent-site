import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { strToU8, zipSync } from "fflate";
import { buildInterpretationPilotCorpusV1 } from "../../../src/conversation/learning/pilot/interpretation.pilot.corpus.v1";
import { buildGoldExportV1 } from "../gcc4j/prepare_gcc4j_bundle";

const sha=(value:string|Uint8Array)=>createHash("sha256").update(value).digest("hex");
export const hasOnlyPosixZipEntries=(entries:readonly string[])=>entries.every((entry)=>!entry.includes("\\")&&!entry.startsWith("/")&&!entry.includes("../"));
async function filesBelow(root:string):Promise<string[]>{const output:string[]=[];for(const entry of await readdir(root,{withFileTypes:true})){const path=resolve(root,entry.name);if(entry.isDirectory())output.push(...await filesBelow(path));else output.push(path);}return output.sort();}
export async function prepareGcc4kBundle(core=resolve(process.cwd()),destination=resolve(process.cwd(),"training-artifacts","gcc4k","PA-INTERPRETATION-STUDENT-v0.2-GCC4K-INPUT")){
  const corpus=resolve(core,"training-artifacts","PA-INTERPRETATION-CURRICULUM-v2");const manifest=JSON.parse(await readFile(resolve(corpus,"manifest.json"),"utf8")) as {corpus_id:string;corpus_version:string;split_counts:Record<string,number>;aggregate_corpus_digest:string};
  if(manifest.corpus_id!=="PA-INTERPRETATION-CURRICULUM-v2"||manifest.corpus_version!=="2"||JSON.stringify(manifest.split_counts)!==JSON.stringify({TRAIN:9000,VALIDATION:500,QUALIFICATION:150,HOLDOUT:150,ADVERSARIAL:200}))throw new Error("GCC4K_CORPUS_GATE_FAILED");
  await rm(destination,{recursive:true,force:true});await mkdir(resolve(destination,"corpus"),{recursive:true});await mkdir(resolve(destination,"historical"),{recursive:true});await mkdir(resolve(destination,"scripts"),{recursive:true});
  for(const name of ["train","validation","qualification","holdout","adversarial"] as const)await cp(resolve(corpus,`${name}.jsonl`),resolve(destination,"corpus",`${name}.jsonl`));await cp(resolve(corpus,"manifest.json"),resolve(destination,"corpus","manifest.json"));
  const pilot=buildInterpretationPilotCorpusV1();for(const name of ["validation","qualification","holdout","adversarial"] as const)await writeFile(resolve(destination,"historical",`${name}.jsonl`),pilot.jsonl[name.toUpperCase() as keyof typeof pilot.jsonl],"utf8");await writeFile(resolve(destination,"historical","gold.jsonl"),buildGoldExportV1(),"utf8");
  const source=resolve(core,"training","interpretation");for(const [from,to] of [[resolve(source,"gcc4j","evaluate_interpretation_student.py"),"evaluate_interpretation_student.py"],[resolve(source,"gcc4k","train_targeted_student_v02.py"),"train_targeted_student_v02.py"],[resolve(source,"gcc4k","experiment.config.json"),"experiment.config.json"]] as const)await cp(from,resolve(destination,"scripts",to));
  const v01=resolve(core,"training-artifacts","models","PA-INTERPRETATION-STUDENT-v0.1");let v01Included=false;try{await cp(v01,resolve(destination,"v01"),{recursive:true});v01Included=true;}catch{}
  const payloadFiles=await filesBelow(destination);const sums=[];for(const path of payloadFiles)sums.push(`${sha(await readFile(path))}  ${relative(destination,path).replaceAll("\\","/")}`);await writeFile(resolve(destination,"SHA256SUMS.txt"),`${sums.join("\n")}\n`,`utf8`);
  const zipEntries:Record<string,Uint8Array>={};for(const path of await filesBelow(destination)){const entry=relative(destination,path).replaceAll("\\","/");zipEntries[entry]=new Uint8Array(await readFile(path));}if(!hasOnlyPosixZipEntries(Object.keys(zipEntries)))throw new Error("GCC4K_NON_POSIX_ZIP_ENTRY");const zip=zipSync(zipEntries,{level:6});const zipPath=resolve(destination,"..","PA-INTERPRETATION-STUDENT-v0.2-GCC4K-INPUT.zip");await writeFile(zipPath,zip);
  return{destination,zip_path:zipPath,zip_size:zip.length,zip_sha256:sha(zip),bundle_tree_digest:`sha256:${sha(sums.join("\n"))}`,corpus_digest:manifest.aggregate_corpus_digest,v01_included:v01Included,entry_names:Object.keys(zipEntries)};
}
if(process.argv[1]&&basename(process.argv[1]).startsWith("prepare_gcc4k_bundle"))prepareGcc4kBundle().then((result)=>process.stdout.write(`${JSON.stringify({...result,entry_names:undefined},null,2)}\n`)).catch((error)=>{process.stderr.write(`${error instanceof Error?error.stack:error}\n`);process.exitCode=1;});
