import argparse, gc, hashlib, inspect, json, os, platform, shutil, sys, time, uuid, zipfile
from datetime import datetime, timezone
from pathlib import Path
os.environ.setdefault("WANDB_DISABLED","true");os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY","1")
from evaluate_interpretation_student_v03 import compact,evaluate,load_jsonl,prompt,write_json
from gcc4m_recovery import append_history,file_manifest,identity,persist_checkpoint,persist_evaluation,promote_directory,reusable_evaluation,sha_file,training_action,valid_final_adapter,verify_hashes
ROOT=Path(__file__).resolve().parent.parent;SCRIPTS=Path(__file__).resolve().parent;CONFIG=json.loads((SCRIPTS/"experiment.config.json").read_text());CORPUS=ROOT/"corpus";HISTORICAL=ROOT/"historical"
PERSIST_ROOT=Path(os.getenv("PLANNERAGENT_GCC4M_PERSIST_ROOT","/content/drive/MyDrive/PlannerAgent/GCC4M"));PERSIST=PERSIST_ROOT/CONFIG["candidate_id"];CHECKPOINTS=PERSIST/"checkpoints";FINAL=PERSIST/"final-adapter";EVALUATION=PERSIST/"evaluation";RESULT=PERSIST/"result";STATE=PERSIST/"state"
def preflight():
    import peft,psutil,torch,transformers
    from transformers import Trainer,TrainingArguments
    if not torch.cuda.is_available():raise RuntimeError("REMOTE_GPU_REQUIRED")
    if transformers.__version__!="4.51.3":raise RuntimeError(f"TRANSFORMERS_PIN_FAILED:{transformers.__version__}")
    if __import__("importlib").util.find_spec("torchao") is not None:raise RuntimeError("INCOMPATIBLE_TORCHAO_PRESENT")
    for name in ("eval_strategy","label_names"):
        if name not in inspect.signature(TrainingArguments.__init__).parameters:raise RuntimeError(f"TRAINING_ARGUMENTS_API_MISMATCH:{name}")
    if "eval_dataset" not in inspect.signature(Trainer.__init__).parameters:raise RuntimeError("TRAINER_API_MISMATCH")
    if CONFIG.get("initialization")!="FRESH_PINNED_BASE":raise RuntimeError("FRESH_PINNED_BASE_REQUIRED")
    manifest=json.loads((CORPUS/"manifest.json").read_text());expected={"TRAIN":9000,"VALIDATION":500,"QUALIFICATION":150,"HOLDOUT":150,"ADVERSARIAL":200}
    if manifest["corpus_id"]!=CONFIG["corpus_id"] or manifest["corpus_version"]!=CONFIG["corpus_version"] or manifest["split_counts"]!=expected:raise RuntimeError("CURRICULUM_GATE_FAILED")
    for split,count in expected.items():
        if len(load_jsonl(CORPUS/f"{split.lower()}.jsonl"))!=count:raise RuntimeError(f"CURRICULUM_PHYSICAL_COUNT_FAILED:{split}")
    props=torch.cuda.get_device_properties(0);environment={"os":platform.platform(),"cpu":platform.processor(),"ram_bytes":psutil.virtual_memory().total,"gpu":props.name,"vram_bytes":props.total_memory,"cuda":torch.version.cuda,"torch":torch.__version__,"transformers":transformers.__version__,"peft":peft.__version__,"python":sys.version,"disk_free_bytes":shutil.disk_usage(PERSIST_ROOT).free};PERSIST.mkdir(parents=True,exist_ok=True);STATE.mkdir(parents=True,exist_ok=True);write_json(STATE/"environment.manifest.json",environment);shutil.copy2(SCRIPTS/"lost-run.evidence.json",STATE/"lost-run.evidence.json");expected_identity=identity(CONFIG,manifest["aggregate_corpus_digest"]);write_json(STATE/"persistent.identity.json",expected_identity);sums=ROOT/"SHA256SUMS.txt";write_json(STATE/"input.identity.json",{"bundle_hash_manifest_sha256":f"sha256:{sha_file(sums)}","corpus_digest":manifest["aggregate_corpus_digest"],"config_sha256":f"sha256:{sha_file(SCRIPTS/'experiment.config.json')}","training_script_sha256":f"sha256:{sha_file(SCRIPTS/'train_targeted_student_v03.py')}"});return manifest,environment,expected_identity
def load_base():
    import torch
    from transformers import AutoModelForCausalLM,AutoTokenizer
    precision="bf16" if torch.cuda.is_bf16_supported() else "fp16";dtype=torch.bfloat16 if precision=="bf16" else torch.float16;tokenizer=AutoTokenizer.from_pretrained(CONFIG["base_model"],revision=CONFIG["base_revision"]);tokenizer.pad_token=tokenizer.pad_token or tokenizer.eos_token;model=AutoModelForCausalLM.from_pretrained(CONFIG["base_model"],revision=CONFIG["base_revision"],torch_dtype=dtype).cuda();return model,tokenizer,precision
