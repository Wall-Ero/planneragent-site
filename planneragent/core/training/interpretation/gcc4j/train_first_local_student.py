import gc, hashlib, json, os, platform, shutil, subprocess, sys, time, zipfile
from datetime import datetime, timezone
from pathlib import Path
os.environ.setdefault("WANDB_DISABLED", "true")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
from evaluate_interpretation_student import benchmark_openai, compact, evaluate, load_jsonl, prompt, write_json

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
CONFIG = json.loads((SCRIPTS / "experiment.config.json").read_text(encoding="utf-8"))
CORPUS = ROOT / "corpus"; OUTPUT = ROOT / CONFIG["candidate_id"]

def sha_file(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""): digest.update(block)
    return digest.hexdigest()

def environment_gate():
    import psutil, torch
    if not torch.cuda.is_available(): raise RuntimeError("REMOTE_GPU_REQUIRED:torch.cuda.is_available=false")
    props = torch.cuda.get_device_properties(0)
    usage = shutil.disk_usage(ROOT)
    evidence = {"os": platform.platform(), "cpu": platform.processor(), "ram_bytes": psutil.virtual_memory().total, "gpu": props.name, "vram_bytes": props.total_memory, "cuda": torch.version.cuda, "torch_cuda_available": True, "python": sys.version, "disk_free_bytes": usage.free}
    write_json(OUTPUT / "environment.manifest.json", evidence); return evidence

def corpus_gate():
    manifest = json.loads((CORPUS / "manifest.json").read_text(encoding="utf-8"))
    expected = CONFIG["expected_splits"]
    if manifest["corpus_id"] != CONFIG["corpus_id"] or manifest["corpus_version"] != CONFIG["corpus_version"] or manifest["aggregate_corpus_digest"] != CONFIG["corpus_digest"]: raise RuntimeError("GCC4J_CORPUS_IDENTITY_MISMATCH")
    for split in ("train", "validation", "qualification", "holdout", "adversarial"):
        if len(load_jsonl(CORPUS / f"{split}.jsonl")) != expected[split]: raise RuntimeError(f"GCC4J_SPLIT_COUNT_MISMATCH:{split}")
    normalize = lambda text: " ".join(text.lower().strip().split())
    train = {normalize(item["input_text"]) for item in load_jsonl(CORPUS / "train.jsonl")}
    for split in ("validation", "qualification", "holdout", "adversarial", "gold"):
        if train.intersection(normalize(item["input_text"]) for item in load_jsonl(CORPUS / f"{split}.jsonl")): raise RuntimeError(f"GCC4J_LEAKAGE:{split}")
    return manifest

def load_base(revision, precision):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    dtype = torch.bfloat16 if precision == "bf16" else torch.float16
    tokenizer = AutoTokenizer.from_pretrained(CONFIG["base_model"], revision=revision)
    if tokenizer.pad_token_id is None: tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(CONFIG["base_model"], revision=revision, torch_dtype=dtype).cuda()
    return model, tokenizer

def run_evaluations(model, tokenizer, prefix, include_train=False):
    sets = ["validation", "qualification", "holdout", "adversarial", "gold"] + (["train"] if include_train else [])
    summaries = {}
    for name in sets:
        result = evaluate(model, tokenizer, load_jsonl(CORPUS / f"{name}.jsonl"), CONFIG["instruction"], CONFIG["max_new_tokens"], "cuda")
        write_json(OUTPUT / f"{prefix}.{name}.json", result); summaries[name] = result["metrics"]
    return summaries

class TrainingDataset:
    def __init__(self, tokenizer, records):
        import torch
        self.rows = []
        for item in records:
            prefix = prompt(CONFIG["instruction"], item["input_text"]); target = compact(item["target"]) + tokenizer.eos_token
            prefix_ids = tokenizer(prefix, add_special_tokens=True)["input_ids"]
            full = tokenizer(prefix + target, truncation=True, max_length=CONFIG["max_sequence_length"], add_special_tokens=True)["input_ids"]
            self.rows.append({"input_ids": torch.tensor(full), "labels": torch.tensor([-100] * min(len(prefix_ids), len(full)) + full[len(prefix_ids):])})
    def __len__(self): return len(self.rows)
    def __getitem__(self, index): return self.rows[index]

