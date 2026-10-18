import argparse
import gc
import hashlib
import json
import os
import platform
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("WANDB_DISABLED", "true")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

from realization_training_contract_v01 import (
    compact,
    parse_realization_envelope_v1,
    prompt,
)

HERE = Path(__file__).resolve().parent
CORPUS = HERE / "corpus-diverse"
CONFIG = json.loads(
    (HERE / "experiment.config.json").read_text(encoding="utf-8-sig")
)

EXPECTED_SPLITS = {
    "TRAIN": 1536,
    "VALIDATION": 192,
    "QUALIFICATION": 192,
    "HOLDOUT": 192,
    "ADVERSARIAL": 256,
}

FAMILIES = {
    "PURPOSE",
    "DOMAINS",
    "DATA_CATEGORIES",
    "PUBLIC_TIERS",
    "TIER_EXECUTION",
    "VISION_BOUNDARY",
    "DATA_INTRODUCTION",
    "LIMITATIONS",
    "USER_SPECIFIC_NO_DATA",
    "EXECUTION_REQUEST",
    "PROMPT_INJECTION",
    "SEMANTIC_NONAUTHORITY",
}


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def load_jsonl(path):
    return [
        json.loads(line)
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def sha_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, value):
    Path(path).write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def preflight():
    import peft
    import psutil
    import torch
    import transformers

    if not torch.cuda.is_available():
        raise RuntimeError("REMOTE_GPU_REQUIRED")

    if transformers.__version__ != CONFIG["transformers_version"]:
        raise RuntimeError(
            f"TRANSFORMERS_PIN_FAILED:{transformers.__version__}"
        )

    if peft.__version__ != CONFIG["peft_version"]:
        raise RuntimeError(
            f"PEFT_PIN_FAILED:{peft.__version__}"
        )

    if CONFIG["initialization"] != "FRESH_PINNED_BASE":
        raise RuntimeError("FRESH_PINNED_BASE_REQUIRED")

    seed_manifest = load_json(HERE / "manifest.json")
    diverse_manifest = load_json(HERE / "diverse.manifest.json")
    seed_report = load_json(HERE / "preflight.report.json")

    if seed_manifest["corpus_id"] != "PA-REALIZATION-CURRICULUM-v1":
        raise RuntimeError("SEED_CORPUS_ID_FAILED")

    if seed_manifest["split_counts"] != EXPECTED_SPLITS:
        raise RuntimeError("SEED_SPLIT_COUNTS_FAILED")

    if seed_report["invalid_target_count"] != 0:
        raise RuntimeError("INVALID_SEED_TARGETS")

    if seed_report["exact_input_duplicate_count"] != 0:
        raise RuntimeError("SEED_INPUT_DUPLICATES")

    if seed_report["normalized_user_message_duplicate_count"] != 0:
        raise RuntimeError("SEED_MESSAGE_DUPLICATES")

    report = diverse_manifest["report"]

    if diverse_manifest["corpus_id"] != "PA-REALIZATION-CURRICULUM-v1-DIVERSE":
        raise RuntimeError("DIVERSE_CORPUS_ID_FAILED")

    if diverse_manifest["source_corpus_id"] != "PA-REALIZATION-CURRICULUM-v1":
        raise RuntimeError("DIVERSE_SOURCE_ID_FAILED")

    if diverse_manifest["semantic_inputs_unchanged"] is not True:
        raise RuntimeError("SEMANTIC_INPUT_PRESERVATION_FAILED")

    if diverse_manifest["split_membership_unchanged"] is not True:
        raise RuntimeError("SPLIT_MEMBERSHIP_PRESERVATION_FAILED")

    if report["total_records"] != sum(EXPECTED_SPLITS.values()):
        raise RuntimeError("DIVERSE_TOTAL_COUNT_FAILED")

    if report["unique_answer_ratio"] < 0.50:
        raise RuntimeError("DIVERSITY_GATE_FAILED")

    if report["answers_shared_across_splits"] != 0:
        raise RuntimeError("TARGET_SPLIT_LEAKAGE")

    all_rows = []

    for split, expected_count in EXPECTED_SPLITS.items():
        rows = load_jsonl(CORPUS / f"{split.lower()}.jsonl")

        if len(rows) != expected_count:
            raise RuntimeError(f"PHYSICAL_SPLIT_COUNT_FAILED:{split}")

        for row in rows:
            if row["split"] != split:
                raise RuntimeError(f"SPLIT_LABEL_MISMATCH:{row['record_id']}")

            if row["family"] not in FAMILIES:
                raise RuntimeError(f"UNKNOWN_FAMILY:{row['record_id']}")

            if row["language"] not in {"en", "it"}:
                raise RuntimeError(f"UNKNOWN_LANGUAGE:{row['record_id']}")

            target = compact(row["target"])
            if parse_realization_envelope_v1(target) is None:
                raise RuntimeError(
                    f"REALIZATION_TARGET_CONTRACT_FAILED:{row['record_id']}"
                )

        all_rows.extend(rows)

    for family in sorted(FAMILIES):
        rows = [row for row in all_rows if row["family"] == family]
        en = sum(row["language"] == "en" for row in rows)
        it = sum(row["language"] == "it" for row in rows)

        if not en or not it or abs(en - it) > 1:
            raise RuntimeError(
                f"FAMILY_LANGUAGE_BALANCE_FAILED:{family}:{en}:{it}"
            )

    sequence_path = HERE / "sequence-length.preflight.json"

    if not sequence_path.exists():
        raise RuntimeError("SEQUENCE_LENGTH_PREFLIGHT_REQUIRED")

    sequence = load_json(sequence_path)

    if sequence["candidate_id"] != CONFIG["candidate_id"]:
        raise RuntimeError("SEQUENCE_CANDIDATE_ID_MISMATCH")

    if sequence["base_model"] != CONFIG["base_model"]:
        raise RuntimeError("SEQUENCE_BASE_MODEL_MISMATCH")

    if sequence["base_revision"] != CONFIG["base_revision"]:
        raise RuntimeError("SEQUENCE_BASE_REVISION_MISMATCH")

    if sequence["measured_records"] != sum(EXPECTED_SPLITS.values()):
        raise RuntimeError("SEQUENCE_RECORD_COUNT_FAILED")

    if sequence["seq_limit"] != CONFIG["max_sequence_length"]:
        raise RuntimeError("SEQUENCE_LIMIT_MISMATCH")

    if sequence["records_exceeding_limit"] != 0:
        raise RuntimeError("SEQUENCE_LENGTH_OVERFLOW")

    if sequence["decision"] != "SEQ2048_PHYSICAL_PREFLIGHT_PASS":
        raise RuntimeError("SEQUENCE_LENGTH_PREFLIGHT_FAILED")

    props = torch.cuda.get_device_properties(0)

    environment = {
        "os": platform.platform(),
        "cpu": platform.processor(),
        "ram_bytes": psutil.virtual_memory().total,
        "gpu": props.name,
        "vram_bytes": props.total_memory,
        "cuda": torch.version.cuda,
        "torch": torch.__version__,
        "transformers": transformers.__version__,
        "peft": peft.__version__,
        "python": sys.version,
    }

    return environment