class TrainingDataset:
    def __init__(self,tokenizer,records):
        import torch
        self.rows=[]
        for item in records:
            prefix=prompt(CONFIG["instruction"],item["input_text"]);target=compact(item["target"])+tokenizer.eos_token;prefix_ids=tokenizer(prefix,add_special_tokens=True)["input_ids"];full=tokenizer(prefix+target,truncation=True,max_length=CONFIG["max_sequence_length"],add_special_tokens=True)["input_ids"];labels=[-100]*min(len(prefix_ids),len(full))+full[len(prefix_ids):];self.rows.append({"input_ids":torch.tensor(full,dtype=torch.long),"labels":torch.tensor(labels,dtype=torch.long)})
    def __len__(self):return len(self.rows)
    def __getitem__(self,index):return self.rows[index]
def collator(tokenizer):
    import torch
    def apply(rows):
        width=max(len(row["input_ids"]) for row in rows);result={"input_ids":[],"labels":[],"attention_mask":[]}
        for row in rows:
            pad=width-len(row["input_ids"]);result["input_ids"].append(torch.cat([row["input_ids"],torch.full((pad,),tokenizer.pad_token_id,dtype=torch.long)]));result["labels"].append(torch.cat([row["labels"],torch.full((pad,),-100,dtype=torch.long)]));result["attention_mask"].append(torch.cat([torch.ones(len(row["input_ids"]),dtype=torch.long),torch.zeros(pad,dtype=torch.long)]))
        return {key:torch.stack(value) for key,value in result.items()}
    return apply