def collator(tokenizer):
    import torch
    def apply(features):
        width = max(len(row["input_ids"]) for row in features); ids=[]; labels=[]; masks=[]
        for row in features:
            pad = width-len(row["input_ids"]); ids.append(torch.cat([row["input_ids"], torch.full((pad,), tokenizer.pad_token_id, dtype=torch.long)])); labels.append(torch.cat([row["labels"], torch.full((pad,), -100, dtype=torch.long)])); masks.append(torch.cat([torch.ones(len(row["input_ids"]), dtype=torch.long), torch.zeros(pad, dtype=torch.long)]))
        return {"input_ids": torch.stack(ids), "labels": torch.stack(labels), "attention_mask": torch.stack(masks)}
    return apply

def compare(base, trained):
    return {name: {"base": base[name], "trained": trained[name], "delta": {key: (None if base[name].get(key) is None or value is None else value-base[name][key]) for key, value in trained[name].items() if isinstance(value, (int, float)) and not isinstance(value, bool)}} for name in base}

def case_transitions():
    transitions={}
    for name in ("validation","qualification","holdout","adversarial","gold"):
        before=json.loads((OUTPUT/f"baseline.{name}.json").read_text(encoding="utf-8"))["cases"]
        after=json.loads((OUTPUT/f"trained.{name}.json").read_text(encoding="utf-8"))["cases"]
        transitions[name]={"wrong_to_correct":[{"case_id":a["case_id"],"interaction":a["expected"]["interaction"]} for b,a in zip(before,after) if not b["exact_target_match"] and a["exact_target_match"]],"correct_to_wrong":[{"case_id":a["case_id"],"interaction":a["expected"]["interaction"]} for b,a in zip(before,after) if b["exact_target_match"] and not a["exact_target_match"]]}
    return transitions

def package_result():
    portable = [path for path in OUTPUT.rglob("*") if path.is_file() and "checkpoint-" not in str(path)]
    sums = [f"{sha_file(path)}  {path.relative_to(OUTPUT).as_posix()}" for path in sorted(portable)]
    (OUTPUT / "SHA256SUMS.txt").write_text("\n".join(sums)+"\n", encoding="utf-8")
    archive = ROOT / f"{CONFIG['candidate_id']}-GCC4J.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for path in sorted([p for p in OUTPUT.rglob("*") if p.is_file()]): zip_file.write(path, f"{CONFIG['candidate_id']}/{path.relative_to(OUTPUT).as_posix()}")
    print(json.dumps({"result_bundle": str(archive), "size": archive.stat().st_size, "sha256": sha_file(archive)}, indent=2))

