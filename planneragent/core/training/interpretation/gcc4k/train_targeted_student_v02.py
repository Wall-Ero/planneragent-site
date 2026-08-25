import gc, hashlib, inspect, json, os, platform, shutil, sys, time, zipfile
from datetime import datetime, timezone
from pathlib import Path
os.environ.setdefault("WANDB_DISABLED","true"); os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY","1")
from evaluate_interpretation_student import benchmark_openai, compact, evaluate, load_jsonl, prompt, write_json
ROOT=Path(__file__).resolve().parent.parent; SCRIPTS=Path(__file__).resolve().parent; CONFIG=json.loads((SCRIPTS/"experiment.config.json").read_text()); CORPUS=ROOT/"corpus"; HISTORICAL=ROOT/"historical"; OUTPUT=ROOT/CONFIG["candidate_id"]
def sha_file(path):
    h=hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda:stream.read(1048576),b""):h.update(block)
    return h.hexdigest()
def preflight():
    import peft, psutil, torch, transformers
    from transformers import Trainer, TrainingArguments
    if not torch.cuda.is_available():raise RuntimeError("REMOTE_GPU_REQUIRED")
    if transformers.__version__!="4.51.3":raise RuntimeError(f"TRANSFORMERS_PIN_FAILED:{transformers.__version__}")
    for name in ("eval_strategy","label_names"):
        if name not in inspect.signature(TrainingArguments.__init__).parameters:raise RuntimeError(f"TRAINING_ARGUMENTS_API_MISMATCH:{name}")
    if "eval_dataset" not in inspect.signature(Trainer.__init__).parameters:raise RuntimeError("TRAINER_API_MISMATCH")
    if __import__("importlib").util.find_spec("torchao") is not None:raise RuntimeError("INCOMPATIBLE_TORCHAO_PRESENT")
    manifest=json.loads((CORPUS/"manifest.json").read_text()); expected={"TRAIN":9000,"VALIDATION":500,"QUALIFICATION":150,"HOLDOUT":150,"ADVERSARIAL":200}
    if manifest["corpus_id"]!=CONFIG["corpus_id"] or manifest["corpus_version"]!=CONFIG["corpus_version"] or manifest["split_counts"]!=expected:raise RuntimeError("CURRICULUM_GATE_FAILED")
    for split,count in expected.items():
        if len(load_jsonl(CORPUS/f"{split.lower()}.jsonl"))!=count:raise RuntimeError(f"CURRICULUM_PHYSICAL_COUNT_FAILED:{split}")
    props=torch.cuda.get_device_properties(0); env={"os":platform.platform(),"cpu":platform.processor(),"ram_bytes":psutil.virtual_memory().total,"gpu":props.name,"vram_bytes":props.total_memory,"cuda":torch.version.cuda,"torch":torch.__version__,"transformers":transformers.__version__,"peft":peft.__version__,"python":sys.version,"disk_free_bytes":shutil.disk_usage(ROOT).free}; OUTPUT.mkdir(parents=True,exist_ok=True); write_json(OUTPUT/"environment.manifest.json",env); return manifest,env
def load_base():
    import torch
    from transformers import AutoModelForCausalLM,AutoTokenizer
    precision="bf16" if torch.cuda.is_bf16_supported() else "fp16"; dtype=torch.bfloat16 if precision=="bf16" else torch.float16
    tokenizer=AutoTokenizer.from_pretrained(CONFIG["base_model"],revision=CONFIG["base_revision"]); tokenizer.pad_token=tokenizer.pad_token or tokenizer.eos_token
    model=AutoModelForCausalLM.from_pretrained(CONFIG["base_model"],revision=CONFIG["base_revision"],torch_dtype=dtype).cuda(); return model,tokenizer,precision
class TrainingDataset:
    def __init__(self,tokenizer,records):
        import torch
        self.rows=[]
        for item in records:
            prefix=prompt(CONFIG["instruction"],item["input_text"]); target=compact(item["target"])+tokenizer.eos_token; prefix_ids=tokenizer(prefix,add_special_tokens=True)["input_ids"]; full=tokenizer(prefix+target,truncation=True,max_length=CONFIG["max_sequence_length"],add_special_tokens=True)["input_ids"]
            labels=[-100]*min(len(prefix_ids),len(full))+full[len(prefix_ids):]; self.rows.append({"input_ids":torch.tensor(full,dtype=torch.long),"labels":torch.tensor(labels,dtype=torch.long)})
    def __len__(self):return len(self.rows)
    def __getitem__(self,index):return self.rows[index]
def collator(tokenizer):
    import torch
    def apply(rows):
        width=max(len(row["input_ids"]) for row in rows); result={"input_ids":[],"labels":[],"attention_mask":[]}
        for row in rows:
            pad=width-len(row["input_ids"]); result["input_ids"].append(torch.cat([row["input_ids"],torch.full((pad,),tokenizer.pad_token_id,dtype=torch.long)])); result["labels"].append(torch.cat([row["labels"],torch.full((pad,),-100,dtype=torch.long)])); result["attention_mask"].append(torch.cat([torch.ones(len(row["input_ids"]),dtype=torch.long),torch.zeros(pad,dtype=torch.long)]))
        return {key:torch.stack(value) for key,value in result.items()}
    return apply
def evaluate_sets(model,tokenizer,prefix,root,names):
    summaries={}
    for name in names:
        result=evaluate(model,tokenizer,load_jsonl(root/f"{name}.jsonl"),CONFIG["instruction"],CONFIG["max_new_tokens"],"cuda"); write_json(OUTPUT/f"{prefix}.{name}.json",result); summaries[name]=result["metrics"]
    return summaries