def persist_final(model,tokenizer,expected_identity,environment,training_metrics,training_config):
    staging=FINAL.with_name("final-adapter.tmp");shutil.rmtree(staging,ignore_errors=True);(staging/"adapter").mkdir(parents=True);model.save_pretrained(staging/"adapter");tokenizer.save_pretrained(staging/"adapter");write_json(staging/"training.config.json",training_config);write_json(staging/"training.metrics.json",training_metrics);write_json(staging/"environment.manifest.json",environment)
    names=[path.relative_to(staging).as_posix() for path in staging.rglob("*") if path.is_file()];hashes=file_manifest(staging,names);manifest={**expected_identity,"lifecycle_state":"TRAINED_CANDIDATE","artifact_id":"PA-INTERPRETATION-STUDENT-v0.3-ADAPTER","artifact_hashes":hashes,"adapter_digest":f"sha256:{hashes['adapter/adapter_model.safetensors']}","created_at":datetime.now(timezone.utc).isoformat()};write_json(staging/"candidate.manifest.json",manifest);verify_hashes(staging,hashes);(staging/"COMPLETE").write_text("COMPLETE\n");promote_directory(staging,FINAL)
    RESULT.mkdir(parents=True,exist_ok=True);adapter_zip=RESULT/"PA-INTERPRETATION-STUDENT-v0.3-ADAPTER-GCC4M.zip"
    with zipfile.ZipFile(adapter_zip,"w",zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(path for path in FINAL.rglob("*") if path.is_file()):archive.write(path,f"PA-INTERPRETATION-STUDENT-v0.3-ADAPTER/{path.relative_to(FINAL).as_posix()}")
    adapter_zip_hash=sha_file(adapter_zip);write_json(RESULT/"adapter-zip.manifest.json",{"path":adapter_zip.name,"sha256":adapter_zip_hash,"size":adapter_zip.stat().st_size});return manifest,adapter_zip_hash
def train_phase(corpus,environment,expected_identity):
    import accelerate,peft,torch,transformers
    from peft import LoraConfig,get_peft_model
    from transformers import Trainer,TrainerCallback,TrainingArguments
    action,checkpoint=training_action(FINAL,CHECKPOINTS,expected_identity);print(f"TRAINING_ACTION = {action}");run_id=uuid.uuid4().hex;append_history(STATE,{"run_id":run_id,"action":action,"checkpoint":str(checkpoint) if checkpoint else None,"outcome":"STARTED","environment":{"gpu":environment["gpu"],"cuda":environment["cuda"]}})
    if action=="SKIP_ALREADY_COMPLETE":append_history(STATE,{"run_id":run_id,"action":action,"outcome":"SKIPPED_VALID_FINAL_ADAPTER"});return valid_final_adapter(FINAL,expected_identity)
    base,tokenizer,precision=load_base();modules=[name for name in ("q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj") if any(module_name.endswith(name) for module_name,_ in base.named_modules())]
    if not modules:raise RuntimeError("LORA_TARGET_DISCOVERY_FAILED")
    model=get_peft_model(base,LoraConfig(r=8,lora_alpha=16,lora_dropout=.05,target_modules=modules,task_type="CAUSAL_LM"))
    class CheckpointCompleter(TrainerCallback):
        def on_save(self,args,state,control,**kwargs):persist_checkpoint(Path(args.output_dir)/f"checkpoint-{state.global_step}",expected_identity);return control
    args=TrainingArguments(output_dir=str(CHECKPOINTS),num_train_epochs=3,learning_rate=2e-4,per_device_train_batch_size=2,per_device_eval_batch_size=2,gradient_accumulation_steps=4,warmup_ratio=.05,lr_scheduler_type="cosine",optim="adamw_torch",seed=4701,data_seed=4701,fp16=precision=="fp16",bf16=precision=="bf16",save_strategy="epoch",save_total_limit=3,eval_strategy="epoch",label_names=["labels"],report_to="none",logging_steps=20)
    trainer=Trainer(model=model,args=args,train_dataset=TrainingDataset(tokenizer,load_jsonl(CORPUS/"train.jsonl")),eval_dataset=TrainingDataset(tokenizer,load_jsonl(CORPUS/"validation.jsonl")),data_collator=collator(tokenizer),callbacks=[CheckpointCompleter()]);torch.cuda.reset_peak_memory_stats();started=time.perf_counter();result=trainer.train(resume_from_checkpoint=str(checkpoint) if checkpoint else None);duration=time.perf_counter()-started;last_eval=next((entry.get("eval_loss") for entry in reversed(trainer.state.log_history) if "eval_loss" in entry),None)
    training_config={**CONFIG,"precision":precision,"lora_target_modules":modules,"libraries":{"torch":torch.__version__,"transformers":transformers.__version__,"peft":peft.__version__,"accelerate":accelerate.__version__}};metrics={"duration_seconds":duration,"training_loss":result.training_loss,"validation_loss":last_eval,"optimizer_steps":trainer.state.global_step,"epochs_completed":trainer.state.epoch,"peak_gpu_memory_bytes":torch.cuda.max_memory_allocated(),"resumed_from":str(checkpoint) if checkpoint else None};manifest,adapter_zip_hash=persist_final(model,tokenizer,expected_identity,environment,metrics,training_config)
    write_json(STATE/"training-complete.json",{**expected_identity,"lifecycle":"TRAINED_CANDIDATE","training_complete":True,"epochs_completed":trainer.state.epoch,"optimizer_steps":trainer.state.global_step,"train_runtime":duration,"train_loss":result.training_loss,"final_validation_loss":last_eval,"adapter_artifact_digest":manifest["adapter_digest"],"adapter_zip_sha256":adapter_zip_hash,"completed_at":datetime.now(timezone.utc).isoformat(),"environment_evidence":"state/environment.manifest.json"});append_history(STATE,{"run_id":run_id,"action":action,"outcome":"TRAINING_COMPLETE_ADAPTER_PERSISTED","checkpoint":str(checkpoint) if checkpoint else None});del trainer,model,base;gc.collect();torch.cuda.empty_cache();return manifest
def evaluation_job(model,tokenizer,name,dataset_path,expected_identity,adapter_digest):
    evaluation_config_digest=f"sha256:{hashlib.sha256(compact({'instruction':CONFIG['instruction'],'max_new_tokens':CONFIG['max_new_tokens'],'do_sample':False}).encode()).hexdigest()}";dataset_digest=f"sha256:{sha_file(dataset_path)}";target=EVALUATION/name;cached=reusable_evaluation(target,expected_identity,adapter_digest,dataset_digest,evaluation_config_digest)
    if cached is not None:print(f"EVALUATION_ACTION {name} = SKIP_COMPLETE");return cached["metrics"]
    print(f"EVALUATION_ACTION {name} = RUN");result=evaluate(model,tokenizer,load_jsonl(dataset_path),CONFIG["instruction"],CONFIG["max_new_tokens"],"cuda");persist_evaluation(target,expected_identity,adapter_digest,dataset_digest,evaluation_config_digest,{"dataset_identity":name,"candidate_id":CONFIG["candidate_id"],"evaluation_config":{"instruction":CONFIG["instruction"],"max_new_tokens":CONFIG["max_new_tokens"],"do_sample":False},**result});return result["metrics"]
def package_result(expected_identity,adapter_digest):
    staging=RESULT/"package.tmp";shutil.rmtree(staging,ignore_errors=True);staging.mkdir(parents=True);shutil.copytree(FINAL,staging/"final-adapter");shutil.copytree(EVALUATION,staging/"evaluation");shutil.copytree(STATE,staging/"state");measured={path.parent.name:json.loads(path.read_text())["metrics"] for path in EVALUATION.glob("*/result.json")};baseline=json.loads((ROOT/"baselines/v02.evidence.review.json").read_text());summary={"v03":{"provenance":"MEASURED_IN_THIS_RUN","metrics":measured},"v02":{"provenance":"FROZEN_VERIFIED_BASELINE","metrics":{"blind":baseline["v02_blind"],"historical":baseline["historical_v02"]},"evidence_sha256":sha_file(ROOT/"baselines/v02.evidence.review.json")},"v01":{"provenance":"FROZEN_VERIFIED_BASELINE","metrics":{"blind_exact":baseline["v01_blind_exact"],"blind_interaction":baseline["v01_blind_interaction"]}}};write_json(staging/"comparison.summary.json",summary);files=[path for path in staging.rglob("*") if path.is_file()];sums=[f"{sha_file(path)}  {path.relative_to(staging).as_posix()}" for path in sorted(files)];(staging/"SHA256SUMS.txt").write_text("\n".join(sums)+"\n");archive=RESULT/"PA-INTERPRETATION-STUDENT-v0.3-GCC4M.zip"
    with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED) as output:
        for path in sorted(path for path in staging.rglob("*") if path.is_file()):output.write(path,f"PA-INTERPRETATION-STUDENT-v0.3/{path.relative_to(staging).as_posix()}")
    with zipfile.ZipFile(archive,"r") as verification:
        if verification.testzip() is not None:raise RuntimeError("FINAL_RESULT_ZIP_CORRUPT")
    write_json(RESULT/"final-result.manifest.json",{**expected_identity,"adapter_digest":adapter_digest,"zip_path":str(archive),"zip_sha256":sha_file(archive),"zip_size":archive.stat().st_size,"base_weights_included":False,"credentials_included":False});(RESULT/"FINAL_RESULT_COMPLETE").write_text("COMPLETE\n");append_history(STATE,{"run_id":uuid.uuid4().hex,"action":"PACKAGE","outcome":"COMPLETE","zip_sha256":sha_file(archive)});shutil.rmtree(staging);return archive
