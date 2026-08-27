import hashlib, json, os, shutil, uuid
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_CHECKPOINT_FILES=("adapter_model.safetensors","adapter_config.json","optimizer.pt","scheduler.pt","trainer_state.json","rng_state.pth")
def compact(value):return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False)
def sha_bytes(value):return hashlib.sha256(value).hexdigest()
def sha_file(path):return sha_bytes(Path(path).read_bytes())
def utc_now():return datetime.now(timezone.utc).isoformat()
def identity(config,corpus_digest):
    frozen={key:config[key] for key in ("candidate_id","candidate_version","base_model","base_revision","corpus_id","corpus_version","seed","epochs","learning_rate","batch_size","gradient_accumulation_steps","max_sequence_length","lora_rank","lora_alpha","lora_dropout","warmup_ratio","scheduler","optimizer","instruction")}
    return {**frozen,"corpus_digest":corpus_digest,"training_config_digest":f"sha256:{sha_bytes(compact(frozen).encode())}"}
def assert_identity(actual,expected):
    for key,value in expected.items():
        if actual.get(key)!=value:raise RuntimeError(f"PERSISTED_IDENTITY_MISMATCH:{key}")
def write_json(path,value):Path(path).write_text(json.dumps(value,sort_keys=True,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
def file_manifest(root,relative_files):return {name:sha_file(Path(root)/name) for name in sorted(relative_files)}
def verify_hashes(root,hashes):
    for name,expected in hashes.items():
        path=Path(root)/name
        if not path.is_file() or sha_file(path)!=expected:raise RuntimeError(f"PERSISTED_HASH_INVALID:{name}")
def valid_final_adapter(root,expected):
    root=Path(root)
    try:
        if not (root/"COMPLETE").is_file():return None
        manifest=json.loads((root/"candidate.manifest.json").read_text(encoding="utf-8"));assert_identity(manifest,expected);verify_hashes(root,manifest["artifact_hashes"])
        for name in ("adapter/adapter_model.safetensors","adapter/adapter_config.json","training.config.json","training.metrics.json","environment.manifest.json"):
            if name not in manifest["artifact_hashes"]:raise RuntimeError(f"PERSISTED_FINAL_REQUIRED_FILE_MISSING:{name}")
        return manifest
    except (OSError,ValueError,KeyError,json.JSONDecodeError):return None
def valid_checkpoint(root,expected):
    root=Path(root)
    try:
        if not (root/"COMPLETE").is_file():return False
        manifest=json.loads((root/"checkpoint.manifest.json").read_text(encoding="utf-8"))
    except (OSError,ValueError,KeyError,json.JSONDecodeError):return False
    assert_identity(manifest,expected)
    try:
        if any(not (root/name).is_file() for name in REQUIRED_CHECKPOINT_FILES):return False
        verify_hashes(root,manifest["artifact_hashes"]);return True
    except (OSError,ValueError,KeyError,json.JSONDecodeError,RuntimeError):return False
def latest_checkpoint(checkpoints,expected):
    candidates=[]
    for path in Path(checkpoints).glob("checkpoint-*"):
        if path.is_dir() and valid_checkpoint(path,expected):
            try:candidates.append((int(path.name.split("-")[-1]),path))
            except ValueError:pass
    return max(candidates,default=(0,None))[1]
def training_action(final_adapter,checkpoints,expected):
    if valid_final_adapter(final_adapter,expected):return "SKIP_ALREADY_COMPLETE",None
    checkpoint=latest_checkpoint(checkpoints,expected)
    return ("RESUME_FROM_CHECKPOINT",checkpoint) if checkpoint else ("FRESH_TRAIN",None)
def persist_checkpoint(checkpoint,expected):
    checkpoint=Path(checkpoint)
    if (checkpoint/"model.safetensors").exists() or (checkpoint/"pytorch_model.bin").exists():raise RuntimeError("CHECKPOINT_FULL_BASE_WEIGHTS_FORBIDDEN")
    missing=[name for name in REQUIRED_CHECKPOINT_FILES if not (checkpoint/name).is_file()]
    if missing:raise RuntimeError(f"CHECKPOINT_INCOMPLETE:{','.join(missing)}")
    hashes=file_manifest(checkpoint,REQUIRED_CHECKPOINT_FILES);write_json(checkpoint/"checkpoint.manifest.json",{**expected,"artifact_hashes":hashes,"checkpoint_bytes":sum((checkpoint/name).stat().st_size for name in REQUIRED_CHECKPOINT_FILES)})
    verify_hashes(checkpoint,hashes);(checkpoint/"COMPLETE").write_text("COMPLETE\n",encoding="utf-8")
def promote_directory(staging,final):
    staging=Path(staging);final=Path(final)
    if final.exists():shutil.rmtree(final)
    staging.rename(final)
def persist_evaluation(root,identity_value,adapter_digest,dataset_digest,evaluation_config_digest,result):
    root=Path(root);staging=root.with_name(root.name+f".tmp-{uuid.uuid4().hex}");shutil.rmtree(staging,ignore_errors=True);staging.mkdir(parents=True)
    write_json(staging/"result.json",result);result_hash=sha_file(staging/"result.json");manifest={**identity_value,"adapter_digest":adapter_digest,"dataset_digest":dataset_digest,"evaluation_config_digest":evaluation_config_digest,"result_sha256":result_hash};write_json(staging/"evaluation.manifest.json",manifest);(staging/"SHA256SUMS.txt").write_text(f"{result_hash}  result.json\n",encoding="utf-8");(staging/"COMPLETE").write_text("COMPLETE\n",encoding="utf-8");promote_directory(staging,root);return manifest
def reusable_evaluation(root,expected,adapter_digest,dataset_digest,evaluation_config_digest):
    root=Path(root)
    try:
        if not (root/"COMPLETE").is_file():return None
        manifest=json.loads((root/"evaluation.manifest.json").read_text(encoding="utf-8"));assert_identity(manifest,expected)
        if manifest["adapter_digest"]!=adapter_digest or manifest["dataset_digest"]!=dataset_digest or manifest["evaluation_config_digest"]!=evaluation_config_digest:return None
        if sha_file(root/"result.json")!=manifest["result_sha256"]:return None
        return json.loads((root/"result.json").read_text(encoding="utf-8"))
    except (OSError,ValueError,KeyError,json.JSONDecodeError,RuntimeError):return None
def append_history(state_root,record):
    root=Path(state_root);root.mkdir(parents=True,exist_ok=True)
    with (root/"resume-history.jsonl").open("a",encoding="utf-8") as stream:stream.write(json.dumps({**record,"recorded_at":utc_now()},sort_keys=True)+"\n")