def main():
    import accelerate, datasets, peft, psutil, torch, transformers
    from huggingface_hub import model_info
    from peft import LoraConfig, PeftModel, get_peft_model
    from transformers import Trainer, TrainingArguments
    OUTPUT.mkdir(parents=True, exist_ok=True); environment = environment_gate(); corpus = corpus_gate()
    revision = model_info(CONFIG["base_model"]).sha
    precision = "bf16" if torch.cuda.is_bf16_supported() else "fp16"
    model, tokenizer = load_base(revision, precision)
    write_json(OUTPUT / "base-model.identity.json", {"repository": CONFIG["base_model"], "revision": revision, "tokenizer": CONFIG["base_model"], "tokenizer_revision": revision, "declared_license": CONFIG["base_license"], "retrieved_at": datetime.now(timezone.utc).isoformat()})
    baseline = run_evaluations(model, tokenizer, "baseline")
    candidates = [name for name in ("q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj") if any(module_name.endswith(name) for module_name, _ in model.named_modules())]
    if not candidates: raise RuntimeError("GCC4J_LORA_TARGET_DISCOVERY_FAILED")
    lora = LoraConfig(r=CONFIG["lora_rank"], lora_alpha=CONFIG["lora_alpha"], lora_dropout=CONFIG["lora_dropout"], target_modules=candidates, task_type="CAUSAL_LM")
    model = get_peft_model(model, lora); training_started=time.perf_counter(); torch.cuda.reset_peak_memory_stats()
    args = TrainingArguments(output_dir=str(OUTPUT / "checkpoints"), num_train_epochs=CONFIG["epochs"], learning_rate=CONFIG["learning_rate"], per_device_train_batch_size=CONFIG["batch_size"], per_device_eval_batch_size=CONFIG["batch_size"], gradient_accumulation_steps=CONFIG["gradient_accumulation_steps"], warmup_ratio=CONFIG["warmup_ratio"], lr_scheduler_type=CONFIG["scheduler"], optim=CONFIG["optimizer"], seed=CONFIG["seed"], data_seed=CONFIG["seed"], fp16=precision=="fp16", bf16=precision=="bf16", save_strategy="no", eval_strategy="epoch", report_to="none", logging_steps=1)
    trainer = Trainer(model=model, args=args, train_dataset=TrainingDataset(tokenizer, load_jsonl(CORPUS / "train.jsonl")), eval_dataset=TrainingDataset(tokenizer, load_jsonl(CORPUS / "validation.jsonl")), data_collator=collator(tokenizer))
    result = trainer.train(); validation_metrics=trainer.evaluate(); duration=time.perf_counter()-training_started
    adapter = OUTPUT / "adapter"; model.save_pretrained(adapter); tokenizer.save_pretrained(adapter)
    training_config = {**CONFIG, "base_revision": revision, "precision": precision, "lora_target_modules": candidates, "libraries": {name: module.__version__ for name, module in {"torch":torch,"transformers":transformers,"datasets":datasets,"peft":peft,"accelerate":accelerate}.items()}}
    write_json(OUTPUT / "training.config.json", training_config)
    write_json(OUTPUT / "training.metrics.json", {"duration_seconds":duration,"training_loss":result.training_loss,"validation_loss":validation_metrics.get("eval_loss"),"peak_gpu_memory_bytes":torch.cuda.max_memory_allocated(),"gpu":environment["gpu"],"oom_retries":0})
    del trainer, model; gc.collect(); torch.cuda.empty_cache()
    base, tokenizer = load_base(revision, precision); model = PeftModel.from_pretrained(base, adapter).cuda()
    trained = run_evaluations(model, tokenizer, "trained", include_train=True)
    comparison = compare(baseline, {name: trained[name] for name in baseline})
    unseen_gain = sum((trained[name]["interaction_accuracy"] or 0)-(baseline[name]["interaction_accuracy"] or 0) for name in baseline)/len(baseline)
    boundary_regression = any((trained[name]["hard_boundary_recall"] or 0) < (baseline[name]["hard_boundary_recall"] or 0) for name in baseline if trained[name]["hard_boundary_recall"] is not None)
    comparison["case_transitions"]=case_transitions(); comparison["learning_proof"] = "YES" if unseen_gain >= .10 and not boundary_regression else "NO"; write_json(OUTPUT / "comparison.summary.json", comparison)
    hashes = {path.relative_to(adapter).as_posix(): sha_file(path) for path in adapter.rglob("*") if path.is_file()}
    write_json(OUTPUT / "candidate.manifest.json", {"candidate_id":CONFIG["candidate_id"],"lifecycle_state":"TRAINED_CANDIDATE","base_repository":CONFIG["base_model"],"base_revision":revision,"base_license":CONFIG["base_license"],"corpus_id":corpus["corpus_id"],"corpus_version":corpus["corpus_version"],"corpus_digest":corpus["aggregate_corpus_digest"],"seed":CONFIG["seed"],"adapter_hashes":hashes,"reloaded":True,"created_at":datetime.now(timezone.utc).isoformat()})
    api_key=os.getenv("OPENAI_API_KEY"); openai_model=os.getenv("OPENAI_CONVERSATIONAL_MODEL")
    if api_key and openai_model:
        for name in ("validation","qualification","holdout","adversarial","gold"): write_json(OUTPUT / f"openai.{name}.json", benchmark_openai(load_jsonl(CORPUS / f"{name}.jsonl"), api_key, openai_model))
        write_json(OUTPUT / "openai.status.json", {"status":"COMPLETE","configured_model":openai_model,"training_use":False})
    else: write_json(OUTPUT / "openai.status.json", {"status":"UNAVAILABLE","reason":"missing explicit OPENAI_API_KEY and/or OPENAI_CONVERSATIONAL_MODEL"})
    package_result()
if __name__ == "__main__": main()