def load_base():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    precision = "bf16" if torch.cuda.is_bf16_supported() else "fp16"
    dtype = torch.bfloat16 if precision == "bf16" else torch.float16

    tokenizer = AutoTokenizer.from_pretrained(
        CONFIG["base_model"],
        revision=CONFIG["base_revision"],
    )
    tokenizer.pad_token = tokenizer.pad_token or tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        CONFIG["base_model"],
        revision=CONFIG["base_revision"],
        torch_dtype=dtype,
    )

    return model, tokenizer, precision


class TrainingDataset:
    def __init__(self, tokenizer, rows):
        import torch

        self.rows = []

        for row in rows:
            prefix = prompt(CONFIG["instruction"], row["input_text"])
            target = compact(row["target"]) + tokenizer.eos_token

            prefix_ids = tokenizer(
                prefix,
                add_special_tokens=True,
            )["input_ids"]

            full_ids = tokenizer(
                prefix + target,
                add_special_tokens=True,
                truncation=False,
            )["input_ids"]

            if len(full_ids) > CONFIG["max_sequence_length"]:
                raise RuntimeError(
                    f"TRAINING_SEQUENCE_OVERFLOW:{row['record_id']}:{len(full_ids)}"
                )

            labels = (
                [-100] * min(len(prefix_ids), len(full_ids))
                + full_ids[len(prefix_ids):]
            )

            if all(label == -100 for label in labels):
                raise RuntimeError(
                    f"EMPTY_TARGET_LABELS:{row['record_id']}"
                )

            self.rows.append({
                "input_ids": torch.tensor(full_ids, dtype=torch.long),
                "labels": torch.tensor(labels, dtype=torch.long),
            })

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        return self.rows[index]