def evaluate_phase(corpus,environment,expected_identity):
    import torch
    from peft import PeftModel
    manifest=valid_final_adapter(FINAL,expected_identity)
    if not manifest:raise RuntimeError("VERIFIED_PERSISTENT_FINAL_ADAPTER_REQUIRED")
    append_history(STATE,{"run_id":uuid.uuid4().hex,"action":"EVALUATE","outcome":"STARTED"});base,tokenizer,_=load_base();model=PeftModel.from_pretrained(base,FINAL/"adapter").cuda();write_json(STATE/"persistent-reload.json",{"persistent_adapter_reloaded":True,"adapter_digest":manifest["adapter_digest"],"reloaded_at":datetime.now(timezone.utc).isoformat()})
    jobs=[("v03.validation",CORPUS/"validation.jsonl"),("v03.blind.qualification",CORPUS/"qualification.jsonl"),("v03.blind.holdout",CORPUS/"holdout.jsonl"),("v03.blind.adversarial",CORPUS/"adversarial.jsonl"),("v03.historical.validation",HISTORICAL/"validation.jsonl"),("v03.historical.qualification",HISTORICAL/"qualification.jsonl"),("v03.historical.holdout",HISTORICAL/"holdout.jsonl"),("v03.historical.adversarial",HISTORICAL/"adversarial.jsonl"),("v03.historical.gold",HISTORICAL/"gold.jsonl")]
    for name,path in jobs:evaluation_job(model,tokenizer,name,path,expected_identity,manifest["adapter_digest"])
    del model,base;gc.collect();torch.cuda.empty_cache()
    archive=package_result(expected_identity,manifest["adapter_digest"]);append_history(STATE,{"run_id":uuid.uuid4().hex,"action":"EVALUATE","outcome":"COMPLETE","result_zip":str(archive)});return archive
def main():
    parser=argparse.ArgumentParser();parser.add_argument("--phase",choices=("train","evaluate","all"),default="all");parser.add_argument("--persist-root");args=parser.parse_args()
    global PERSIST_ROOT,PERSIST,CHECKPOINTS,FINAL,EVALUATION,RESULT,STATE
    if args.persist_root:PERSIST_ROOT=Path(args.persist_root);PERSIST=PERSIST_ROOT/CONFIG["candidate_id"];CHECKPOINTS=PERSIST/"checkpoints";FINAL=PERSIST/"final-adapter";EVALUATION=PERSIST/"evaluation";RESULT=PERSIST/"result";STATE=PERSIST/"state"
    corpus,environment,expected_identity=preflight()
    if args.phase in ("train","all"):train_phase(corpus,environment,expected_identity)
    if args.phase in ("evaluate","all"):evaluate_phase(corpus,environment,expected_identity)
if __name__=="__main__":main()