def package_result():
    files=[path for path in OUTPUT.rglob("*") if path.is_file() and "checkpoints" not in path.parts]; sums=[f"{sha_file(path)}  {path.relative_to(OUTPUT).as_posix()}" for path in sorted(files)]; (OUTPUT/"SHA256SUMS.txt").write_text("\n".join(sums)+"\n")
    archive=ROOT/f"{CONFIG['candidate_id']}-GCC4K.zip"
    with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED) as output:
        for path in sorted(path for path in OUTPUT.rglob("*") if path.is_file()):output.write(path,f"{CONFIG['candidate_id']}/{path.relative_to(OUTPUT).as_posix()}")
    print(json.dumps({"bundle":str(archive),"size":archive.stat().st_size,"sha256":sha_file(archive)},indent=2))
def main():
    import accelerate, peft, torch, transformers
    from peft import LoraConfig,PeftModel,get_peft_model
    from transformers import Trainer,TrainingArguments
    corpus,environment=preflight(); model,tokenizer,precision=load_base(); modules=[name for name in ("q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj") if any(module_name.endswith(name) for module_name,_ in model.named_modules())]
    if not modules:raise RuntimeError("LORA_TARGET_DISCOVERY_FAILED")
    model=get_peft_model(model,LoraConfig(r=8,lora_alpha=16,lora_dropout=.05,target_modules=modules,task_type="CAUSAL_LM")); args=TrainingArguments(output_dir=str(OUTPUT/"checkpoints"),num_train_epochs=3,learning_rate=2e-4,per_device_train_batch_size=2,per_device_eval_batch_size=2,gradient_accumulation_steps=4,warmup_ratio=.05,lr_scheduler_type="cosine",optim="adamw_torch",seed=4701,data_seed=4701,fp16=precision=="fp16",bf16=precision=="bf16",save_strategy="epoch",eval_strategy="epoch",label_names=["labels"],report_to="none",logging_steps=20)
    trainer=Trainer(model=model,args=args,train_dataset=TrainingDataset(tokenizer,load_jsonl(CORPUS/"train.jsonl")),eval_dataset=TrainingDataset(tokenizer,load_jsonl(CORPUS/"validation.jsonl")),data_collator=collator(tokenizer)); torch.cuda.reset_peak_memory_stats(); started=time.perf_counter(); result=trainer.train(); validation=trainer.evaluate(); duration=time.perf_counter()-started; adapter=OUTPUT/"adapter"; model.save_pretrained(adapter); tokenizer.save_pretrained(adapter)
    write_json(OUTPUT/"training.config.json",{**CONFIG,"precision":precision,"lora_target_modules":modules,"libraries":{"torch":torch.__version__,"transformers":transformers.__version__,"peft":peft.__version__,"accelerate":accelerate.__version__}}); write_json(OUTPUT/"training.metrics.json",{"duration_seconds":duration,"training_loss":result.training_loss,"validation_loss":validation.get("eval_loss"),"peak_gpu_memory_bytes":torch.cuda.max_memory_allocated(),"oom_retries":0})
    del trainer,model;gc.collect();torch.cuda.empty_cache();base,tokenizer,_=load_base();model=PeftModel.from_pretrained(base,adapter).cuda(); blind=evaluate_sets(model,tokenizer,"v02.blind",CORPUS,["qualification","holdout","adversarial"]); historical=evaluate_sets(model,tokenizer,"v02.historical",HISTORICAL,["validation","qualification","holdout","adversarial","gold"]); validation_result=evaluate_sets(model,tokenizer,"v02",CORPUS,["validation"])
    v01_adapter=ROOT/"v01"/"adapter"
    v01_blind=None
    if v01_adapter.exists():
        del model,base;gc.collect();torch.cuda.empty_cache();base,tokenizer,_=load_base();v01=PeftModel.from_pretrained(base,v01_adapter).cuda();v01_blind=evaluate_sets(v01,tokenizer,"v01.blind",CORPUS,["qualification","holdout","adversarial"])
    comparison={"historical_v02":historical,"new_blind_v02":blind,"validation_v02":validation_result,"new_blind_v01":v01_blind}; write_json(OUTPUT/"comparison.summary.json",comparison)
    hashes={path.relative_to(adapter).as_posix():sha_file(path) for path in adapter.rglob("*") if path.is_file()}; write_json(OUTPUT/"candidate.manifest.json",{"candidate_id":CONFIG["candidate_id"],"lifecycle_state":"TRAINED_CANDIDATE","base_repository":CONFIG["base_model"],"base_revision":CONFIG["base_revision"],"corpus_id":corpus["corpus_id"],"corpus_version":corpus["corpus_version"],"corpus_digest":corpus["aggregate_corpus_digest"],"lora":{"rank":8,"alpha":16,"dropout":.05,"target_modules":modules},"environment":environment,"adapter_hashes":hashes,"reloaded":True,"created_at":datetime.now(timezone.utc).isoformat()})
    key=os.getenv("OPENAI_API_KEY");reference=os.getenv("OPENAI_CONVERSATIONAL_MODEL")
    if key and reference:
        for name in ("qualification","holdout","adversarial"):write_json(OUTPUT/f"openai.blind.{name}.json",benchmark_openai(load_jsonl(CORPUS/f"{name}.jsonl"),key,reference))
        write_json(OUTPUT/"openai.status.json",{"status":"COMPLETE","model":reference,"training_use":False})
    else:write_json(OUTPUT/"openai.status.json",{"status":"UNAVAILABLE","reason":"missing explicit OPENAI_API_KEY and/or OPENAI_CONVERSATIONAL_MODEL"})
    package_result()
if __name__=="__main__":main()
