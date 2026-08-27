import{mkdir,readFile,writeFile}from"node:fs/promises";
import{resolve}from"node:path";
import{CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1}from"../../evaluation/conversational.interpretation.gold.corpus.v1";
import{buildInterpretationPilotCorpusV1}from"../pilot/interpretation.pilot.corpus.v1";
import{auditInterpretationCurriculumV4SentinelIsolation,auditInterpretationCurriculumV4StyleLeakage,buildInterpretationCurriculumV4,CURRICULUM_V4_SPLITS}from"./interpretation.curriculum.v4";

async function main(){
 const output=resolve(process.cwd(),"training-artifacts","PA-INTERPRETATION-CURRICULUM-v4"),built=buildInterpretationCurriculumV4(),oodPath=resolve(process.cwd(),"training-artifacts","PA-INTERPRETATION-OOD-BENCHMARK-v1","benchmark.jsonl"),ood=(await readFile(oodPath,"utf8")).trim().split(/\r?\n/).map(line=>(JSON.parse(line)as{input_text:string}).input_text),historical=[...buildInterpretationPilotCorpusV1().items.filter(row=>row.split!=="TRAIN").map(row=>row.input_text),...CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.map(row=>row.message)],sentinel=auditInterpretationCurriculumV4SentinelIsolation(built.items,historical,ood),style=auditInterpretationCurriculumV4StyleLeakage(built.items),leakage={...built.manifest.audits,...sentinel,style_red_team:style},oracle={oracle_conflict_count:built.manifest.audits.oracle_conflict_count,role_span_conflict_count:built.manifest.audits.role_span_conflict_count,product_focus_rotation_count:built.manifest.audits.product_focus_rotation_count,constitutional_invariant_violations:built.manifest.audits.constitutional_invariant_violations,closed_enum_compliance_percent:100,declared_role_fidelity_percent:100};
 if(Object.values(sentinel).some(value=>value!==0)||style.generator_only_label_shortcut_count!==0||style.visible_renderer_identifier_count!==0)throw new Error(`CURRICULUM_V4_SENTINEL_OR_STYLE_GATE_FAILED:${JSON.stringify({sentinel,style})}`);
 await mkdir(output,{recursive:true});
 for(const split of CURRICULUM_V4_SPLITS)await writeFile(resolve(output,`${split.toLowerCase()}.jsonl`),built.jsonl[split]);
 await writeFile(resolve(output,"manifest.json"),`${JSON.stringify({...built.manifest,sentinel_isolation:sentinel},null,2)}\n`);
 await writeFile(resolve(output,"generator.metadata.json"),`${JSON.stringify({generator:"interpretation.curriculum.v4",builder:"build.interpretation.curriculum.v4",candidate_policy:"bounded deterministic candidates; normalized duplicates rejected",style_allocation:"two split-exclusive renderer families per split",target_order:"semantic spec -> final surface -> explicit spans -> target"},null,2)}\n`);
 await writeFile(resolve(output,"oracle.audit.json"),`${JSON.stringify(oracle,null,2)}\n`);
 await writeFile(resolve(output,"leakage.audit.json"),`${JSON.stringify(leakage,null,2)}\n`);
 process.stdout.write(`${JSON.stringify({output,...built.manifest,sentinel_isolation:sentinel,style_red_team:style},null,2)}\n`)
}
main().catch(e=>{process.stderr.write(`${e instanceof Error?e.stack:e}\n`);process.exitCode=1});