def collator(tokenizer):
    import torch

    def apply(rows):
        width = max(len(row["input_ids"]) for row in rows)

        result = {
            "input_ids": [],
            "labels": [],
            "attention_mask": [],
        }

        for row in rows:
            pad = width - len(row["input_ids"])

            result["input_ids"].append(
                torch.cat([
                    row["input_ids"],
                    torch.full(
                        (pad,),
                        tokenizer.pad_token_id,
                        dtype=torch.long,
                    ),
                ])
            )

            result["labels"].append(
                torch.cat([
                    row["labels"],
                    torch.full(
                        (pad,),
                        -100,
                        dtype=torch.long,
                    ),
                ])
            )

            result["attention_mask"].append(
                torch.cat([
                    torch.ones(
                        len(row["input_ids"]),
                        dtype=torch.long,
                    ),
                    torch.zeros(
                        pad,
                        dtype=torch.long,
                    ),
                ])
            )

        return {
            key: torch.stack(value)
            for key, value in result.items()
        }

    return apply


def persist_artifact(
    model,
    tokenizer,
    artifact_root,
    environment,
    training_metrics,
    lora_modules,
):
    staging = artifact_root.with_name(artifact_root.name + ".tmp")
    shutil.rmtree(staging, ignore_errors=True)

    adapter_dir = staging / "adapter"
    adapter_dir.mkdir(parents=True)

    model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)

    write_json(
        staging / "training.config.json",
        {
            **CONFIG,
            "precision": training_metrics["precision"],
            "lora_target_modules": lora_modules,
        },
    )

    write_json(
        staging / "training.metrics.json",
        training_metrics,
    )

    write_json(
        staging / "environment.manifest.json",
        environment,
    )

    files = sorted(
        path
        for path in staging.rglob("*")
        if path.is_file()
    )

    hashes = {
        path.relative_to(staging).as_posix(): sha_file(path)
        for path in files
    }

    adapter_model = adapter_dir / "adapter_model.safetensors"

    if not adapter_model.exists():
        raise RuntimeError("ADAPTER_MODEL_MISSING")

    manifest = {
        "candidate_id": CONFIG["candidate_id"],
        "candidate_version": CONFIG["candidate_version"],
        "lifecycle_state": "TRAINED_CANDIDATE",
        "artifact_id": "PA-REALIZATION-STUDENT-v0.1-ADAPTER",
        "base_model": CONFIG["base_model"],
        "base_revision": CONFIG["base_revision"],
        "required_output_contract": CONFIG["required_output_contract"],
        "adapter_digest": f"sha256:{sha_file(adapter_model)}",
        "artifact_hashes": hashes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    write_json(
        staging / "candidate.manifest.json",
        manifest,
    )

    files = sorted(
        path
        for path in staging.rglob("*")
        if path.is_file()
    )

    sums = [
        f"{sha_file(path)}  {path.relative_to(staging).as_posix()}"
        for path in files
    ]

    (staging / "SHA256SUMS.txt").write_text(
        "\n".join(sums) + "\n",
        encoding="utf-8",
    )

    (staging / "COMPLETE").write_text(
        "COMPLETE\n",
        encoding="utf-8",
    )

    shutil.rmtree(artifact_root, ignore_errors=True)
    staging.rename(artifact_root)

    return manifest


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--output-root",
        required=True,
        help="Persistent directory for checkpoints and final adapter.",
    )

    parser.add_argument(
        "--resume-from-checkpoint",
        default=None,
    )

    args = parser.parse_args()

    import accelerate
    import peft
    import torch
    import transformers
    from peft import LoraConfig, get_peft_model
    from transformers import Trainer, TrainingArguments

    environment = preflight()

    output_root = Path(args.output_root).resolve()
    checkpoints = output_root / "checkpoints"
    artifact = output_root / "final-adapter"

    output_root.mkdir(parents=True, exist_ok=True)

    write_json(
        output_root / "environment.preflight.json",
        environment,
    )

    base, tokenizer, precision = load_base()

    modules = [
        name
        for name in (
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        )
        if any(
            module_name.endswith(name)
            for module_name, _ in base.named_modules()
        )
    ]

    if not modules:
        raise RuntimeError("LORA_TARGET_DISCOVERY_FAILED")

    model = get_peft_model(
        base,
        LoraConfig(
            r=CONFIG["lora_rank"],
            lora_alpha=CONFIG["lora_alpha"],
            lora_dropout=CONFIG["lora_dropout"],
            target_modules=modules,
            task_type="CAUSAL_LM",
        ),
    )

    model.config.use_cache = False

    train_rows = load_jsonl(CORPUS / "train.jsonl")
    validation_rows = load_jsonl(CORPUS / "validation.jsonl")

    if len(train_rows) != EXPECTED_SPLITS["TRAIN"]:
        raise RuntimeError("TRAINING_RECORD_COUNT_FAILED")

    if len(validation_rows) != EXPECTED_SPLITS["VALIDATION"]:
        raise RuntimeError("VALIDATION_RECORD_COUNT_FAILED")

    training_args = TrainingArguments(
        output_dir=str(checkpoints),
        num_train_epochs=CONFIG["epochs"],
        learning_rate=CONFIG["learning_rate"],
        per_device_train_batch_size=CONFIG["batch_size"],
        per_device_eval_batch_size=CONFIG["batch_size"],
        gradient_accumulation_steps=CONFIG["gradient_accumulation_steps"],
        warmup_ratio=CONFIG["warmup_ratio"],
        lr_scheduler_type=CONFIG["scheduler"],
        optim=CONFIG["optimizer"],
        seed=CONFIG["seed"],
        data_seed=CONFIG["seed"],
        fp16=precision == "fp16",
        bf16=precision == "bf16",
        save_strategy="epoch",
        save_total_limit=3,
        eval_strategy="epoch",
        label_names=["labels"],
        report_to="none",
        logging_steps=20,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=TrainingDataset(tokenizer, train_rows),
        eval_dataset=TrainingDataset(tokenizer, validation_rows),
        data_collator=collator(tokenizer),
    )

    torch.cuda.reset_peak_memory_stats()

    started = time.perf_counter()

    result = trainer.train(
        resume_from_checkpoint=args.resume_from_checkpoint
    )

    duration = time.perf_counter() - started

    final_eval_loss = next(
        (
            entry.get("eval_loss")
            for entry in reversed(trainer.state.log_history)
            if "eval_loss" in entry
        ),
        None,
    )

    metrics = {
        "candidate_id": CONFIG["candidate_id"],
        "precision": precision,
        "duration_seconds": duration,
        "training_loss": result.training_loss,
        "final_validation_loss": final_eval_loss,
        "optimizer_steps": trainer.state.global_step,
        "epochs_completed": trainer.state.epoch,
        "peak_gpu_memory_bytes": torch.cuda.max_memory_allocated(),
        "training_records": len(train_rows),
        "validation_records": len(validation_rows),
        "resume_from_checkpoint": args.resume_from_checkpoint,
        "libraries": {
            "torch": torch.__version__,
            "transformers": transformers.__version__,
            "peft": peft.__version__,
            "accelerate": accelerate.__version__,
        },
    }

    manifest = persist_artifact(
        model,
        tokenizer,
        artifact,
        environment,
        metrics,
        modules,
    )

    write_json(
        output_root / "training-complete.json",
        {
            "candidate_id": CONFIG["candidate_id"],
            "lifecycle_state": "TRAINED_CANDIDATE",
            "adapter_digest": manifest["adapter_digest"],
            "epochs_completed": trainer.state.epoch,
            "optimizer_steps": trainer.state.global_step,
            "training_loss": result.training_loss,
            "final_validation_loss": final_eval_loss,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    print(
        json.dumps(
            {
                "status": "TRAINING_COMPLETE",
                "candidate_id": CONFIG["candidate_id"],
                "artifact": str(artifact),
                "adapter_digest": manifest["adapter_digest"],
                "metrics": metrics,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    del trainer, model, base
    gc.collect()
    torch.cuda.empty_cache()


if __name__ == "__main__":
    main()
